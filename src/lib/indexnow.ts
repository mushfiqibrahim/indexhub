const ENDPOINT = "https://api.indexnow.org/indexnow";

/** IndexNow reaches Bing, Yandex, Seznam, Naver. It does NOT notify Google. */
export async function submitIndexNow(urls: string[]) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) throw new Error("INDEXNOW_KEY is not set");
  if (urls.length === 0) return { ok: true, status: 200 };
  const host = new URL(urls[0]).host;
  if (urls.some((u) => new URL(u).host !== host)) {
    throw new Error("IndexNow batches must contain URLs from a single host");
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: urls.slice(0, 10000) }),
  });
  return { ok: res.status === 200 || res.status === 202, status: res.status };
}
