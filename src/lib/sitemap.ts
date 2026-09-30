import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: true });
const asArray = <T>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/** Fetch a sitemap (or sitemap index, up to `maxDepth` levels) and return page URLs. */
export async function fetchSitemapUrls(sitemapUrl: string, maxDepth = 2, limit = 5000): Promise<string[]> {
  const res = await fetch(sitemapUrl, { headers: { "user-agent": "IndexHubBot/0.1" } });
  if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
  const xml = parser.parse(await res.text());

  if (xml.sitemapindex && maxDepth > 0) {
    const children = asArray<{ loc: string }>(xml.sitemapindex.sitemap).map((s) => s.loc);
    const out: string[] = [];
    for (const child of children) {
      out.push(...(await fetchSitemapUrls(child, maxDepth - 1, limit - out.length)));
      if (out.length >= limit) break;
    }
    return out.slice(0, limit);
  }
  return asArray<{ loc: string }>(xml.urlset?.url).map((u) => u.loc).slice(0, limit);
}
