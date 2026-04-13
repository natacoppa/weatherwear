---
status: complete
priority: p1
issue_id: "003"
tags: [code-review, simplicity, cleanup]
dependencies: []
---

# ShopLink and PackLink are styled-divs-in-disguise — inline or merge

## Problem statement

`src/components/shop-link.tsx` (15 lines) and `src/components/pack-link.tsx` (15 lines) are both thin anchor wrappers around `shopUrl()`. The only difference is class names (inline text-[14px] vs block text-[13px] with underline). Neither is used in more than one consumer. The JSX body is shorter than the import statement.

Per the Simplicity reviewer's own methodology (which drove the revision plan), this is exactly the "typography wrapper" anti-pattern we'd agreed to avoid.

## Findings

From Simplicity reviewer:
> **CRITICAL — ShopLink and PackLink should be inlined or merged.** Both are 6-line anchor wrappers around the same `shopUrl()` call. The only difference is class names. Neither is used in more than one parent. The current split costs two files, two imports, and zero clarity gain.

## Proposed solutions

### Option A — Inline both at call sites (recommended)
- Delete both files
- `<ShopLink text={x} />` in `day-card.tsx` → inline `<a href={shopUrl(x)} ...>` (one-liner with className)
- `<PackLink text={x} />` in `app/page.tsx` trip view → same
- Pros: Deletes 30 lines of abstraction; call site is self-documenting
- Cons: The `shopUrl` import moves to two new places (already imported in both)
- Effort: Small

### Option B — Merge into a single `<ShoppableText variant="inline" | "block">`
- One file, one component, two render paths
- Pros: Keeps the abstraction if you expect more variants
- Cons: Doesn't solve the "no real reuse" problem — still one callsite each variant
- Effort: Small

### Option C — Leave as-is
- Pros: Zero churn
- Cons: Ignores stated simplicity principle; encourages more wrapper-creep
- Effort: None

## Recommended action
_(Fill during triage)_

## Technical details

- **Delete:** `src/components/shop-link.tsx`, `src/components/pack-link.tsx`
- **Callsites:**
  - `src/components/day-card.tsx` — `<ShopLink text=...>` in `OutfitRow` helper
  - `src/app/app/page.tsx` trip categories — `<PackLink text=...>`

## Acceptance criteria

- [ ] Zero `ShopLink`/`PackLink` imports remain
- [ ] Visual output unchanged (same class strings, same markup)
- [ ] Tests still green

## Work log

_(Fill when started)_

## Resources

- Simplicity reviewer finding 1
- Architecture reviewer finding 7 (mentions the same near-duplication)
