---
status: complete
priority: p1
issue_id: "001"
tags: [code-review, race-condition, bug, app-page]
dependencies: []
---

# Fetch race conditions in AppPage — drill-down and mode-switch both stale-write

## Problem statement

`src/app/app/page.tsx` has **four fetch paths** (today / trip / creator / drill-down) with no cancellation. Three concrete races:

1. **Drill-down A/B race** — user clicks Day A, then Day B before A resolves. B can finish first, then A's response arrives and overwrites it. User now sees Day A's outfit under Day B's highlighted button.
2. **Mode switch mid-fetch** — user searches "LA" in today mode, flips to trip mid-load, searches again. `loading` is shared across all fetch types; whichever resolves first toggles it off. `todayResult` from the first fetch also persists.
3. **Stale creator card** — `creatorResult` is never cleared on mode switch. Display guard `selectedCreator && creatorResult && !loading` means creator card can render alongside today card for one frame.

## Findings

From Julik frontend-races reviewer:
> **CRITICAL — Drill-down day A / day B race** (`page.tsx` lines 98-111). `fetchDrillDay` has no cancellation. Reproduction: throttle network to Slow 3G, click two day buttons in quick succession. The slower response wins.
> **CRITICAL — Mode switch mid-fetch leaves `loading` stuck or shows wrong result.** `fetchToday` and `fetchTrip` share the same `loading` boolean. `creatorResult` is never cleared on mode switch.
> **NICE-TO-HAVE — No fetch cancellation on `fetchToday` or `fetchTrip`.** Rapid "next day" clicks stack up requests; last-write-wins only accidentally works.

## Proposed solutions

### Option A — AbortController per fetch, clear result on mode switch (recommended)
- Add an `AbortController` ref in AppPage
- Each `fetchX` function aborts any in-flight controller before issuing a new request
- `onModeChange` clears `todayResult`, `tripResult`, `creatorResult`, and `drillDay`
- Pros: minimal structural change, surgical fix
- Cons: still 4 parallel fetch paths; if a fifth mode is added, easy to miss cancellation
- Effort: Small

### Option B — Single discriminated-union state + reducer
- Replace 4 result states with `{ kind: "idle" | "loading" | "error" | "today" | "trip" | "creator", data?: ... }`
- Reducer dispatches `ABORT_PENDING` before each new request
- Pros: exhaustiveness checking, no orphaned states possible
- Cons: bigger refactor; was explicitly deferred in the original plan per Simplicity/DHH review
- Effort: Medium

### Option C — Use SWR or React Query
- Introduces a dependency and caching layer
- Pros: battle-tested, handles dedup + cancellation + cache
- Cons: heavier; original plan deferred
- Effort: Medium

## Recommended action
_(Fill during triage)_

## Technical details

- **Files affected:** `src/app/app/page.tsx:68-126` (all four `useCallback` fetch funcs)
- **Tests to add:** Playwright test that rapid-clicks two day buttons and asserts the final result matches the last click

## Acceptance criteria

- [ ] Clicking day A then day B before A resolves always shows B
- [ ] Switching mode mid-fetch doesn't leave stale `loading=true` or stale result cards
- [ ] Creator card doesn't render alongside today/trip card after mode switch
- [ ] Smoke test added for one rapid-click scenario
- [ ] `abort` errors don't surface in the error banner (distinguish from real failures)

## Work log

_(Fill when started)_

## Resources

- Julik race review finding 1, 2, 7
- Existing AbortController pattern already in `src/components/day-card.tsx:24`
