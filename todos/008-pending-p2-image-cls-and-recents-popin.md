---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, performance, cls, ux]
dependencies: []
---

# OutfitCollage images lack intrinsic dimensions; recents pop-in after hydration

## Problem statement

Two CLS / layout-shift issues flagged in the performance review:

1. **OutfitCollage `<img>` tags have no `width`/`height` attributes.** `src/components/outfit-collage.tsx` lines 21-74 set size via Tailwind classes (`w-[68px] h-[68px]`). On slow CSS loads or network-throttled conditions, the image has no intrinsic size → browser reserves 0 space → content jumps when image renders → CLS score degrades. `loading="lazy"` is set, which is right for below-the-fold but *wrong* for the main garment image (line 33-38, `w-[150px] h-[170px]`) if it becomes LCP on the creator view.

2. **Recents section pops in after hydration.** `src/hooks/use-recents.ts` initializes as `[]`, then fills from localStorage in an effect. On `/app` empty state, the "Recent" pill section at `app/page.tsx:413-429` renders empty, then fills after mount. Visible flash especially for returning users. CLS is bounded (pills are small) but the pop-in is noticeable.

## Findings

From Performance reviewer:
> **IMPORTANT — Missing intrinsic `width`/`height` on `<img>`.** On slow connections this can cause CLS. `loading="lazy"` is fine since this is below the fold, but for LCP: if the collage is the largest paint, lazy-loading actively delays it.
> **IMPORTANT — Recents pop-in after hydration.** The "Recent" pill section renders empty, then pops in. Mitigation: wrap in a min-height container, or use `useSyncExternalStore` with `getServerSnapshot` returning `[]` — same behavior but React batches into hydration commit.

## Proposed solutions

### Option A — Add width/height attrs + reserve recents space (recommended)
- Add `width` and `height` props to every `<img>` in `outfit-collage.tsx` matching the CSS sizes (68x68, 150x170, 85x100, 85x75, 130x130)
- Drop `loading="lazy"` on the main garment image (index 0) since it's the focal point
- Wrap the recents section in a `min-h-[48px]` container so layout doesn't shift when pills appear
- Pros: Targeted; no new deps
- Cons: Duplication between CSS and attrs (small)
- Effort: Small

### Option B — Migrate to `next/image` with `unoptimized`
- Use Next's Image with `unoptimized` prop so it still routes via `/api/img` but gets lazy + CLS protection
- Pros: Canonical framework answer
- Cons: Revisits the double-proxy decision already resolved
- Effort: Medium

### Option C — Use `useSyncExternalStore` for recents
- Convert `useRecents` to `useSyncExternalStore` with `getServerSnapshot: () => []`
- Pros: React commits state in hydration phase, no pop-in
- Cons: More complex hook; localStorage listener setup
- Effort: Medium

## Recommended action
_(Fill during triage)_

## Technical details

- **File:** `src/components/outfit-collage.tsx:21-74`, `src/hooks/use-recents.ts`, `src/app/app/page.tsx:413-429`

## Acceptance criteria

- [ ] Every `<img>` in OutfitCollage has explicit `width`/`height`
- [ ] Main garment image is eager-loaded
- [ ] Recents section reserves space (no CLS on empty-state → populated transition)
- [ ] Lighthouse CLS score on `/app` ≥ 0.95

## Work log

_(Fill when started)_

## Resources

- Performance findings 3, 6
