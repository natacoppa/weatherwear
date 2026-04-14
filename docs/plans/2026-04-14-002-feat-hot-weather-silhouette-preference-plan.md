---
title: Prefer hot-weather silhouettes in outfit prompts
type: feat
status: completed
date: 2026-04-14
origin: docs/brainstorms/2026-04-14-hot-weather-silhouette-preference-brainstorm.md
---

# Prefer hot-weather silhouettes in outfit prompts

## Overview

The recently merged outfit-quality and weather-guardrail work made the product more coherent and less obviously wrong, but hot-weather outputs still skew too tailored. The system now avoids absurd layers more reliably, yet it still often defaults to polished separates, trousers, and light tailoring when a human stylist would more naturally choose dresses, skirts, shorts, sandals, and lower-bulk silhouettes.

This plan addresses that narrower product-quality problem with a prompt-preference patch only. It does **not** change the outfit schema, API contracts, or route wiring. The goal is to make hot-weather outputs feel more obviously heat-native before considering larger structural changes like adding a true `dress` path to the response shape.

## Problem Frame

The current prompt layer in `src/lib/outfit-prompt.ts` already handles city vibe, anchor-piece styling, transition restraint, and weather guardrails. That gives the system a strong style frame, but it still leaves too much room for "stylish" to collapse into trouser-first, polished separates, especially in cities like New York. The existing heat guidance focuses mostly on fabric weight and banned layers rather than silhouette preference, so the model is better at avoiding nonsense than at choosing the most natural hot-weather form.

The origin brainstorm is clear that this should stay a separate workstream from the guardrail bugfix and from any future schema redesign (see origin: `docs/brainstorms/2026-04-14-hot-weather-silhouette-preference-brainstorm.md`). The immediate product question is: how do we teach the system to positively prefer less-fabric silhouettes in hot weather without reopening the whole outfit engine? The answer should be a prompt-level preference pass plus stronger evaluation fixtures, with a clear decision rule for when that is not enough.

## Requirements Trace

- R1. Make `hot` and `extreme` heat prompts explicitly favor dresses, skirts, shorts, sandals, sleeveless tops, and airy low-bulk silhouettes where the current output shape can represent them cleanly.
- R2. Keep trousers and polished separates available, but stop making them the dominant default on hot-weather days.
- R3. Apply the same hot-weather preference logic to both `outfit-day` and `outfit-shopmy`.
- R4. Preserve current API response shapes and route contracts; this first pass is prompt-level only.
- R5. Add benchmark and test coverage that makes it easy to judge whether prompt preference was enough before escalating to schema work.
- R6. Keep bigger schema support for dresses explicitly out of scope unless prompt preference clearly fails.

## Scope Boundaries

- In scope:
  - Prompt-language changes in the shared outfit prompt layer
  - Shared helper text or formatting for hot-weather silhouette preference
  - Tests for day-mode and creator-mode prompt composition
  - Benchmark fixture and review-script updates that make hot-weather evaluation more intentional
- Out of scope:
  - Any response-shape or schema changes in `src/lib/types.ts` or `src/lib/ai-shapes.ts`
  - Route contract changes in `src/app/api/outfit-day/route.ts` or `src/app/api/outfit-shopmy/route.ts`
  - Candidate-set reshaping in `src/lib/creator-catalog.ts`
  - New output guardrails for dresses, skirts, or shorts
  - Personalization, occasion logic, or broader prompt simplification work

## Context & Research

### Relevant Code and Patterns

- `src/lib/outfit-prompt.ts` is already the single shared prompt surface for both day mode and creator mode. It owns city-vibe framing, anchor-piece language, signal-brief formatting, and guardrail prose, so this is the natural place for hot-weather silhouette preference.
- `src/lib/outfit-signals.ts` already computes `peakHeat`, which gives this feature a clean trigger for "hot" and "extreme" cases without adding new route logic.
- `tests/outfit-day-prompt.test.ts` and `tests/outfit-shopmy-prompt.test.ts` already assert specific prompt phrases for hot-weather scenarios and are the right tests to extend.
- `tests/fixtures/outfit-benchmark-queries.json`, `tests/fixtures/creator-outfit-benchmark.json`, and `scripts/review-outfit-benchmarks.ts` already provide deterministic prompt-review fixtures; this is the right place to encode hot-weather spot-check scenarios rather than inventing a separate evaluation path.

