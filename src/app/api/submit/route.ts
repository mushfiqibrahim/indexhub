import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { publishUrl } from "@/lib/google";
import { submitIndexNow } from "@/lib/indexnow";
import { remaining, reserve } from "@/lib/quota";
import { requireApiKey } from "@/lib/http";

const Body = z.object({
  urls: z.array(z.string().url()).min(1).max(1000),
  type: z.enum(["URL_UPDATED", "URL_DELETED"]).default("URL_UPDATED"),
  google: z.boolean().default(true),
  indexNow: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const denied = requireApiKey(req);
  if (denied) return denied;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { urls, type, google, indexNow } = parsed.data;
  const unique = [...new Set(urls)];

  const out: Record<string, unknown> = { submitted: unique.length };

  if (google) {
    const granted = reserve(unique.length);
    const results = [];
    for (const url of unique.slice(0, granted)) results.push(await publishUrl(url, type));
    out.google = {
      results,
      skippedForQuota: unique.slice(granted),
      quotaRemaining: remaining(),
    };
  }

  if (indexNow) {
    const byHost = new Map<string, string[]>();
    for (const u of unique) byHost.set(new URL(u).host, [...(byHost.get(new URL(u).host) ?? []), u]);
    const results = [];
    for (const [host, list] of byHost) {
      results.push({ host, ...(await submitIndexNow(list).catch((e) => ({ ok: false, status: 500, error: String(e.message) }))) });
    }
    out.indexNow = results;
  }

  return NextResponse.json(out);
}
