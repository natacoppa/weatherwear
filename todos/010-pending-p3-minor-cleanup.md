---
status: pending
priority: p3
issue_id: "010"
tags: [code-review, cleanup, nice-to-have]
dependencies: []
---

# Minor cleanup — OutfitLoader, BreatheBar dedup, CreatorMoment dotColor, positional array, test mocking, zod

## Problem statement

Grab-bag of P3 findings across the reviewers. Each is small; bundled to keep the todo list manageable.

## Findings

1. **OutfitLoader is a thin wrapper** (Simplicity #3). 34 lines of layout + phrase-map + eyebrow around `StylistVoice`. Used twice, with a drill-down loader hand-rolled inline in `app/page.tsx` that proves the abstraction wasn't worth it. Consider inlining.

2. **BreatheBar is used in DayCard but hand-rolled inline in `app/page.tsx:370-381` drill-down loader** (Simplicity #5). Either use `BreatheBar` there, or delete the `BreatheBar` component and inline both.

3. **CreatorMoment `dotColor` prop is over-generic** (Simplicity #4). Only ever `"gold" | "oat" | "slate"` in fixed order. Could be derived from position or hardcoded at each of the 3 callsites.

4. **OutfitCollage positional array indexing** (Kieran #6). `valid[0]`, `valid[1]`, `valid[2]`, `valid[3]` maps to top/layer/bottom/shoes by position. If the API ever reorders, the layout silently breaks. `CreatorOutfitItem` has an `index` field — key off that or destructure with named variables.

5. **Live API calls in smoke tests** (Security #6). `tests/smoke.spec.ts` hits real geocoding + weather + Anthropic. In CI, every run consumes API credits. Either mock or gate behind `process.env.RUN_LIVE_SMOKE`.

6. **Missing zod on API params** (Security #5). No injection vector, but adding zod would prevent oversized payloads and improve error messages. Originally deferred in plan.

7. **useRecents hydration vs add() edge case** (Julik #6). Not a real race — `add()` reads from localStorage directly, not state — but one frame where new item appears without historical items. Extremely unlikely in practice.

## Proposed solutions

Each of these is small enough to handle independently. Suggested sequence if all are addressed:

1. Inline `OutfitLoader` at its two call sites (delete file)
2. Either use `BreatheBar` in drill-down loader, or delete `BreatheBar` and inline both
3. Derive `CreatorMoment` dot color from position; drop prop
4. Destructure OutfitCollage items with named locals (`const top = valid.find(...)?.`): improves readability and kills positional brittleness
5. Add `RUN_LIVE_SMOKE=1` gate OR mock with `page.route("**/api/**", ...)` in Playwright
6. Add zod when the next API change lands (not standalone)

### Option A — Bundle all except zod (recommended)
- Do #1-5 as one cleanup commit
- Defer #6 (zod) until the outfit-shopmy split or similar API change
- Effort: Small

### Option B — Cherry-pick
- Only address any items that actually bite
- Effort: Trivial per item

## Recommended action
_(Fill during triage)_

## Technical details

- `src/components/outfit-loader.tsx` — candidate for deletion
- `src/components/breathe-bar.tsx` — reconcile with `app/page.tsx:370-381`
- `src/components/creator-card.tsx` — CreatorMoment helper
- `src/components/outfit-collage.tsx` — positional indexing
- `tests/smoke.spec.ts` — live API calls
- (deferred) API routes — zod

## Acceptance criteria

- [ ] Tests still green after any cleanup
- [ ] No new abstractions introduced
- [ ] If zod is added, schemas live in `src/app/api/_lib/validation.ts`

## Work log

_(Fill when started)_

## Resources

- Simplicity findings 3, 4, 5
- Kieran finding 6
- Security findings 5, 6
- Julik race finding 6
