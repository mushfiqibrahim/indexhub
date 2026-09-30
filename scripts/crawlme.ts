/**
 * CrawlMe client script.
 *
 * crawlme.net's real API (endpoint, auth scheme, payload, response shape) is NOT
 * verified — fill in every [API] placeholder below from the docs in your account.
 *
 * Usage:
 *   npx tsx scripts/crawlme.ts submit https://example.com/a https://example.com/b
 *   npx tsx scripts/crawlme.ts submit --file urls.txt
 *   npx tsx scripts/crawlme.ts sitemap https://example.com/sitemap.xml
 *   npx tsx scripts/crawlme.ts status <jobId>
 *
 * Env: CRAWLME_API_URL, CRAWLME_API_KEY (or edit the constants).
 */
import { readFileSync } from "node:fs";
import { fetchSitemapUrls } from "../src/lib/sitemap";

// ---- [API] configuration -------------------------------------------------
const API_BASE = process.env.CRAWLME_API_URL ?? "[API]"; // e.g. https://.../v1
const API_KEY = process.env.CRAWLME_API_KEY ?? "[API]";
const ENDPOINTS = {
  submit: "[API]", // e.g. "/urls" or "/index"
  status: "[API]", // e.g. "/jobs/{id}"  ({id} is replaced)
};
/** How the key is sent. Change to match the docs (Bearer, x-api-key, query param...). */
const authHeaders = (): Record<string, string> => ({ Authorization: `Bearer ${API_KEY}` }); // [API]
/** Request body for a submission. Change field names to match the docs. */
const buildSubmitBody = (urls: string[]) => ({ urls }); // [API]
// --------------------------------------------------------------------------

const BATCH_SIZE = 100; // [API] adjust to the provider's per-request limit
const RETRIES = 3;

function assertConfigured(...values: string[]) {
  if (values.some((v) => v === "[API]")) {
    throw new Error("CrawlMe API is not configured: replace the [API] placeholders (see top of scripts/crawlme.ts).");
  }
}

async function call(path: string, init: RequestInit = {}) {
  let lastErr: unknown;
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const res = await fetch(API_BASE + path, {
        ...init,
        headers: { "content-type": "application/json", ...authHeaders(), ...init.headers },
      });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      let body: unknown = text;
      try { body = JSON.parse(text); } catch { /* keep text */ }
      return { ok: res.ok, status: res.status, body };
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
    }
  }
  throw lastErr;
}

export async function submitUrls(urls: string[]) {
  assertConfigured(API_BASE, API_KEY, ENDPOINTS.submit);
  const unique = [...new Set(urls.map((u) => new URL(u).toString()))];
  const results = [];
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    results.push({ batch: batch.length, ...(await call(ENDPOINTS.submit, { method: "POST", body: JSON.stringify(buildSubmitBody(batch)) })) });
  }
  return results;
}

export async function getStatus(id: string) {
  assertConfigured(API_BASE, API_KEY, ENDPOINTS.status);
  return call(ENDPOINTS.status.replace("{id}", encodeURIComponent(id)));
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  switch (cmd) {
    case "submit": {
      const fileIdx = args.indexOf("--file");
      const urls = fileIdx >= 0
        ? readFileSync(args[fileIdx + 1], "utf8").split(/\s+/).filter(Boolean)
        : args;
      if (!urls.length) throw new Error("No URLs given");
      console.log(JSON.stringify(await submitUrls(urls), null, 2));
      break;
    }
    case "sitemap": {
      if (!args[0]) throw new Error("Sitemap URL required");
      const urls = await fetchSitemapUrls(args[0]);
      console.error(`Found ${urls.length} URLs in sitemap`);
      console.log(JSON.stringify(await submitUrls(urls), null, 2));
      break;
    }
    case "status":
      if (!args[0]) throw new Error("Job id required");
      console.log(JSON.stringify(await getStatus(args[0]), null, 2));
      break;
    default:
      console.error("Usage: crawlme.ts <submit|sitemap|status> ...");
      process.exit(1);
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