### Institutional Learnings

- No `docs/solutions/` directory exists in this repo right now, so there are no project-specific learnings to carry forward beyond the recent brainstorms and plans already in `docs/brainstorms/` and `docs/plans/`.

### External References

- None. The codebase already has a strong local pattern for shared prompt changes and deterministic prompt/fixture tests, so external research would add little value for this bounded pass.

## Key Technical Decisions

- Trigger silhouette preference on both `hot` and `extreme` heat, not only the most extreme cases. The product problem starts before `95°F+`; mid/high-80s days already expose the trouser-default bias.
- Keep the preference in prompt prose, not signal math. The signal layer already tells us when the day is hot; this feature is about how that fact should change styling language.
- Use one shared helper phrase or paragraph rather than duplicating slightly different hot-weather preference language across prompt builders.
- Bias toward polished hot-weather silhouettes when city/style pressure is high instead of backing away from them. That means the prompt should not say "always choose shorts first"; it should say "prefer less-fabric silhouettes, and make them feel polished when the city calls for polish."
- Do not touch creator candidate-set construction in the first pass. If creator mode still under-surfaces dresses, skirts, or shorts after prompt changes, that becomes evidence for Stage 2 or for a later candidate-set adjustment.
- Treat dresses differently in day mode versus creator mode for this first pass:
  - day mode can explicitly prefer dresses because its output is free-text
  - creator mode should focus on skirts, shorts, sandals, sleeveless tops, and airy separates for now, because the current `top + bottom + layer + shoes` contract does not provide a clean dress slot yet
- Use benchmark evaluation plus manual spot checks to decide whether prompt preference was enough. Schema work should only begin if hot-weather outputs remain persistently pants-shaped even after this pass.

## Open Questions

### Resolved During Planning

- Should the hot-weather preference apply only to `extreme` heat? No. It should apply to both `hot` and `extreme` heat because the current product issue shows up well before the most extreme threshold.
- Should this first pass include route or schema changes? No. Keep it prompt-only so we can see how much product lift wording alone provides.
- Should creator mode change candidate-set construction now? No. First see what prompt preference achieves with the existing candidate set.
- Should creator mode aggressively prefer dresses in this first pass? No. Creator mode should improve hot-weather silhouette preference within the current schema, but true dress support remains a later schema question.

### Deferred to Implementation

- The exact wording and placement of the hot-weather preference paragraph inside `buildDayOutfitPrompt()` and `buildCreatorOutfitPrompt()`, as long as it stays concise and clearly subordinate to the shared signal/guardrail structure.
- Whether the preference is best expressed as one dedicated helper (for example, `buildHotWeatherSilhouetteInstruction()`) or as a small extension inside existing guardrail/brief formatting, as long as it preserves prompt readability.
- The exact benchmark scenario additions or edits needed once the implementer sees which existing hot-weather fixtures already provide enough coverage.

## Implementation Units

- [x] **Unit 1: Add a shared hot-weather silhouette preference helper**

**Goal:** Introduce one reusable prompt helper that encodes the new positive preference for less-fabric hot-weather silhouettes.

**Requirements:** R1, R2, R3

**Dependencies:** None

**Files:**
- Modify: `src/lib/outfit-prompt.ts`
- Test: `tests/outfit-prompt.test.ts`

**Approach:**
- Add a small shared prompt helper that activates for `signalBrief.peakHeat === "hot"` or `signalBrief.peakHeat === "extreme"`.
- The helper should explicitly favor:
  - dresses
  - skirts
  - shorts
  - sandals
  - sleeveless or airy tops
  - lower-bulk silhouettes
