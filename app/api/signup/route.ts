import { NextRequest, NextResponse } from "next/server";
import { gql } from "@/lib/hasura";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateUserRegistration } from "@/lib/validation";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    let { name, email, password, role, department_id, gender, college, contact_number, joining_date } = body;

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

    const mutation = `mutation ($name:String!, $email:String!, $password:String!, $role:String!, $department_id:Int!, $gender:String, $contact_number:String!) {
      insert_users_one(object: {
        name: $name,
        email: $email,
        password: $password,
        role: $role,
        department_id: $department_id,
        gender: $gender,
        contact_number: $contact_number
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
      contact_number,
      gender: gender || null,
    };

    const res = await gql(mutation, variables);

    if (res.errors) {
      return NextResponse.json({ error: res.errors[0].message }, { status: 400 });
    }

    const userId = res.data?.insert_users_one?.id;

    if (role === "intern") {
      const internMutation = `mutation ($id:uuid!, $user_id:uuid!, $collage:String, $joining_date:date, $contact_number:String!, $status:String!) {
        insert_interns_one(object: {
          id: $id,
          user_id: $user_id,
          collage: $collage,
          joining_date: $joining_date,
          contact_number: $contact_number,
          status: $status
        }) {
          id
        }
      }`;
      const internVariables = {
        id: crypto.randomUUID(),
        user_id: userId,
        collage: college || null,
        joining_date: joining_date || new Date().toISOString().split('T')[0],
        contact_number: contact_number,
        status: "active",
      };
      const internRes = await gql(internMutation, internVariables);
      
      if (internRes.errors) {
        console.error("Intern Insert Error:", internRes.errors);
        return NextResponse.json({ error: `User created but intern details failed to insert: ${internRes.errors[0].message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, user_id: userId });
  } catch (err) {
    console.error("POST /api/signup Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
