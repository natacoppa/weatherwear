---
status: pending
priority: p1
issue_id: "be-005"
tags: [backend, performance, cost, timeout]
dependencies: []
---

# outfit-shopmy latency + cost — sequential fetches + oversized vision tokens

## Problem

`/api/outfit-shopmy` is the most expensive and slowest route. Two defects compounding:

1. **Sequential image fetches** (`src/app/api/outfit-shopmy/route.ts:141-163`). Up to 12 candidate images fetched in a `for` loop, each ~100–300ms. Total: 1.2–3.6s of pure serial I/O. These are independent.

2. **Full-size images sent to vision model**. Typical 500×500 product photo → ~1,600 vision tokens. 12 images × 1,600 = 19,200 vision tokens per request. At Sonnet pricing ($3/MTok input) that's ~$0.06 just for the image pass, before output. Real-world requests hit **$0.10–$0.30** per call.

Combined: the route easily exceeds 10s wall time → **times out on Vercel Hobby tier**. Effectively broken for hobby deployments.

## Findings

Performance oracle (CRITICAL #4, #9, #10):
> Sequential for loop. Promise.all would reduce this to the latency of the slowest single fetch.
> Hobby tier (10s timeout): outfit-shopmy will timeout.
> Vision token cost: ~$0.07 minimum per request, higher-resolution pushes to $0.15-0.30.

## Proposed solutions

### Option A — Parallel fetch + image resize (recommended)

1. **Parallelize**: replace `for` loop with `await Promise.all(candidates.map(fetchImage))`. One-line change. Expected savings: 1.5–3s per request.

2. **Downscale before base64**: add a resize step before sending to Claude. 256×256 is sufficient for outfit matching; halves vision token cost.
   - Option: use `sharp` (Node) — reliable, fast, but cold-start tax
   - Option: use Cloudflare/Vercel image-resize URL params before fetching (if CDN supports)
   - Option: use Claude's `resize` parameter if added to SDK
   - Simplest: request lower-res from ShopMy if URL accepts size hints (many CDNs do)

3. **Tighten candidate count**: currently up to 12 (3 tops + 3 layers + 2 bottoms + 2 shoes + 1 dress + 1 bag). Could Claude match just as well from 8? A/B test.

### Option B — Stream image fetches as Claude processes
Advanced; use streaming content blocks. Not worth the complexity yet.

## Acceptance

- [ ] Image fetches run in parallel (Promise.all)
- [ ] Wall-clock time reduced by ≥1s on representative catalog
- [ ] Images downscaled before vision call, OR CDN-resize URL param used
- [ ] Per-request vision token count measured; drops by ≥40%
- [ ] Route stays within 10s on representative requests

## Files

- `src/app/api/outfit-shopmy/route.ts:132-163` — candidate selection + fetch loop
- `src/app/api/outfit-shopmy/route.ts:208-215` — Claude vision call
