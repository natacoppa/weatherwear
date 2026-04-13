---
status: pending
priority: p1
issue_id: "004"
tags: [code-review, architecture, api-design]
dependencies: []
---

# SearchControls 17-prop surface — lift form state into a hook or inline

## Problem statement

`src/components/search-controls.tsx` accepts **17 props** (5 state values, 9 callbacks, 3 computed values). It owns no state — it's a pure pass-through of the parent's useState setters. Every reviewer who looked at it flagged the shape. Both the current reader and the next maintainer have to bounce between `app/page.tsx` (where state lives) and `search-controls.tsx` (where it's rendered) to understand the form.

Three reviewers converge on this. The right fix depends on which critique you weight:

## Findings

From Kieran TypeScript reviewer:
> **NICE-TO-HAVE — search-controls.tsx 17 props.** 17 individual props is at the threshold. The 9 callback props (`onModeChange`, `onQueryChange`, ...) are a signal that SearchControls is really a controlled form. A single `onChange: (field, value) => void` or a named prop-bag type would make the call site scannable.

From Simplicity reviewer:
> **CRITICAL — SearchControls' 17-prop surface is a leaky abstraction.** It doesn't own any state — it's a pure pass-through. The parent still manages all logic, but now the reader has to jump between two files. The three sub-components inside it (CollapsedSummary, ModeToggle, CreatorPicker) are fine as local helpers, but the outer `SearchControls` export should be inlined back into `page.tsx`.

From Architecture reviewer:
> **IMPORTANT — SearchControls 17-Prop Surface.** The shape reveals that `AppPage` owns state it does not use. The realistic fix is not a context or reducer — it is **lifting the search form state into a custom hook** (`useSearchForm`) that returns `{ formState, handlers, collapsed, submit }`.

## Proposed solutions

### Option A — Extract `useSearchForm` hook (Architecture's pick, recommended)
- New hook owns `mode`, `query`, `selectedCreator`, `tripStart`, `tripEnd`, `editingSearch`
- Returns `{ formState, handlers, collapsed, submit, reset }`
- `AppPage` calls hook; passes `formState` + `handlers` as two objects to SearchControls
- SearchControls prop count drops to ~4
- Pros: Real abstraction with colocation; handlers stay near state; AppPage thins out
- Cons: Medium refactor; fetch orchestration still lives in AppPage (right call)
- Effort: Medium

### Option B — Inline SearchControls back into AppPage (Simplicity's pick)
- Delete `search-controls.tsx`; keep `ModeToggle`, `CreatorPicker`, `CollapsedSummary` as local helpers OR move to one sibling file each
- Pros: -250 lines of abstraction; zero indirection
- Cons: AppPage grows ~80 lines; contradicts "extract components with real logic" principle — but this one genuinely doesn't carry logic
- Effort: Small

### Option C — Props-bag typed interface (Kieran's pick)
- Keep structure; replace 17 scalar props with `{ state: FormState, handlers: FormHandlers, meta: { collapsed, resultLocation, tripDateRange } }`
- Pros: Minimum churn; prop count drops to 3
- Cons: Hides coupling; still prop-drilling, just type-wrapped
- Effort: Small

## Recommended action
_(Fill during triage)_

## Technical details

- **File:** `src/components/search-controls.tsx:101-123` (prop interface)
- **Call site:** `src/app/app/page.tsx:164-185`
- **Sub-components inside:** `CollapsedSummary`, `ModeToggle`, `CreatorPicker` — keep as local

## Acceptance criteria

- [ ] SearchControls prop count ≤ 5, OR component inlined and file deleted
- [ ] No behavior change (all 3 modes + creator filter + trip dates + edit-collapsed flow work)
- [ ] Smoke + a11y tests still green

## Work log

_(Fill when started)_

## Resources

- Kieran finding 5
- Simplicity finding 2
- Architecture finding 4
