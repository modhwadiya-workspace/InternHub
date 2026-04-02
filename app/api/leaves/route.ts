import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gql } from "@/lib/hasura";
import { validateLeaveRequest } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    const userId = session.user.id;

    let query = "";
    let variables = {};

    if (role === "intern") {
      query = `query ($user_id: uuid!) {
        leaves(where: {user_id: {_eq: $user_id}}, order_by: {created_at: desc}) {
          id
          start_date
          end_date
          reason
          leave_type
          status
          created_at
        }
      }`;
      variables = { user_id: userId };
    } else if (role === "manager") {
      const managerDeptId = session.user.department_id;
      query = `query ($department_id: Int!) {
        leaves(where: {user: {department_id: {_eq: $department_id}, role: {_eq: "intern"}}}, order_by: {created_at: desc}) {
          id
          user_id
          user {
            name
            email
          }
          start_date
          end_date
          reason
          leave_type
          status
          created_at
        }
      }`;
      variables = { department_id: managerDeptId };
    } else {
      // Admin sees all
      query = `query {
        leaves(order_by: {created_at: desc}) {
          id
          user_id
          user {
            name
            email
          }
          start_date
          end_date
          reason
          leave_type
          status
          created_at
        }
      }`;
    }

    const res = await gql(query, variables, session.hasuraToken as string);
    return NextResponse.json({ leaves: res.data?.leaves || [] });
  } catch (err) {
    console.error("GET /api/leaves Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = validateLeaveRequest(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const mutation = `mutation ($user_id: uuid!, $start_date: date!, $end_date: date!, $reason: String!, $leave_type: String!) {
      insert_leaves_one(object: {
        user_id: $user_id,
        start_date: $start_date,
        end_date: $end_date,
        reason: $reason,
        leave_type: $leave_type
      }) {
        id
      }
    }`;

    const variables = {
      user_id: session.user.id,
      start_date: body.start_date,
      end_date: body.end_date,
      reason: body.reason,
      leave_type: body.leave_type,
    };

    const res = await gql(mutation, variables, session.hasuraToken as string);
    if (res.errors) return NextResponse.json({ error: res.errors[0].message }, { status: 400 });

    return NextResponse.json({ success: true, leaf: res.data.insert_leaves_one });
  } catch (err) {
    console.error("POST /api/leaves Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role === "intern") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !["approved", "rejected"].includes(status)) {
        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Role-based security for Manager: Can only update intern leaves in their department
    if (session.user.role === "manager") {
      const managerDeptId = session.user.department_id;
      const checkQuery = `query ($id: uuid!, $dept_id: Int!) {
          leaves(where: {id: {_eq: $id}, user: {department_id: {_eq: $dept_id}, role: {_eq: "intern"}}}) {
            id
          }
      }`;
      const checkRes = await gql(checkQuery, { id, dept_id: managerDeptId }, session.hasuraToken as string);
      if (!checkRes.data?.leaves?.length) {
          return NextResponse.json({ error: "Unauthorized access to this leave request (must be from your department's intern)" }, { status: 403 });
      }
    }

    const mutation = `mutation ($id: uuid!, $status: String!) {
      update_leaves_by_pk(pk_columns: {id: $id}, _set: {status: $status}) {
        id
        status
      }
    }`;

    const res = await gql(mutation, { id, status }, session.hasuraToken as string);
    if (res.errors) return NextResponse.json({ error: res.errors[0].message }, { status: 400 });

    return NextResponse.json({ success: true, leaf: res.data.update_leaves_by_pk });
  } catch (err) {
    console.error("PATCH /api/leaves Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
