import { NextRequest, NextResponse } from "next/server";
import { gql } from "@/lib/hasura";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateUserRegistration } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    let { name, email, password, role, department_id, gender, college } = body;

    // Security check: If a manager is creating an intern, force the manager's department
    if (session?.user && session.user.role === "manager" && role === "intern") {
      department_id = session.user.department_id;
      body.department_id = department_id;
    }

    const validation = validateUserRegistration(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    if (!department_id) {
      return NextResponse.json({ error: "Missing department field" }, { status: 400 });
    }

    if (role !== "manager" && role !== "intern") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const mutation = `mutation ($name:String!, $email:String!, $password:String!, $role:String!, $department_id:Int!, $gender:String, $college:String) {
      insert_users_one(object: {
        name: $name,
        email: $email,
        password: $password,
        role: $role,
        department_id: $department_id,
        gender: $gender,
        college: $college
      }) {
        id
      }
    }`;

    const variables = {
      name,
      email,
      password,
      role,
      department_id: parseInt(department_id),
      gender: role === "intern" ? gender : null,
      college: role === "intern" ? college : null,
    };

    const res = await gql(mutation, variables);

    if (res.errors) {
      return NextResponse.json({ error: res.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user_id: res.data?.insert_users_one?.id });
  } catch (err) {
    console.error("POST /api/signup Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