- The helper should also explicitly de-center trousers:
  - trousers remain valid
  - but they should not read as the default answer for oppressive or clearly hot days
- Keep the wording focused on silhouette preference rather than banned-item lists, since the hard bans already live in the weather guardrails.

**Patterns to follow:**
- Existing shared helper structure in `src/lib/outfit-prompt.ts`
- Existing signal-aware prose insertion pattern via `formatSignalBrief()` and `formatGuardrails()`

**Test scenarios:**
- Happy path: a `peakHeat=hot` signal produces hot-weather silhouette preference language, not just extreme-heat guardrail language.
- Happy path: a `peakHeat=extreme` signal includes the same preference language alongside the existing heat guardrails.
- Edge case: a `peakHeat=warm` signal does not accidentally include dress/shorts-first wording.
- Edge case: the helper still allows polished styling language rather than forcing a casual-only aesthetic.

**Verification:**
- There is one shared, signal-aware place in the prompt layer that communicates hot-weather silhouette preference to both routes.

- [x] **Unit 2: Integrate the preference into day-mode and creator-mode prompts**

**Goal:** Update both prompt builders so hot-weather silhouette preference is visible in the final prompt without bloating or fighting the existing style logic.

**Requirements:** R1, R2, R3, R4

**Dependencies:** Unit 1

**Files:**
- Modify: `src/lib/outfit-prompt.ts`
- Test: `tests/outfit-day-prompt.test.ts`
- Test: `tests/outfit-shopmy-prompt.test.ts`

**Approach:**
- Insert the hot-weather silhouette preference into both `buildDayOutfitPrompt()` and `buildCreatorOutfitPrompt()`.
- Position it so it reads as a styling instruction, not as another hard validator:
  - after the signal brief / guardrail context is acceptable if readability stays strong
  - or alongside the existing "match clothing weight" rules if that creates a clearer narrative
- Make the day-mode wording acknowledge that the current schema is separates-shaped but still encourage skirts and shorts over trousers when heat dominates.
- Make the creator-mode wording focus on representable hot-weather improvements inside the existing contract:
  - skirts
  - shorts
  - sandals
  - sleeveless or airy tops
  - lower-bulk separates
- Avoid implying that creator mode can cleanly return a dress pick until schema work creates a real path for that.
- Ensure the instruction explicitly says hot-weather silhouettes should still feel polished/coherent when city pressure is high, rather than sounding beach-only.

**Patterns to follow:**
- Existing shared prompt-builder composition in `src/lib/outfit-prompt.ts`
- Existing hot-weather prompt assertions in `tests/outfit-day-prompt.test.ts` and `tests/outfit-shopmy-prompt.test.ts`

**Test scenarios:**
- Happy path: day-mode hot prompt includes explicit preference for dresses, skirts, shorts, sandals, or less-fabric silhouettes.
- Happy path: creator-mode hot prompt includes the same heat-native preference while still referencing visible candidate styling and staying within the current `top + bottom` response shape.
- Edge case: the extreme-heat guardrail text remains intact after adding the new preference language.
- Edge case: stable warm/cool prompts remain unchanged and do not pick up the hot-weather silhouette block.
- Integration: prompt text still includes anchor-piece and city-vibe guidance after the new preference wording is inserted.

**Verification:**
- Both prompt builders clearly express the hot-weather silhouette preference without changing response shape or destabilizing existing prompt sections.

- [x] **Unit 3: Strengthen benchmark and review coverage for hot-weather silhouette outcomes**

**Goal:** Make it easy to evaluate whether the prompt-preference patch actually shifts prompt framing away from trouser-default bias, and define the manual checks needed to judge real output quality.

**Requirements:** R5, R6

**Dependencies:** Unit 2

**Files:**
- Modify: `tests/fixtures/outfit-benchmark-queries.json`
- Modify: `tests/fixtures/creator-outfit-benchmark.json`
- Modify: `tests/outfit-benchmark-fixture.test.ts`
- Modify: `scripts/review-outfit-benchmarks.ts`

