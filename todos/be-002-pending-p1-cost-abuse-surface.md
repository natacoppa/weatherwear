---
status: pending
priority: p1
issue_id: "be-002"
tags: [backend, security, cost, rate-limit, abuse]
dependencies: []
---

# Cost abuse surface — rate limit is theater + no input size caps

## Problem

Every `/api/outfit-*` call spends real Anthropic/Gemini money. Current protections:

- `rateLimit` is in-memory `Map` (`src/lib/rate-limit.ts:3`) — every Vercel cold start resets counters; per-function-instance, so multi-region traffic bypasses entirely
- IP read from `x-forwarded-for` — spoofable if origin ever exposed directly
- No global budget circuit-breaker
- `/api/weather` has **no** rate limit call at all
- No input length validation on `q` — 100KB city names waste tokens
- `/api/outfit-image` accepts arbitrary POST body size
- `/api/trip` accepts unbounded date ranges (`startDate=2020-01-01&endDate=2030-12-31` would build a prompt with thousands of days)
- No auth; all endpoints public

Performance reviewer estimated `outfit-shopmy` alone runs **$0.10–$0.30 per request**. At 1K daily users hitting it once, that's $100–$300/day.

## Findings

Security sentinel (CRITICAL #2, #3, #7, #8, #9):
> A single afternoon of abuse could run up hundreds of dollars in API bills.
> The `Map` is in-process memory — every cold start resets it, so the rate limit effectively never triggers.

Performance oracle (CRITICAL #7):
> `const hits = new Map()` is per-isolate. A user can trivially bypass the 50/hour limit by hitting different regions.

## Proposed solutions

### Option A — Upstash Redis / Vercel KV rate limiter (recommended)
Replace in-memory Map with distributed store. `@upstash/ratelimit` takes ~10 lines.

### Option B — Vercel WAF rate limiting
Configure at edge, no code. Cheaper but less flexible.

### Option C — Add zod validation for input caps
- `q`: `z.string().min(1).max(120)`
- `outfit` POST body: size cap + shape check
- Trip: `max(span, 14 days)`
- Creator: gate via be-001

Combine A + C for a real fix.

## Acceptance

- [ ] Rate limit persists across function cold starts
- [ ] `/api/weather` gated
- [ ] Oversized `q` returns 400
- [ ] Trip span > 14 days returns 400
- [ ] `/api/outfit-image` has request body size cap
- [ ] Budget/burst-rate alert wired to Vercel or Anthropic dashboard (manual — outside this repo)

## Files

- `src/lib/rate-limit.ts`
- `src/app/api/weather/route.ts:9`
- `src/app/api/trip/route.ts:17-20`
- `src/app/api/outfit-image/route.ts:8`
- All route files (add zod schemas)
