import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gql } from "@/lib/hasura";

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

    let whereClause = `_and: [`;

    if (!isAdmin) {
      whereClause += `{role: {_eq: "intern"}}, {department_id: {_eq: ${managerDeptId}}}, `;
    } else if (roleParam) {
      whereClause += `{role: {_eq: "${roleParam}"}}, `;
    }

    // Grab frontend filters if provided
    const nameFilter = searchParams.get("name");
    const deptFilter = searchParams.get("department_id");
    const genderFilter = searchParams.get("gender");
    const collegeFilter = searchParams.get("college");

    if (nameFilter) whereClause += `{name: {_ilike: "%${nameFilter}%"}}, `;
    if (deptFilter && isAdmin) whereClause += `{department_id: {_eq: ${deptFilter}}}, `;
    if (genderFilter) whereClause += `{gender: {_eq: "${genderFilter}"}}, `;
    if (collegeFilter) whereClause += `{college: {_ilike: "%${collegeFilter}%"}}, `;

    whereClause += `]`;

    const query = `query {
      users(where: {${whereClause}}, order_by: {created_at: desc}) {
        id
        name
        email
        role
        gender
        contact_number
        department_id
      }
      interns {
        user_id
        college: collage
        joining_date
        status
      }
    }`;

    const res = await gql(query);

    if (res.errors) {
      console.error("GET /api/users GraphQL Errors:", res.errors);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    const fetchedUsers = res.data?.users || [];
    const fetchedInterns = res.data?.interns || [];

    const mappedUsers = fetchedUsers.map((user: any) => {
      if (user.role === "intern") {
        const internData = fetchedInterns.filter((i: any) => i.user_id === user.id);
        return { ...user, interns: internData };
      }
      return user;
    });

    return NextResponse.json({ users: mappedUsers });
  } catch (err) {
    console.error("GET /api/users Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
