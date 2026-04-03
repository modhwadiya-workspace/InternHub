import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gql } from "@/lib/hasura";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role === "intern") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id || typeof id !== "string" && typeof id !== "number") {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Role-based deletion logic for Managers
    if (session.user.role === "manager") {
      // Before deleting, verify the user is an intern AND belongs to the manager's department
      const checkQuery = `query { users_by_pk(id: "${id}") { role department_id } }`;
      const checkRes = await gql(checkQuery, {}, session.hasuraToken as string);
      const targetUser = checkRes.data?.users_by_pk;

      if (!targetUser || targetUser.role !== "intern" || targetUser.department_id !== session.user.department_id) {
        return NextResponse.json({ error: "Forbidden: Cannot delete this user" }, { status: 403 });
      }
    }

    const mutation = `mutation { delete_users_by_pk(id: "${id}") { id } }`;
    const res = await gql(mutation, {}, session.hasuraToken as string);

    if (res.errors) {
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted_id: res.data?.delete_users_by_pk?.id });
  } catch (err) {
    console.error("POST /api/users/delete Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
