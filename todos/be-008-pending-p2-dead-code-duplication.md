---
status: pending
priority: p2
issue_id: "be-008"
tags: [backend, simplicity, cleanup]
dependencies: []
---

# Dead code + duplication — outfit.ts unused, analyzeMoment duplicated

## Problem

1. **`src/lib/outfit.ts` (379 lines) is effectively dead for the primary route**. Only `/api/weather/route.ts` imports it. The main outfit endpoint (`/api/outfit-day`) inlines its own prompt and JSON parsing. The rule-based fallback (`generateRuleBased` + helpers) is unreachable from the primary route. Worse: there are now **two separate AI prompt templates** for outfit generation (one in `outfit.ts`, one inlined) that will drift apart. The next person to tune the prompt will update one and miss the other.

2. **`analyzeMoment` duplicated** between `outfit-day/route.ts:25-53` and `outfit-shopmy/route.ts:47-57`. Slightly different return shapes (outfit-day includes humidity/feelsLike/cloudCover; outfit-shopmy doesn't). Same `avg` helper inline. Same hour-filtering logic. Meanwhile `weather.ts:analyzeByTimeOfDay` does similar work with a third interface.

3. **Dead exports in `weather.ts`**: `getWeatherDescription` (line 79) and `weatherDescriptions` map (lines 55–77) — not called anywhere outside the file. 23 lines.

4. **`/api/weather/route.ts` may be the legacy outfit route**. It uses a 2-period day model (daytime/night) while the rest of the app uses 3-moment (walk-out/midday/evening). If no frontend calls `/api/weather` for outfits anymore, the outfit logic there is dead.

## Findings

Simplicity (CRITICAL #1, #2, IMPORTANT #3):
> outfit.ts rule-based fallback is dead weight. If Claude's API fails, returning a 500 is honest — a stale rule-based outfit is worse than no result.
> analyzeMoment duplicated across two files is a maintenance trap.

Kieran TS (IMPORTANT #5):
> These two are similar shape with different return types — a bug fix in one won't propagate.

Spec-reviewer (NICE-TO-HAVE #10):
> If the AI call fails, users get a 500 instead of a degraded-but-functional response. Two separate prompt templates that will drift apart.

## Proposed solutions

### Option A — Delete + consolidate (recommended)

1. Confirm no frontend caller uses `/api/weather` for outfits. If confirmed: delete the outfit-generation call from that route, delete `outfit.ts` entirely. Saves ~379 + ~30 lines.

2. Extract `analyzeMoments(hourly, elevation, date): Moment[]` into `src/lib/weather.ts`. Both outfit routes import it. Decide on one return shape (the richer one from outfit-day). Saves ~50 lines and one drift risk.

3. Delete `getWeatherDescription` + `weatherDescriptions` map. Saves ~23 lines.

Total: ~460 lines (24% of backend) with no functional loss.

### Option B — Make outfit.ts's generateWithAI the canonical prompt
If we DO want a rule-based fallback for reliability, route outfit-day through outfit.ts and delete the inline prompt. Harder — the response shapes differ. Needs the shape-validation work from be-004 first.

## Acceptance

- [ ] `/api/weather` audited; if no outfit usage, outfit import removed
- [ ] `outfit.ts` deleted OR retained as the canonical prompt with a routing change
- [ ] `analyzeMoments` in one place (`weather.ts`)
- [ ] Both outfit routes import and use it
- [ ] `getWeatherDescription` + `weatherDescriptions` removed
- [ ] Build + tests green

## Files

- `src/lib/outfit.ts`
- `src/app/api/outfit-day/route.ts:25-54`
- `src/app/api/outfit-shopmy/route.ts:47-57`
- `src/lib/weather.ts:55-79, 175-247`
- `src/app/api/weather/route.ts`
