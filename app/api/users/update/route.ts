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
    const { id, name, email, department_id, college, gender, contact_number, joining_date, status, role } = body;

    const validation = validateUserUpdate({ name, email, college, role, contact_number });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const userId = String(id);
    if (!id || typeof userId !== "string") {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const checkQuery = `query { users_by_pk(id: "${userId}") { role department_id } }`;
    const checkRes = await gql(checkQuery);
    const targetUser = checkRes.data?.users_by_pk;

    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // RBAC Permissions Check
    if (session.user.role === "intern") {
      if (String(session.user.id) !== userId) {
        return NextResponse.json({ error: "Forbidden: Cannot update other users" }, { status: 403 });
      }
    } else if (session.user.role === "manager") {
      if (targetUser.role !== "intern" || targetUser.department_id !== session.user.department_id) {
        return NextResponse.json({ error: "Forbidden: Cannot update this user" }, { status: 403 });
      }
    }

    const mutation = `mutation ($id: uuid!, $name: String!, $email: String, $department_id: Int, $gender: String, $contact_number: String) {
      update_users_by_pk(pk_columns: {id: $id}, _set: {name: $name, email: $email, department_id: $department_id, gender: $gender, contact_number: $contact_number}) {
        id
        role
        name
      }
    }`;

    const variables = {
      id: userId,
      name,
      email: email ?? null,
      department_id: department_id ? Number(department_id) : null,
      gender: gender ?? null,
      contact_number: contact_number ?? null,
    };

    const res = await gql(mutation, variables);

    if (res.errors) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    if (targetUser.role === "intern") {
      let internSet: any = { college: college ?? null };
      
      let customSets = [`collage: $collage`, `contact_number: $contact_number`];
      let variablesPayload: any = {
        user_id: userId,
        collage: college ?? null,
        contact_number: contact_number ?? null,
      };

      if (session.user.role === "admin" || session.user.role === "manager") {
        if (joining_date) {
          customSets.push(`joining_date: $joining_date`);
          variablesPayload.joining_date = joining_date;
        }
        if (status) {
          customSets.push(`status: $status`);
          variablesPayload.status = status;
        }
      }

      const internMutation = `mutation ($user_id: uuid!, $collage: String, $contact_number: String ${variablesPayload.joining_date ? ', $joining_date: date' : ''} ${variablesPayload.status ? ', $status: String' : ''}) {
        update_interns(where: {user_id: {_eq: $user_id}}, _set: {${customSets.join(', ')}}) {
          affected_rows
        }
      }`;

      await gql(internMutation, variablesPayload);
    }

    return NextResponse.json({ success: true, user: res.data?.update_users_by_pk });
  } catch (err) {
    console.error("POST /api/users/update Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
