---
status: complete
priority: p2
issue_id: "006"
tags: [code-review, quality, error-handling]
dependencies: []
---

# DayCard and AppPage error handling — silent swallow, double-parse, stale closures

## Problem statement

Three related error-handling defects in the fetch paths Kieran surfaced:

1. **DayCard swallows non-abort errors silently.** `src/components/day-card.tsx:30-40`: `.then(res => res.ok ? res.json() : null).catch(() => {})`. A 429/500 looks identical to "no image." User sees the grey fallback box with zero indication the API was hit.

2. **AppPage double-parses response body.** `fetchToday` (and siblings) call `(await res.json()).error` in the error branch. If the body isn't JSON (502 gateway HTML), the error path throws a generic `"Error"` string instead of the HTTP status.

3. **Stale closure in `handleDayNav`.** `src/app/app/page.tsx`: `handleDayNav` reads `dayIndex`, `query`, `todayResult` from closure without `useCallback`. If `setDayIndex` fires between click and render, the next click can send wrong day index. Low-probability but real.

4. **Fragile eslint-disable** on `day-card.tsx:49` (`exhaustive-deps`). The suppress relies on the parent's key-remount contract. If a future dev renders `<DayCard result={...}>` without a key, the effect won't re-fire on prop change.

## Findings

From Kieran TypeScript reviewer:
> **CRITICAL — day-card.tsx:37-39 swallows non-abort errors silently.** A 429 or malformed 500 will look identical to "no image available."
> **IMPORTANT — app/page.tsx:69 double-parses the response body.** If `res.json()` itself throws, the outer catch gets a generic "Error" string.
> **IMPORTANT — Stale closure risk in `doSearch` / `handleDayNav`.** `handleDayNav` is not memoized; captures render-time value of `dayIndex`.
> **IMPORTANT — day-card.tsx:49-50 eslint-disable for exhaustive-deps is fragile.** Consider adding `result` to the dep array; the AbortController handles cleanup naturally.

From Julik race reviewer:
> **IMPORTANT — handleShare timeout leak.** `setTimeout(() => setCopied(false), 2000)` is never cleared. If component unmounts within 2s, React warns about setting state on unmounted component.

## Proposed solutions

### Option A — Surgical fixes, bundled (recommended)
- **day-card.tsx:** distinguish `signal.aborted` from other errors; dev-mode `console.warn` for non-abort; keep UI fallback
- **app/page.tsx fetches:** read body once into a local `body = await res.json().catch(() => ({}))`; branch on `res.ok`
- **handleDayNav:** wrap in `useCallback([dayIndex, query, todayResult, fetchToday])`; do the same for `doSearch`
- **day-card:** drop the eslint-disable by adding `result` to deps + relying on AbortController for cleanup (Kieran's suggestion)
- **handleShare:** track timeout ref; clear on effect cleanup
- Pros: Each fix is <10 lines; no structural change
- Cons: Five small edits in three files
- Effort: Small

### Option B — Introduce error boundaries + toast system
- Error boundary around DayCard; toast for surface-level failures
- Pros: Systemic error UX
- Cons: Sonner was explicitly deferred in the plan
- Effort: Medium

## Recommended action
_(Fill during triage)_

## Technical details

- **Files:**
  - `src/components/day-card.tsx:30-50` (error swallow + eslint-disable)
  - `src/components/day-card.tsx:68-85` (handleShare timeout)
  - `src/app/app/page.tsx:68-95` (double-parse in all fetch funcs)
  - `src/app/app/page.tsx:145-150` (handleDayNav useCallback)

## Acceptance criteria

- [ ] DayCard distinguishes aborted vs real errors; real errors logged in dev
- [ ] All four `fetchX` funcs read body once, handle non-JSON gracefully
- [ ] `handleDayNav` and `doSearch` memoized via `useCallback`
- [ ] `day-card.tsx:49` eslint-disable removed; deps include `result`
- [ ] `handleShare` timeout cleared on unmount (no setState-after-unmount warning)

## Work log

_(Fill when started)_

## Resources

- Kieran findings 1, 2, 3, 4
- Julik race finding 4
