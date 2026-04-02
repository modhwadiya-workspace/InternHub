import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gql } from "@/lib/hasura";
import { isValidPassword } from "@/lib/validation";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both current and new passwords are required." }, { status: 400 });
    }

    if (!isValidPassword(newPassword)) {
      return NextResponse.json({ error: "New password must be at least 6 characters long." }, { status: 400 });
    }

    // Fetch the stored (possibly hashed) password for this user
    const fetchQuery = `query ($id: uuid!) {
      users_by_pk(id: $id) {
        password
      }
    }`;

    const fetchRes = await gql(fetchQuery, { id: String(session.user.id) }, session.hasuraToken as string);

    if (fetchRes.errors || !fetchRes.data?.users_by_pk) {
      return NextResponse.json({ error: "Error verifying password." }, { status: 500 });
    }

    const storedPassword: string = fetchRes.data.users_by_pk.password;

    // Try bcrypt compare first (for hashed passwords), then fall back to plain-text (legacy)
    const bcryptMatch = await bcrypt.compare(currentPassword, storedPassword).catch(() => false);
    const legacyMatch = !bcryptMatch && storedPassword === currentPassword;

    if (!bcryptMatch && !legacyMatch) {
      return NextResponse.json({ error: "Incorrect current password." }, { status: 400 });
    }

    // Hash the new password before storing
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    const updateMutation = `mutation ($id: uuid!, $newPassword: String!) {
      update_users_by_pk(pk_columns: {id: $id}, _set: {password: $newPassword}) {
        id
      }
    }`;

    const updateRes = await gql(updateMutation, {
      id: String(session.user.id),
      newPassword: hashedNewPassword
    }, session.hasuraToken as string);

    if (updateRes.errors) {
      return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Change Password Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
