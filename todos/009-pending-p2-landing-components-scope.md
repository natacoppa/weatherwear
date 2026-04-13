---
status: pending
priority: p2
issue_id: "009"
tags: [code-review, architecture, organization]
dependencies: []
---

# Mock components live in shared src/components/ — move to landing subdir

## Problem statement

`src/components/mock-outfit-card.tsx` (192 lines) and `src/components/mock-packing-list.tsx` (119 lines) contain hardcoded NYC/Tokyo fixture data. They're only imported by `src/app/page.tsx` (landing). Sitting alongside `DayCard`, `CreatorCard`, `SearchControls` — they're discoverable from anywhere and trivially importable into `/app`, which would ship ~300 lines of mock fixtures into the app bundle by mistake.

Related: `Ticker`, `RotatingWord`, `ApiExample` are also landing-page-only.

## Findings

From Architecture reviewer:
> **IMPORTANT — Mock Components in `src/components/`.** They are discoverable alongside `DayCard` and `CreatorCard`, making accidental import in `/app` plausible. Move them to `src/components/landing/` now, before the directory grows. This is a two-file move, not a restructure — it does not contradict the flat-by-default philosophy because it is scoping fixtures, not creating a deep hierarchy.

> **Flat `components/` — Tripwire at ~25 Files.** The tripwire: the moment a component name needs a prefix to disambiguate its consumer, add subdirs.

## Proposed solutions

### Option A — Move landing-only components to `src/components/landing/` (recommended)
- Move: `mock-outfit-card.tsx`, `mock-packing-list.tsx`, `ticker.tsx`, `rotating-word.tsx`, `api-example.tsx`
- Update imports in `src/app/page.tsx`
- Pros: Prevents accidental `/app` import; scopes fixtures; flat principle preserved for shared `components/`
- Cons: 5-file move + 5 import path updates
- Effort: Small

### Option B — Leave flat, rely on file naming
- Keep as-is; rely on `mock-` prefix to signal landing-only
- Pros: Zero move churn
- Cons: Doesn't address the tripwire Architecture flagged
- Effort: None

### Option C — Move to `src/app/(landing)/_components/` (route-group colocation)
- Use Next.js route group pattern to colocate landing-only components with the page
- Pros: Aligned with App Router conventions; literally impossible to import from `/app`
- Cons: More structural; introduces route group just for components
- Effort: Small

## Recommended action
_(Fill during triage)_

## Technical details

- **Move:**
  - `src/components/mock-outfit-card.tsx` → `src/components/landing/mock-outfit-card.tsx`
  - `src/components/mock-packing-list.tsx` → `src/components/landing/mock-packing-list.tsx`
  - `src/components/ticker.tsx` → `src/components/landing/ticker.tsx`
  - `src/components/rotating-word.tsx` → `src/components/landing/rotating-word.tsx`
  - `src/components/api-example.tsx` → `src/components/landing/api-example.tsx`
- **Update imports:** `src/app/page.tsx`
- **Keep in shared:** `nav.tsx` (used by landing + app + docs + 404), everything else

## Acceptance criteria

- [ ] `src/components/landing/` contains the 5 files above
- [ ] `src/components/` (top level) contains only cross-surface components
- [ ] Landing page renders unchanged
- [ ] Bundle analyzer (optional) confirms no landing fixtures in `/app` chunk

## Work log

_(Fill when started)_

## Resources

- Architecture finding 1, 6
