import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gql } from "@/lib/hasura";
import bcrypt from "bcryptjs";
import { friendlyDbError } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role === "intern") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role");

    // RBAC: Manager can only see interns in their department
    const isAdmin = session.user.role === "admin";
    const managerDeptId = session.user.department_id;

    // Construct the where clause using an array to avoid trailing commas
    const filters: string[] = [];

    if (!isAdmin) {
      // Logic for Manager: Only see interns in their department
      filters.push(`{role: {_eq: "intern"}}`);
      filters.push(`{department_id: {_eq: ${managerDeptId}}}`);
    } else if (roleParam) {
      // Logic for Admin filtering by role
      filters.push(`{role: {_eq: "${roleParam}"}}`);
    }

    const deptFilter = searchParams.get("department_id");
    if (deptFilter && isAdmin) {
      filters.push(`{department_id: {_eq: ${deptFilter}}}`);
    }

    const genderFilter = searchParams.get("gender");
    if (genderFilter) {
      filters.push(`{gender: {_eq: "${genderFilter}"}}`);
    }

    const searchFilter = searchParams.get("search");
    if (searchFilter) {
      filters.push(`{_or: [
        {name: {_ilike: "%${searchFilter}%"}},
        {email: {_ilike: "%${searchFilter}%"}},
        {interns: {college: {_ilike: "%${searchFilter}%"}}}
      ]}`);
    }

    const whereClause = filters.length > 0 ? `where: {_and: [${filters.join(", ")}]}` : "";

    const query = `query {
      users(${whereClause}, order_by: {created_at: desc}) {
        id
        name
        email
        role
        gender
        contact_number
        department_id
        interns {
          college
          joining_date
          status
        }
      }
    }`;

    const res = await gql(query);

    if (res.errors) {
      console.error("GET /api/users GraphQL Errors:", res.errors);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    return NextResponse.json({ users: res.data?.users || [] });
  } catch (err) {
    console.error("GET /api/users Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, email, role, department_id, gender } = await req.json();

    const hashedPassword = await bcrypt.hash("password123", 12);

    const mutation = `
      mutation ($name: String!, $email: String!, $role: String!, $department_id: Int, $gender: String, $password: String!) {
        insert_users_one(object: {
          name: $name,
          email: $email,
          role: $role,
          department_id: $department_id,
          gender: $gender,
          password: $password
        }) {
          id
        }
      }
    `;

    const res = await gql(mutation, { name, email, role, department_id, gender, password: hashedPassword });

    if (res.errors) {
      return NextResponse.json({ error: friendlyDbError(res.errors[0].message) }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: res.data.insert_users_one });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
