import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gql } from "@/lib/hasura";
import { validateUserUpdate } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, email, department_id, college, gender } = body;

    const validation = validateUserUpdate({ name, email, college, role: college || gender ? "intern" : "manager" });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const userId = String(id);
    if (!id || typeof userId !== "string") {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Security Check: Interns can ONLY update their own data.
    if (session.user.role === "intern") {
      const sessionId = String(session.user.id);
      if (!session.user.id || sessionId !== userId) {
        return NextResponse.json({ error: "Forbidden: Cannot update other users" }, { status: 403 });
      }
    }

    // Check manager permissions (Manager can only update interns in their department)
    if (session.user.role === "manager") {
      const checkQuery = `query { users_by_pk(id: "${userId}") { role department_id } }`;
      const checkRes = await gql(checkQuery);
      const targetUser = checkRes.data?.users_by_pk;

      if (!targetUser || targetUser.role !== "intern" || targetUser.department_id !== session.user.department_id) {
        return NextResponse.json({ error: "Forbidden: Cannot update this user" }, { status: 403 });
      }
    }

    const mutation = `mutation ($id: uuid!, $name: String!, $email: String, $department_id: Int, $college: String, $gender: String) {
      update_users_by_pk(pk_columns: {id: $id}, _set: {name: $name, email: $email, department_id: $department_id, college: $college, gender: $gender}) {
        id
        name
        email
        department_id
        college
        gender
      }
    }`;

    const variables = {
      id: userId,
      name,
      email: email ?? null,
      department_id: department_id != null ? Number(department_id) : null,
      college: college ?? null,
      gender: gender ?? null,
    };

    const res = await gql(mutation, variables);

    if (res.errors) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: res.data?.update_users_by_pk });
  } catch (err) {
    console.error("POST /api/users/update Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
