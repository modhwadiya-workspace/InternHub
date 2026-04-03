import { NextResponse } from "next/server";
import { gqlAdmin } from "@/lib/hasura";

export async function GET() {
  try {
    const query = `query { departments(order_by: {id: asc}) { id name } }`;
    const res = await gqlAdmin(query);

    if (res.errors) {
      return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
    }

    return NextResponse.json({ departments: res.data?.departments || [] });
  } catch (err) {
    console.error("GET /api/departments Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
