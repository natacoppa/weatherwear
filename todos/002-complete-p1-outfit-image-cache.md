---
status: complete
priority: p1
issue_id: "002"
tags: [code-review, performance, cost, ai]
dependencies: []
---

# No cache on /api/outfit-image — key-remount doubles AI image-gen costs

## Problem statement

`src/components/day-card.tsx` fires a POST to `/api/outfit-image` on every mount. Combined with the key-based remount (`<DayCard key={location|date}>` in `app/page.tsx`), **every day-nav triggers a fresh AI image generation call**, even for previously-visited days. Navigate forward through 5 days and back → 10 image-gen calls instead of 5. No client cache, no `Cache-Control` header strategy, no request deduplication.

Compounded by StrictMode double-invoke in dev: mount 1 fires fetch, cleanup aborts, mount 2 fires again. The abort keeps state correct but the network request still happens.

## Findings

From Performance reviewer:
> **CRITICAL — Outfit-Image Fetch on Every Remount.** `/src/components/day-card.tsx:27-50` fires an uncached POST to `/api/outfit-image` on every mount. Combined with the key-remount pattern, navigating between days triggers an AI image generation call each time.
> **IMPORTANT — DayCard Remount via Key.** Image flicker: outfit image resets to loading skeleton on every nav because `outfitImage` state is destroyed. The old image vanishes before the new POST even fires.

From Julik race reviewer:
> **IMPORTANT — DayCard image fetch fires twice in StrictMode.** You are hitting `/api/outfit-image` (a POST that presumably calls an image generation API) twice for every card mount in development.

## Proposed solutions

### Option A — In-memory Map cache in parent (recommended)
- `AppPage` owns `imageCache: Map<string, string>` keyed on `location|date|headline`
- Pass `cachedImage` prop to `DayCard`; fetch only if missing
- Write to cache on resolve
- Pros: Simple, targeted, no new deps, fixes both redundant fetches and flicker
- Cons: Memory grows with navigation session (bounded by user action volume — fine)
- Effort: Small

### Option B — HTTP caching on /api/outfit-image
- Add `Cache-Control: public, max-age=86400` to the response
- Change POST to GET with query params so browsers cache it
- Pros: Works across page loads too
- Cons: Changes API shape; GETs with large JSON bodies in URL are ugly
- Effort: Medium

### Option C — SWR/React Query with dedup+cache
- Standard library-based caching
- Pros: Battle-tested; also solves race conditions (todo 001)
- Cons: New dep; deferred in original plan
- Effort: Medium

## Recommended action
_(Fill during triage)_

## Technical details

- **Files:** `src/components/day-card.tsx:24-50`, `src/app/app/page.tsx` (parent that keys DayCard)
- **Cost impact:** Each cache-miss call hits Anthropic Claude Sonnet + image generation — material cost per request

## Acceptance criteria

- [ ] Navigating back to a previously-visited day does NOT re-fetch the image
- [ ] Old image stays visible while new image loads (no flash to skeleton on cached hit)
- [ ] Dev-mode StrictMode double-invoke does not produce two network requests

## Work log

_(Fill when started)_

## Resources

- Performance review findings 2, 7
- Julik race review finding 3
