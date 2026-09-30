import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { inspectUrl } from "@/lib/google";
import { requireApiKey } from "@/lib/http";

const Body = z.object({ siteUrl: z.string().min(1), urls: z.array(z.string().url()).min(1).max(50) });

export async function POST(req: NextRequest) {
  const denied = requireApiKey(req);
  if (denied) return denied;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const results = [];
  for (const u of parsed.data.urls) {
    results.push(await inspectUrl(parsed.data.siteUrl, u).catch((e) => ({ url: u, error: String(e.message) })));
  }
  return NextResponse.json({ results });
}