**Approach:**
- Review the existing hot-weather benchmark scenarios and either:
  - reuse them with clearer hot-weather evaluation notes, or
  - add one or two new scenarios that better expose the trouser-default problem
- Ensure both day mode and creator mode have at least one clear hot-weather benchmark case where a human reviewer would expect dresses, skirts, shorts, sandals, or notably lower-bulk styling to be plausible.
- If helpful, extend the benchmark review output with a small reviewer note or labeling convention that makes hot-weather silhouette checks explicit during manual evaluation.
- Keep this fixture work focused on evaluation; do not turn the benchmark runner into a scoring engine.
- Be explicit that the existing benchmark runner validates deterministic prompt assembly, not final model behavior. Pair it with a short manual spot-check routine against live model outputs before deciding whether prompt preference was enough.

**Patterns to follow:**
- Existing deterministic fixture shape in `tests/fixtures/outfit-benchmark-queries.json`
- Existing review-script snapshot pattern in `scripts/review-outfit-benchmarks.ts`

**Test scenarios:**
- Happy path: benchmark fixtures still parse and include all required fields after hot-weather updates.
- Happy path: day-mode fixtures include at least one clear hot-weather silhouette evaluation scenario.
- Happy path: creator-mode fixtures include at least one clear hot-weather silhouette evaluation scenario.
- Edge case: benchmark runner output remains deterministic for the updated fixtures.
- Integration: the review script output clearly distinguishes prompt-snapshot review from the separate manual model-output review step.

**Verification:**
- Reviewers can use the deterministic benchmark workflow to inspect prompt framing, then run a small manual model-output spot check to judge whether prompt preference was enough before opening schema work.

## System-Wide Impact

- **Interaction graph:** This change is intentionally narrow. It affects prompt text assembled in `src/lib/outfit-prompt.ts`, which flows into `src/app/api/outfit-day/route.ts`, `src/app/api/outfit-shopmy/route.ts`, and then into the existing day/creator cards and image-generation path.
- **Error propagation:** No new error paths are introduced; the existing parse and guardrail behavior remains unchanged.
- **State lifecycle risks:** None beyond normal prompt-output variability. This work does not add persistence, retries, or external side effects.
- **API surface parity:** Both day mode and creator mode should receive the same hot-weather preference semantics to avoid mode drift.
- **Integration coverage:** The main integration risk is qualitative drift between the two prompt builders and the benchmark runner, plus overconfidence from prompt snapshots alone. Fixture-backed prompt tests should cover prompt text, and a small manual model-output review should cover real generated behavior.
- **Unchanged invariants:** Existing API response shapes, guardrail retry behavior, signal computation thresholds, and route request contracts remain unchanged.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Prompt bloat makes the styling prompt feel too crowded | Keep the new preference language short and reusable; prefer replacing weak wording over only adding more text |
| The new preference over-corrects into casual-only summer outfits | Phrase the preference around less-fabric silhouettes that can still be polished, especially in high-style cities |
| Creator mode still under-surfaces dresses despite better wording | Treat that as deliberate evidence for later schema or candidate-set follow-up rather than expanding this patch |

## Documentation / Operational Notes

- If this prompt pass materially improves outputs, update the hot-weather silhouette brainstorm status or capture the decision outcome in a follow-up plan or solution note.
- No rollout or monitoring changes are needed beyond the existing benchmark-review workflow.

## Sources & References

- **Origin document:** `docs/brainstorms/2026-04-14-hot-weather-silhouette-preference-brainstorm.md`
- Related plan: `docs/plans/2026-04-14-outfit-quality-plan.md`
- Related plan: `docs/plans/2026-04-14-001-fix-outfit-weather-signal-guardrails-plan.md`
- Related code: `src/lib/outfit-prompt.ts`
- Related code: `src/lib/outfit-signals.ts`
- Related tests: `tests/outfit-day-prompt.test.ts`
- Related tests: `tests/outfit-shopmy-prompt.test.ts`
- Related script: `scripts/review-outfit-benchmarks.ts`
