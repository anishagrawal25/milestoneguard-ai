import { NextRequest, NextResponse } from "next/server";

export async function parseJsonBody<T = any>(
  req: NextRequest
): Promise<{ data: T; errorResponse: null } | { data: null; errorResponse: NextResponse }> {
  try {
    const data = await req.json();
    return { data, errorResponse: null };
  } catch {
    return {
      data: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }
}
