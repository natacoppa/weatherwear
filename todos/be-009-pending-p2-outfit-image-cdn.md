---
status: pending
priority: p2
issue_id: "be-009"
tags: [backend, performance, cdn, payload-size]
dependencies: []
---

# outfit-image returns base64 PNG inline — refactor to CDN URL

## Problem

`/api/outfit-image/route.ts:52-53` returns `{ image: "data:image/png;base64,..." }`. Typical Gemini-generated image is 300–600KB raw → 400–800KB base64. On 3G/slow mobile, that's 2–5s of download. Wrapped in JSON with no HTTP compression applicable to the base64 payload. Every day-nav re-fetches the whole blob (mitigated now by `useOutfitImage` cache, but initial fetch pain remains).

## Findings

Performance oracle (IMPORTANT #3):
> Returns base64 PNG inline. Refactoring to upload to Vercel Blob / R2 and return a URL would allow CDN edge caching, proper Accept-Encoding, and Cache-Control headers.

## Proposed solutions

### Option A — Vercel Blob / Cloudflare R2 upload (recommended)
Generate image, upload to Blob, return `{ image: "<cdn-url>" }`. Frontend renders via standard `<img>`. CDN caches by URL across users.

Bonus: image URLs become shareable (share button), not just base64 blobs.

### Option B — Return binary, client converts to data URL
Return `image/png` directly from the API route. Client creates an object URL from the blob. Eliminates base64 overhead (~33% size). No CDN benefit though.

### Option C — Leave as-is
The session cache (`useOutfitImage`) already prevents re-fetches within a session. Base64 only bites on first load per day. If cost is irrelevant and first-load UX is OK, this is defensible.

## Acceptance

- [ ] Image served from CDN URL, not inline base64
- [ ] Cache-Control set for edge caching
- [ ] Frontend `<img>` renders via `src={url}` not a data URI
- [ ] First-load payload ≤50KB for the outfit-image JSON response

## Files

- `src/app/api/outfit-image/route.ts`
- `src/hooks/use-outfit-image.ts` — may simplify (no JSON parse of image data)
- `src/components/day-card.tsx:handleShare` — file upload simplifies
