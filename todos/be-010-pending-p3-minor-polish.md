---
status: pending
priority: p3
issue_id: "be-010"
tags: [backend, cleanup, polish]
dependencies: []
---

# Minor backend polish — CORS, content-type, rate-limit hygiene, typing

## Problem

Small items from the backend review that don't individually merit their own todo:

1. **CORS is `*`** (`src/lib/rate-limit.ts:31`). Wide-open. For a consumer product with no auth, tighten to own domain(s).

2. **Content-Type not validated on image proxy** (`/api/img/route.ts:55`). If ShopMy CDN ever served `text/html`, proxy would forward it. Low risk, but add `if (!contentType.startsWith("image/")) return 502`.

3. **Rate-limit `Map` never cleaned up** (`rate-limit.ts`). Stale entries linger forever for unique IPs. Periodic sweep or LRU. (Partly addressed by be-002 if switching to KV.)

4. **Curator IDs in response** (`outfit-shopmy/route.ts:239-241`). Semi-public but exposes creator relationships.

5. **Gemini response typing** (`outfit-image/route.ts:45`). `Record<string, unknown>` then accesses `imagePart.inlineData.mimeType` without narrowing. Add a proper `GeminiResponse` interface.

6. **`new Date()` called twice in `weather.ts:180-181`** — at minute boundary could disagree. Capture `const now = new Date()` once.

7. **Whitespace-only query hits Open-Meteo** (`weather.ts:geocode`). `q=" "` passes the `!query` check and wastes an external call. Add `.trim().length === 0` short-circuit.

8. **Lazy-import Anthropic SDK** (perf nice-to-have). Dynamic `import()` inside handlers saves ~50–100ms cold start for routes that exit early (rate-limited, missing params).

## Proposed solutions

Each is small enough to handle independently. Bundle in one cleanup commit when/if touching these files for another reason.

## Acceptance

Pick per item as needed. None is load-bearing.

## Files

- `src/lib/rate-limit.ts`
- `src/app/api/img/route.ts`
- `src/app/api/outfit-shopmy/route.ts`
- `src/app/api/outfit-image/route.ts`
- `src/lib/weather.ts`
