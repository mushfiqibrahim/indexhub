"use client";
import { useState } from "react";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [urls, setUrls] = useState("");
  const [sitemap, setSitemap] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);

  const headers = { "content-type": "application/json", "x-api-key": apiKey };
  const list = () => urls.split(/\s+/).filter(Boolean);

  async function run(fn: () => Promise<Response>) {
    setBusy(true);
    try {
      setOutput(JSON.stringify(await (await fn()).json(), null, 2));
    } catch (e) {
      setOutput(String(e));
    } finally {
      setBusy(false);
    }
  }

  const loadSitemap = () =>
    run(async () => {
      const res = await fetch(`/api/sitemap?url=${encodeURIComponent(sitemap)}`, { headers });
      const clone = res.clone();
      const data = await res.json();
      if (data.urls) setUrls(data.urls.join("\n"));
      return clone;
    });

  const submit = () =>
    run(() => fetch("/api/submit", { method: "POST", headers, body: JSON.stringify({ urls: list() }) }));

  return (
    <main>
      <h1>IndexHub</h1>
      <p>Submit URLs to Google's Indexing API and IndexNow.</p>
      <input placeholder="API key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} style={{ width: "100%" }} />
      <h3>Sitemap</h3>
      <input placeholder="https://example.com/sitemap.xml" value={sitemap} onChange={(e) => setSitemap(e.target.value)} style={{ width: "70%" }} />
      <button onClick={loadSitemap} disabled={busy || !sitemap}>Load URLs</button>
      <h3>URLs (one per line)</h3>
      <textarea rows={10} value={urls} onChange={(e) => setUrls(e.target.value)} style={{ width: "100%" }} />
      <button onClick={submit} disabled={busy || list().length === 0}>Submit {list().length} URLs</button>
      <pre style={{ background: "#f4f4f4", padding: 12, overflow: "auto" }}>{output}</pre>
    </main>
  );
}
