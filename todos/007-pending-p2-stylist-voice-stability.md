---
status: pending
priority: p2
issue_id: "007"
tags: [code-review, race-condition, react]
dependencies: []
---

# StylistVoice resets on parent re-render; index can go out of bounds

## Problem statement

`src/components/stylist-voice.tsx` runs a typewriter effect that depends on `[charIdx, phraseIdx, phrases]`. Two defects:

1. **Re-render resets cadence.** If the parent re-renders with an inline-literal phrases array (`phrases={["a", "b"]}`), React sees a new array reference even for identical contents. The effect re-runs, clears the pending timeout, and re-schedules. Visible stutter whenever the parent renders.

2. **Out-of-bounds crash risk.** If `phrases` is replaced mid-typing with a shorter array, `phrases[phraseIdx]` can be `undefined`. Line 13 then calls `.length` on `undefined` → throw.

Today it works because `OutfitLoader` passes a stable reference, but the component's contract is fragile and a refactor that moves phrase lists inline (common) breaks it.

## Findings

From Julik race reviewer:
> **IMPORTANT — StylistVoice phrase array identity.** If the parent re-renders and passes a new array reference (even with identical contents), the effect re-runs, resetting the typing cadence every parent render, producing a visible stutter. If `phrases` is genuinely replaced mid-typing, `phraseIdx` can point past the new array's bounds — `phrases[phraseIdx]` is `undefined`, and `.length` on line 13 throws.

## Proposed solutions

### Option A — Guard + phrase identity via JSON (recommended)
- Use `useRef` to track latest phrases; reset `phraseIdx`/`charIdx` only when phrases content actually changes (compare JSON)
- Guard against `current = phrases[phraseIdx]` being undefined → clamp to 0
- Pros: Stable across parent re-renders; crash-safe
- Cons: Slight complexity in the effect
- Effort: Small

### Option B — Accept a stable-by-convention prop contract
- Document that callers must memoize the phrases array
- Leave code as-is
- Pros: Zero code change
- Cons: Doc-driven contract is fragile; future callers will forget
- Effort: None

### Option C — Move phrases to module-level constant referenced by name
- `<StylistVoice kind="today" />` looks up a static constant internally
- Pros: Impossible to misuse
- Cons: Same pattern already exists in `OutfitLoader` — redundant
- Effort: Small

## Recommended action
_(Fill during triage)_

## Technical details

- **File:** `src/components/stylist-voice.tsx:9-22`
- **Callers:** `src/components/outfit-loader.tsx` (stable — safe)

## Acceptance criteria

- [ ] Parent re-render with equal-content phrases array does NOT reset the typewriter
- [ ] Passing shorter phrases array mid-typing does not throw
- [ ] Unmount during pending timeout does not leak (already via cleanup return)

## Work log

_(Fill when started)_

## Resources

- Julik race review finding 5
