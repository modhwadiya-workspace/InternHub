import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gql } from "@/lib/hasura";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    const mutation = `mutation ($id: Int!) {
      delete_departments_by_pk(id: $id) { id }
    }`;
    
    const res = await gql(mutation, { id });

    if (res.errors) {
      return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted_id: res.data?.delete_departments_by_pk?.id });
  } catch (err) {
    console.error("POST /api/departments/delete Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
