import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gql } from "@/lib/hasura";
import { validateTaskCreation } from "@/lib/validation";

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
        tasks(where: {assigned_to: {_eq: $user_id}}, order_by: {created_at: desc}) {
          id
          title
          description
          status
          priority
          due_date
          created_at
          group_id
          completed_at
          created_by_user {
            name
          }
        }
      }`;
      variables = { user_id: userId };
    } else {
      query = `query {
        tasks(order_by: {created_at: desc}) {
          id
          title
          description
          status
          priority
          due_date
          created_at
          group_id
          completed_at
          assigned_to_user {
            id
            name
            email
          }
          created_by_user {
            name
          }
        }
      }`;
    }

    const res = await gql(query, variables);
    return NextResponse.json({ tasks: res.data?.tasks || [] });
  } catch (err) {
    console.error("GET /api/tasks Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only Admin/Manager can create tasks
    if (session.user.role === "intern") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = validateTaskCreation(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const assignedToArray = Array.isArray(body.assigned_to) ? body.assigned_to : [body.assigned_to];
    const groupId = assignedToArray.length > 1 ? crypto.randomUUID() : null;
    
    // Prepare objects for multiple assignees
    const taskObjects = assignedToArray.map((userId: string) => ({
      title: body.title,
      description: body.description || null,
      assigned_to: userId,
      created_by: session.user.id,
      due_date: body.due_date || null,
      priority: body.priority || "medium",
      group_id: groupId,
    }));

    const mutation = `mutation ($objects: [tasks_insert_input!]!) {
      insert_tasks(objects: $objects) {
        affected_rows
        returning {
          id
        }
      }
    }`;

    const res = await gql(mutation, { objects: taskObjects });
    if (res.errors) return NextResponse.json({ error: res.errors[0].message }, { status: 400 });

    return NextResponse.json({ 
      success: true, 
      count: res.data.insert_tasks.affected_rows,
      tasks: res.data.insert_tasks.returning 
    });
  } catch (err) {
    console.error("POST /api/tasks Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, status } = body;

    if (!id || !["todo", "in_progress", "completed"].includes(status)) {
        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Only Assigned Intern can update their task's status.
    // Admin/Manager can NOT update status (they only create).
    if (session.user.role !== "intern") {
       return NextResponse.json({ error: "Only interns can update task status" }, { status: 403 });
    }

    const checkQuery = `query ($taskId: uuid!, $userId: uuid!) {
       tasks(where: {id: {_eq: $taskId}, assigned_to: {_eq: $userId}}) {
          id
       }
    }`;
    const checkRes = await gql(checkQuery, { taskId: id, userId: session.user.id });
    if (!checkRes.data?.tasks?.length) {
       return NextResponse.json({ error: "Unauthorized access to this task (must be assigned to you)" }, { status: 403 });
    }

    const mutation = `mutation ($id: uuid!, $status: String!, $completed_at: timestamptz) {
      update_tasks_by_pk(pk_columns: {id: $id}, _set: {status: $status, completed_at: $completed_at}) {
        id
        status
        completed_at
      }
    }`;

    const variables = { 
      id, 
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null
    };

    const res = await gql(mutation, variables);
    if (res.errors) return NextResponse.json({ error: res.errors[0].message }, { status: 400 });

    return NextResponse.json({ success: true, task: res.data.update_tasks_by_pk });
  } catch (err) {
    console.error("PATCH /api/tasks Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "intern") {
       return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, group_id, title, description, priority, due_date, assigned_to } = body;

    if (!title || !priority || !assigned_to) {
       return NextResponse.json({ error: "Title, priority, and assigned interns are required" }, { status: 400 });
    }

    const assignedToArray = Array.isArray(assigned_to) ? assigned_to : [assigned_to];
    let finalGroupId = group_id;

    // If it was a single task and now has multiple interns, or we just want to ensure grouping, generate a group_id
    if (!finalGroupId && assignedToArray.length > 1) {
       finalGroupId = crypto.randomUUID();
    }

    // 1. Fetch current assignments to see what's changed
    const fetchQuery = finalGroupId 
       ? `query($group_id: uuid!) { tasks(where: {group_id: {_eq: $group_id}}) { id assigned_to } }`
       : `query($id: uuid!) { tasks(where: {id: {_eq: $id}}) { id assigned_to } }`;
    
    const currentRes = await gql(fetchQuery, finalGroupId ? { group_id: finalGroupId } : { id });
    const currentAssignments = currentRes.data?.tasks || [];
    const currentInternIds = currentAssignments.map((a: any) => a.assigned_to);

    // 2. Identify additions and removals
    const toAdd = assignedToArray.filter((id: string) => !currentInternIds.includes(id));
    const toRemove = currentInternIds.filter((id: string) => !assignedToArray.includes(id));
    const toUpdate = currentInternIds.filter((id: string) => assignedToArray.includes(id));

    // 3. Perform the Sync
    // Update existing assignments
    if (toUpdate.length > 0) {
       const updateMutation = `mutation($ids: [uuid!]!, $set: tasks_set_input!) {
          update_tasks(where: {id: {_in: $ids}}, _set: $set) { affected_rows }
       }`;
       const updateIds = currentAssignments.filter((a: any) => toUpdate.includes(a.assigned_to)).map((a: any) => a.id);
       await gql(updateMutation, { ids: updateIds, set: { title, description, priority, due_date, group_id: finalGroupId } });
    }

    // Remove old ones
    if (toRemove.length > 0) {
       const deleteMutation = `mutation($ids: [uuid!]!) {
          delete_tasks(where: {id: {_in: $ids}}) { affected_rows }
       }`;
       const deleteIds = currentAssignments.filter((a: any) => toRemove.includes(a.assigned_to)).map((a: any) => a.id);
       await gql(deleteMutation, { ids: deleteIds });
    }

    // Add new ones
    if (toAdd.length > 0) {
       const insertMutation = `mutation($objects: [tasks_insert_input!]!) {
          insert_tasks(objects: $objects) { affected_rows }
       }`;
       const newTasks = toAdd.map(internId => ({
          title, description, priority, due_date,
          assigned_to: internId,
          created_by: session.user.id,
          group_id: finalGroupId
       }));
       await gql(insertMutation, { objects: newTasks });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT /api/tasks Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only Admin/Manager can delete tasks
    if (session.user.role === "intern") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const group_id = searchParams.get("group_id");

    if (!id && !group_id) {
      return NextResponse.json({ error: "Task ID or Group ID is required." }, { status: 400 });
    }

    let mutation: string;
    let variables: any;

    if (group_id) {
      // Delete all tasks in a group
      mutation = `mutation ($group_id: uuid!) {
        delete_tasks(where: {group_id: {_eq: $group_id}}) {
          affected_rows
        }
      }`;
      variables = { group_id };
    } else {
      // Delete a single task
      mutation = `mutation ($id: uuid!) {
        delete_tasks_by_pk(id: $id) {
          id
        }
      }`;
      variables = { id };
    }

    const res = await gql(mutation, variables);
    if (res.errors) {
      return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/tasks Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
