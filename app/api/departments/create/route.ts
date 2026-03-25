import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gql } from "@/lib/hasura";
import { isValidDepartmentName } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name } = await req.json();
    if (!isValidDepartmentName(name)) {
      return NextResponse.json({ error: "Department name must be at least 2 characters long." }, { status: 400 });
    }

    const mutation = `mutation ($name: String!) {
      insert_departments_one(object: {name: $name}) { id name }
    }`;
    
    const res = await gql(mutation, { name });

    if (res.errors) {
      return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
    }

    return NextResponse.json({ department: res.data?.insert_departments_one });
  } catch (err) {
    console.error("POST /api/departments/create Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
