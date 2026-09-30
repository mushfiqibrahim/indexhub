import { NextRequest, NextResponse } from "next/server";

/** Returns an error response if the shared API key is missing/wrong, else null. */
export function requireApiKey(req: NextRequest): NextResponse | null {
  const expected = process.env.API_KEY;
  if (!expected || req.headers.get("x-api-key") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
