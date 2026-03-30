import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const VANNA_BACKEND_URL = process.env.VANNA_BACKEND_URL || "http://localhost:8000";

interface ChatRequest {
  question: string;
  max_results?: number;
}

interface ChatResponse {
  question: string;
  sql?: string;
  results?: Array<Record<string, any>>;
  error?: string;
}

// Sensitive fields that should never be exposed to users
const SENSITIVE_FIELDS = [
  "id",
  "password",
  "user_id",
  "date_of_birth",
  "created_by",
];

/**
 * Remove sensitive fields from query results
 * Even if LLM includes them, we filter them out before returning to frontend
 */
function filterSensitiveFields(
  results: Array<Record<string, any>>
): Array<Record<string, any>> {
  if (!results || !Array.isArray(results)) {
    return results;
  }

  return results.map((row) => {
    const filtered: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      // Check if key matches any sensitive field (case-insensitive)
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_FIELDS.some(
        (field) => lowerKey === field || lowerKey.endsWith("_" + field)
      );

      if (!isSensitive) {
        filtered[key] = row[key];
      }
    });
    return filtered;
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get session and verify admin role
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    if (session.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Only admins can access the chat." },
        { status: 403 }
      );
    }

    // Parse request body
    const body: ChatRequest = await request.json();
    const { question, max_results = 100 } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question cannot be empty." },
        { status: 400 }
      );
    }

    // Call Vanna backend
    const response = await fetch(`${VANNA_BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: question.trim(),
        max_results,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: `Backend error: ${errorData.detail || "Unknown error"}` },
        { status: response.status }
      );
    }

    const data: ChatResponse = await response.json();

    // Apply sensitive field filtering (defense in depth)
    if (data.results && Array.isArray(data.results)) {
      data.results = filterSensitiveFields(data.results);
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: `An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { message: "Chat API endpoint. Use POST to send questions." },
    { status: 200 }
  );
}
