import { GoogleAuth } from "google-auth-library";

const INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing";
const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export type NotificationType = "URL_UPDATED" | "URL_DELETED";

function auth(scope: string) {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  return new GoogleAuth({ credentials: JSON.parse(raw), scopes: [scope] });
}

export interface PublishResult {
  url: string;
  ok: boolean;
  status: number;
  error?: string;
}

/** Notify Google's Indexing API. Officially supports JobPosting / BroadcastEvent pages only. */
export async function publishUrl(url: string, type: NotificationType = "URL_UPDATED"): Promise<PublishResult> {
  const client = await auth(INDEXING_SCOPE).getClient();
  try {
    const res = await client.request({
      url: INDEXING_ENDPOINT,
      method: "POST",
      data: { url, type },
    });
    return { url, ok: true, status: res.status };
  } catch (e: any) {
    return {
      url,
      ok: false,
      status: e?.response?.status ?? 500,
      error: e?.response?.data?.error?.message ?? e?.message ?? "unknown error",
    };
  }
}

/** Search Console URL Inspection (read-only). `siteUrl` must match a verified property. */
export async function inspectUrl(siteUrl: string, inspectionUrl: string) {
  const client = await auth(SEARCH_CONSOLE_SCOPE).getClient();
  const res = await client.request<any>({
    url: "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
    method: "POST",
    data: { inspectionUrl, siteUrl },
  });
  const r = res.data?.inspectionResult?.indexStatusResult ?? {};
  return {
    url: inspectionUrl,
    verdict: r.verdict as string | undefined,
    coverageState: r.coverageState as string | undefined,
    lastCrawlTime: r.lastCrawlTime as string | undefined,
    googleCanonical: r.googleCanonical as string | undefined,
  };
}
