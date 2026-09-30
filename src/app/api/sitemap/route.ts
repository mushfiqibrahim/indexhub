import { NextRequest, NextResponse } from "next/server";
import { fetchSitemapUrls } from "@/lib/sitemap";
import { requireApiKey } from "@/lib/http";

export async function GET(req: NextRequest) {
  const denied = requireApiKey(req);
  if (denied) return denied;
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url query param required" }, { status: 400 });
  try {
    const urls = await fetchSitemapUrls(url);
    return NextResponse.json({ count: urls.length, urls });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
