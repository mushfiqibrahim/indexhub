# IndexHub

Next.js + TypeScript service for URL submission and index monitoring.

## What it does
- `POST /api/submit` – sends URLs to Google's **Indexing API** and **IndexNow** (Bing/Yandex/etc.)
- `GET /api/sitemap?url=` – expands a sitemap or sitemap index into URLs
- `POST /api/inspect` – checks index status via Search Console **URL Inspection API**
- Simple UI at `/`. All API calls require the `x-api-key` header.

## Setup
1. Google Cloud: create a project, enable **Web Search Indexing API** and **Search Console API**, create a service account and JSON key.
2. Search Console: add the service account email as an **Owner** of each property.
3. `cp .env.example .env.local` and fill in values (JSON key on one line).
4. IndexNow: choose a key, host `https://yourdomain/<key>.txt` containing it.
5. `npm install && npm run dev`

```bash
curl -X POST localhost:3000/api/submit -H "x-api-key: $API_KEY" -H "content-type: application/json" \
  -d '{"urls":["https://example.com/jobs/1"],"google":true,"indexNow":true}'
```

## Important limits
- Google's Indexing API is officially for pages with `JobPosting` or `BroadcastEvent` markup only; default quota is 200 publishes/day. Other page types are ignored, and abusing it risks your Cloud project. Nothing here guarantees indexing.
- IndexNow does not notify Google.
- Quota tracking is in-memory; use Redis/Postgres before running multiple instances.

## Next steps
Job queue (BullMQ), persistent submission history, per-user OAuth for Search Console, scheduled status re-checks, billing.
