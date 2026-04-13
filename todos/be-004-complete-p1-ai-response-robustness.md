---
status: complete
priority: p1
issue_id: "be-004"
tags: [backend, ai, reliability, types]
dependencies: []
---

# AI response robustness — parsing, validation, client singleton

## Problem

Four related AI-integration defects:

1. **Anthropic client re-instantiated per request** (`outfit-day:170`, `outfit-shopmy:208`, `trip:155`, `outfit.ts:128`). Wasteful; makes it impossible to add retry/timeout/observability in one place.

2. **Fragile JSON parsing, inconsistent across routes**:
   - `outfit-day/route.ts:179`: strips markdown fences, then `JSON.parse`
   - `outfit-shopmy/route.ts:216`: greedy `text.match(/\{[\s\S]*\}/)` — matches from FIRST `{` to LAST `}`. Fails on "Here's the JSON: {...} Let me know if..." because the trailing `}` might be in the text.
   - Two routes, two strategies, same problem. One will fail where the other succeeds.

3. **No runtime validation of AI output shape**. Every route `JSON.parse`s and trusts the shape. If Claude omits `walkOut`, returns `accessories` as string, or nests differently, downstream throws with opaque stack traces.

4. **`resolveIndex` silently nullifies on hallucinated indices** (`outfit-shopmy/route.ts:221-232`). If Claude returns `[15]` when only 12 candidates exist, `candidates[15]` is `undefined`, `indexOf(undefined)` returns -1, `enrichItem` returns null. `walkOut.top = null` — client sees no top garment with no error signal.

5. **Error response shapes inconsistent**. Some routes `{ error: string }`, `creators/route.ts:12` returns `[]` (empty array) on failure. Client has to handle three formats.

6. **`data.hourly` from Open-Meteo completely unvalidated** (`weather.ts:279-292`). API change or null field silently produces `NaN` in feels-like calc → nonsense AI prompt.

## Findings

Kieran TS (CRITICAL #1, #2, #3, #4, IMPORTANT #5, #6, #9):
> The greedy regex matches from the FIRST `{` to the LAST `}`. If the AI outputs any trailing text containing a `}`, it captures garbage.
> If the AI returns an index outside candidates bounds, items are silently nullified with no signal to the client.
> If the API changes a field name, this silently produces `NaN` values that flow through `calculateFeelsLike` into AI prompts, producing nonsensical outfit recommendations.

Spec-reviewer (IMPORTANT #5):
> If Claude returns an index >= candidates.length, `walkOut.top` comes back as null silently stripping the primary garment.

## Proposed solutions

### Option A — Three small fixes (recommended)

1. **Singleton client**: new `src/lib/anthropic.ts` exporting a module-level `Anthropic` instance. Import across routes. Adds retry/timeout config once.

2. **Unified JSON extractor**: new `src/lib/parse-ai-json.ts` with a single robust parser. Strip markdown fences. Find LAST balanced `{...}` block (stack-based, not regex). Throw typed `AIParseError` with the raw text captured for logging.

3. **Lightweight shape validation**: not full zod (yet). Per-route schema file (e.g., `src/app/api/outfit-day/schema.ts`) exports a `parseDayOutfit(unknown): DayOutfit` that asserts required keys exist and types match, throws `AIShapeError` otherwise. Five routes → five schemas.

4. **`resolveIndex` hallucination guard**: when Claude returns an out-of-bounds index, log it in dev and return null with a `hallucinated_indices` metadata field in the response so frontend can surface "AI picked items we couldn't match."

5. **Consistent error shape**: `creators/route.ts` returns `{ creators: CreatorInfo[] }` always; error `{ error: string, code?: string }` everywhere.

6. **Guard `fetchWeather`**: check required fields exist before destructuring.

### Option B — Zod everywhere
Parses + validates + documents in one place. Better long-term, bigger refactor. Deferred.

## Acceptance

- [ ] One `Anthropic` singleton
- [ ] One shared `parseAiJson` utility with tests covering: markdown fences, trailing prose, nested JSON, malformed trailing comma
- [ ] Per-route shape validators; AI returning wrong shape → 502 with actionable error
- [ ] Out-of-bounds indices in `outfit-shopmy` surfaced, not silently nullified
- [ ] Error response shape consistent across all routes
- [ ] `fetchWeather` validates Open-Meteo response structure

## Files

- `src/app/api/outfit-day/route.ts`
- `src/app/api/outfit-shopmy/route.ts`
- `src/app/api/trip/route.ts`
- `src/app/api/outfit-image/route.ts`
- `src/app/api/creators/route.ts`
- `src/lib/outfit.ts`
- `src/lib/weather.ts:279-292`
- New: `src/lib/anthropic.ts`, `src/lib/parse-ai-json.ts`
