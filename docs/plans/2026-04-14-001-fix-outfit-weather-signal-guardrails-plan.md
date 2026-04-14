---
title: Add weather-signal guardrails for outfit prompts
type: fix
status: completed
date: 2026-04-14
origin: docs/brainstorms/2026-04-14-outfit-quality-brainstorm.md
---

# Add weather-signal guardrails for outfit prompts

## Overview

The current outfit-quality work improved coherence, city vibe, and transition restraint, but it still leaves one important failure mode unresolved: on extreme-weather days, the model can produce outfits that are stylistically coherent yet physically absurd. The concrete example that surfaced this gap was a day-mode recommendation for a 71°F morning, 101°F midday, and 80°F evening that still included a bomber jacket and scarf in the morning look.

This fix keeps the shared prompt architecture from the completed outfit-quality plan, but adds a deterministic weather-signal layer and a lightweight output guardrail pass so obviously wrong results do not ship just because the model found a plausible editorial narrative. The goal is not to create dozens of scenario-specific prompts; it is to compute a small set of reusable signals, inject a concise styling brief, and reject outputs that violate whole-day reality.

This plan follows the completed prompt-architecture work in `docs/plans/2026-04-14-outfit-quality-plan.md` and should be treated as a targeted corrective pass rather than a re-plan of that feature.

## Problem Frame

The existing prompt layer in `src/lib/outfit-prompt.ts` balances three goals: one cohesive outfit, destination-city style, and minimal transition chatter. That works for many days, but it still overweights the `walkOut` moment when the day has an extreme peak later on. In the shipped prompt, `buildDayOutfitPrompt()` explicitly frames 8am as "coldest/most exposed" while also asking for one outfit that works all day. On a day that climbs into extreme heat, those instructions conflict, and the model can rationalize transitional layers that a human would reject immediately.

The user feedback here is clear: the product should not need a bespoke prompt for every combination of dry heat, humid heat, subway walking, or car-oriented days. Instead, the app should compute a small set of interpreted signals, feed those into the shared prompt skeleton, and add a thin anti-nonsense validator after the model responds. That preserves prompt flexibility while making the product more trustworthy on extreme days. The outcome should satisfy the original outfit-quality intent from the origin brainstorm while closing the new heat-driven failure mode (see origin: `docs/brainstorms/2026-04-14-outfit-quality-brainstorm.md`).

## Requirements Trace

- R1. Prevent obvious whole-day weather misses, especially extreme-heat layering failures such as jackets, scarves, or knits on 95°F+ peak days.
- R2. Compute a small reusable set of styling signals in code instead of branching into many scenario-specific prompts.
- R3. Apply the same signal semantics to both `outfit-day` and `outfit-shopmy` so the two routes do not drift.
- R4. Preserve current API response shapes and downstream rendering contracts in `src/lib/ai-shapes.ts`, `src/lib/types.ts`, and the existing UI components.
- R5. Add a lightweight output guardrail pass that can catch obviously invalid results even if the prompt is ignored.
- R6. Lock the reported 71°F / 101°F / 80°F case into repeatable regression coverage.

## Scope Boundaries

- In scope:
  - Deterministic signal computation from existing route weather moments
  - Prompt-brief and guardrail integration for both outfit routes
  - A bounded retry or failure strategy when the model violates hard weather constraints
  - Focused tests and benchmark-fixture updates for the hot-day regression
- Out of scope:
  - A giant city taxonomy or one prompt per weather/city scenario
  - User-specific comfort profiles or personalization
  - UI changes, new response fields, or visual debugging surfaces
  - Reworking `src/app/api/outfit-image/route.ts` beyond benefiting from better upstream outfit text
  - Broad model/provider changes

## Context & Research

### Relevant Code and Patterns

- `src/lib/outfit-prompt.ts` already centralizes shared prompt composition, transition classification, and deterministic benchmark helpers. This is the right home for prompt-adjacent logic, but deterministic signal computation may deserve its own helper if it starts to crowd prompt strings.
- `src/app/api/outfit-day/route.ts` and `src/app/api/outfit-shopmy/route.ts` already compute the same three `moments` shape and pass that through `classifyTransitionIntensity()`, which gives this fix a natural insertion point before prompt assembly.
- `tests/outfit-prompt.test.ts`, `tests/outfit-day-prompt.test.ts`, `tests/outfit-shopmy-prompt.test.ts`, and `tests/outfit-transitions.test.ts` establish the testing pattern for deterministic prompt helpers and route-specific prompt text.
- `src/components/day-card.tsx` and the creator-mode UI render route output directly; they do not reinterpret garment weight or filter stylist choices. That means correctness must be enforced upstream in prompting and validation.
- `src/app/api/outfit-image/route.ts` builds image prompts from the returned outfit text, so absurd upstream garment choices propagate directly into generated imagery.

### Institutional Learnings

- No `docs/solutions/` directory exists in this repo right now, so there are no project-specific solution notes to carry forward for this fix.

### External References

- None. The codebase already has the relevant local pattern for shared prompt composition, route integration, and deterministic helper testing, so external research would add little value for this bounded fix.

## Key Technical Decisions

- Compute a compact signal brief rather than multiplying prompt variants: this keeps the prompt skeleton stable while allowing the weather interpretation to get smarter.
- Separate prompt-writing concerns from signal computation concerns: deterministic signal logic should live in a shared pure helper so it can be tested independently of prompt prose.
- Keep the signal set intentionally small: `peakHeat`, `coldFloor`, `transitionIntensity`, `humidityBurden`, `sunExposure`, `walkingLoad`, `carryTolerance`, and `styleContext` are enough for the current product problem.
- Lock the first-pass thresholds into the plan so this fix remains deterministic:
  - `peakHeat`: `mild < 72`, `warm 72–84`, `hot 85–94`, `extreme 95+`
  - `coldFloor`: `warm >= 65`, `cool 50–64`, `cold 35–49`, `severe < 35`
  - `humidityBurden`: `high` when `temp >= 80 && humidity >= 60` or `shadeFeel >= 85`; `medium` when `humidity >= 50` and `high` is not triggered; `low` otherwise
  - `sunExposure`: `brutal` at `uvIndex >= 8`, `strong` at `uvIndex >= 5`, `soft` otherwise
  - `walkingLoad`: default `medium`, promote only a small checked-in set of dense transit cities to `high`
  - `carryTolerance`: default `medium`, downgrade to `low` when `walkingLoad=high` and `peakHeat` is `hot` or `extreme`
- Treat extreme conditions as overrides, not vibes: if `peakHeat` is extreme, the outfit must be built for that peak even when the morning is merely mild.
- Add a post-response guardrail layer with bounded retry: prompt improvements alone are not enough when the model can still produce polished nonsense.
- Validate creator mode after candidate enrichment, not against raw parsed indices: the creator route only has useful garment metadata after index resolution, so guardrails must inspect the resolved products the user would actually receive.
- Preserve current response shapes and renderers: this is a correctness fix inside existing route contracts, not a schema change.

## Open Questions

### Resolved During Planning

- Should this be solved with many scenario-specific prompts? No. The plan uses one shared prompt skeleton plus a computed signal brief and a small set of hard guardrails.
- Should the same weather-signal logic apply to creator mode? Yes. The creator route has the same weather interpretation problem and should not keep a weaker variant.
- Should the first pass expose signals in the API response for debugging? No. Keep signals internal to prompting and validation until product value justifies surface-area expansion.
- Should guardrail failures silently retry or immediately error? Retry once with a corrective append, then fail cleanly if the second response still violates hard constraints.

### Deferred to Implementation

- Whether the deterministic signal logic belongs inside `src/lib/outfit-prompt.ts` or in a new `src/lib/outfit-signals.ts` helper if the file starts to lose cohesion.
- The exact keyword list for first-pass hot-day guardrail matching, as long as it clearly catches the currently reported failure mode without blocking normal warm-weather tailoring language by accident.
- Whether `walkingLoad` should remain a tiny destination heuristic or later move to explicit user context when the product supports it.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```text
route weather moments
  -> compute signal brief + override flags
  -> format concise styling brief / guardrails
  -> build shared prompt text
  -> call Anthropic
  -> parse AI JSON
  -> validate output against override flags
       -> valid: return existing response shape
       -> invalid and retry budget unused: retry once with corrective note
       -> invalid after retry: fail cleanly
```

## Implementation Units

- [ ] **Unit 1: Add deterministic outfit signal computation**

**Goal:** Introduce a pure shared helper that turns existing moment weather into a compact styling brief and override flags.

**Requirements:** R1, R2, R3

**Dependencies:** None

**Files:**
- Create or modify: `src/lib/outfit-signals.ts`
- Modify: `src/lib/outfit-prompt.ts`
- Test: `tests/outfit-signals.test.ts`

**Approach:**
- Define a typed signal shape that includes:
  - `peakHeat`
  - `coldFloor`
  - `transitionIntensity`
  - `humidityBurden`
  - `sunExposure`
  - `walkingLoad`
  - `carryTolerance`
  - `styleContext`
  - `overrides.extremeHeat`
  - `overrides.extremeCold`
  - `overrides.footwear`
- Derive weather-based signals from the existing `PromptMomentWeather[]` routes already compute.
- Use the following first-pass thresholds as the implementation contract:
  - `peakHeat`: `mild < 72`, `warm 72–84`, `hot 85–94`, `extreme 95+`
  - `coldFloor`: `warm >= 65`, `cool 50–64`, `cold 35–49`, `severe < 35`
  - `humidityBurden`: `high` when `temp >= 80 && humidity >= 60` or `shadeFeel >= 85`; `medium` when `humidity >= 50` and `high` is not triggered; `low` otherwise
  - `sunExposure`: `brutal` at `uvIndex >= 8`, `strong` at `uvIndex >= 5`, `soft` otherwise
- Keep city-derived signals intentionally tiny and low-risk:
  - default `walkingLoad` to `medium`
  - promote known dense transit cities to `high`
  - default `styleContext` conservatively rather than inventing a deep taxonomy
- Compute `carryTolerance` from the signal brief rather than ad hoc route logic:
  - default `medium`
  - downgrade to `low` when `walkingLoad=high` and `peakHeat` is `hot` or `extreme`
  - only allow `high` when heat burden is low and the day has a meaningful transition
- Reuse the existing transition classifier output instead of duplicating that logic under a second name.

**Execution note:** Start with deterministic helper tests so thresholds and naming are locked before prompt prose changes.

**Patterns to follow:**
- `src/lib/outfit-prompt.ts` for small pure helper functions
- `tests/outfit-transitions.test.ts` for threshold-driven unit tests

**Test scenarios:**
- Happy path: a `71 / 101 / 80` day with high UV becomes `peakHeat=extreme`, `extremeHeat=true`, and a low or medium `carryTolerance`.
- Happy path: a humid `88°F` day produces `humidityBurden=high`.
- Happy path: a high-UV clear day produces `sunExposure=brutal`.
- Edge case: a cool but sunny day does not accidentally trigger `extremeHeat`.
- Edge case: a single-moment or sparse-moment day still returns a complete signal object with safe defaults.
- Integration: `transitionIntensity` in the signal brief matches the existing `classifyTransitionIntensity()` result for the same inputs.

**Verification:**
- The repo has one deterministic source of truth for weather/style signals that both routes can consume without duplicating thresholds.

- [ ] **Unit 2: Rebuild prompt assembly around the signal brief**

**Goal:** Update both prompt builders so they receive interpreted signals and hard guardrails instead of relying on raw moment text and generic temperature bands alone.

**Requirements:** R1, R2, R3, R4

**Dependencies:** Unit 1

**Files:**
- Modify: `src/lib/outfit-prompt.ts`
- Test: `tests/outfit-prompt.test.ts`
- Test: `tests/outfit-day-prompt.test.ts`
- Test: `tests/outfit-shopmy-prompt.test.ts`

**Approach:**
- Extend the day and creator prompt builders to accept the computed signal brief.
- Add a concise "Styling brief" section and a concise "Guardrails" section to both prompts.
- Keep the existing city-vibe and anchor-piece language, but patch the current instruction conflict where `walkOut` can overpower whole-day reality.
- For extreme heat, explicitly instruct:
  - build for peak heat, not the morning
  - no jacket, scarf, sweater, knit, wool, cashmere, or unnecessary layer
  - midday changes should be sun-management or comfort-management only
- Preserve the current response shapes and route-specific prompt differences:
  - free-text items in day mode
  - indexed candidate selection in creator mode

**Patterns to follow:**
- Existing prompt helper composition in `src/lib/outfit-prompt.ts`
- Route-specific prompt tests in `tests/outfit-day-prompt.test.ts` and `tests/outfit-shopmy-prompt.test.ts`

**Test scenarios:**
- Happy path: the day-mode prompt for the hot regression case includes "build for peak heat, not the morning".
- Happy path: the creator prompt receives the same extreme-heat guardrail language.
- Happy path: stable-day prompts still ask for minimal carry/evening chatter.
- Edge case: a genuinely cool day still allows layered language and does not inherit hot-day bans.
- Edge case: city-vibe and anchor-piece instructions remain present after signal-brief insertion.
- Integration: benchmark-mode prompt direction selection still works deterministically after the new prompt inputs are added.

**Verification:**
- Both prompt builders use the same interpreted weather brief, and extreme-heat rules are visible in prompt text for both routes.

- [ ] **Unit 3: Wire signal computation into both outfit routes**

**Goal:** Compute the signal brief inside both routes before prompt assembly and keep the existing response contracts intact.

**Requirements:** R2, R3, R4

**Dependencies:** Unit 1, Unit 2

**Files:**
- Modify: `src/app/api/outfit-day/route.ts`
- Modify: `src/app/api/outfit-shopmy/route.ts`
- Test: `tests/outfit-day-prompt.test.ts`
- Test: `tests/outfit-shopmy-prompt.test.ts`

**Approach:**
- After moment extraction, compute the signal brief from the route’s `moments`, resolved destination location, and existing transition assessment.
- Pass the signal brief into the prompt builder without changing the route output shape.
- Keep creator-mode image block assembly and candidate mapping unchanged; only the weather/style interpretation path should change here.
- Preserve the current geocoding-derived destination-city behavior from the completed outfit-quality work.

**Patterns to follow:**
- Existing moment extraction and prompt-builder call sites in `src/app/api/outfit-day/route.ts` and `src/app/api/outfit-shopmy/route.ts`

**Test scenarios:**
- Happy path: day route prompt construction receives the signal brief for an extreme-heat day.
- Happy path: creator route prompt construction receives the same signal semantics.
- Edge case: missing midday or evening moments still produce a prompt using safe signal defaults.
- Integration: creator route keeps its existing candidate-image prompt blocks while swapping only the weather/prompt metadata path.

**Verification:**
- Both routes compute and pass a shared signal object before the model call, with no API shape change on success.

- [ ] **Unit 4: Add output guardrails and bounded retry**

**Goal:** Reject obviously invalid outfits after parsing so polished nonsense does not make it to the UI or image generator.

**Requirements:** R1, R3, R4, R5

**Dependencies:** Unit 1, Unit 3

**Files:**
- Create: `src/lib/outfit-output-guardrails.ts`
- Modify: `src/app/api/outfit-day/route.ts`
- Modify: `src/app/api/outfit-shopmy/route.ts`
- Modify: `src/lib/ai-shapes.ts` (only if needed for clearer error handling)
- Test: `tests/outfit-output-guardrails.test.ts`

**Approach:**
- Add a small validator that inspects parsed outfit fields against the computed override flags.
- First-pass rules should be explicit and narrow:
  - if `extremeHeat` is active, reject outputs containing obvious heavy-layer tokens such as jacket, coat, scarf, bomber, wool, or cashmere
  - if `extremeCold` is active, reserve room for future cold underdressing checks even if hot-day protection is the immediate priority
  - if `footwear` guardrail is active, allow the validator to grow later without blocking this fix
- Validate day mode and creator mode at different points in the flow:
  - day mode can validate directly against parsed string fields after `assertDayOutfit()`
  - creator mode must validate after candidate index resolution/enrichment, using the resolved product titles/categories that would actually be returned to the client
- On violation, retry the model once with a corrective appended instruction instead of silently accepting the result.
- If the second result still violates hard constraints, fail cleanly rather than returning a knowingly wrong outfit.

**Execution note:** Keep the guardrail small and comprehensible; this is an anti-nonsense layer, not a second stylist engine.

**Patterns to follow:**
- Parse/shape validation flow in `src/lib/ai-shapes.ts`
- Existing route error handling for malformed AI responses

**Test scenarios:**
- Happy path: an extreme-heat output with sunglasses, hat, and breathable garments passes.
- Error path: an extreme-heat output containing "bomber jacket" is rejected.
- Error path: an extreme-heat output containing "sage linen scarf" is rejected.
- Edge case: a mild warm day mentioning a lightweight blazer for evening is not rejected unless the extreme-heat override is active.
- Integration: creator-mode validation catches a resolved candidate pick with a heavy-layer title/category even though the raw AI response only contained indices.
- Integration: a guardrail failure triggers one retry path and does not change the successful response shape.

**Verification:**
- The system no longer returns obviously impossible hot-day outfits without either retrying or failing.

- [ ] **Unit 5: Lock the 71° / 101° regression into tests and benchmarks**

**Goal:** Make the reported failure durable so future prompt edits cannot quietly reintroduce it.

**Requirements:** R1, R5, R6

**Dependencies:** Unit 2, Unit 4

**Files:**
- Modify: `tests/outfit-day-prompt.test.ts`
- Modify: `tests/outfit-benchmark-fixture.test.ts`
- Modify: `tests/fixtures/outfit-benchmark-queries.json`
- Test: `tests/outfit-output-guardrails.test.ts`

**Approach:**
- Add a named benchmark fixture representing the reported hot-day failure.
- Assert prompt-level expectations for the signal brief and heat override language.
- Assert guardrail-level expectations that heavy layers are rejected for the same scenario.
- Keep the fixture focused on the weather reality, not the exact wording of one generated outfit.

**Patterns to follow:**
- Existing fixture structure in `tests/fixtures/outfit-benchmark-queries.json`
- Existing deterministic benchmark validation in `tests/outfit-benchmark-fixture.test.ts`

**Test scenarios:**
- Happy path: the new fixture parses and validates alongside the current benchmark set.
- Happy path: prompt assembly for the fixture includes the whole-day heat override.
- Error path: the fixture’s guardrail check fails for a jacket/scarf response.
- Integration: the benchmark suite still remains deterministic after the new case is added.

**Verification:**
- The reported heat-wave failure exists as a checked-in regression case at both prompt and guardrail layers.

## System-Wide Impact

- **Interaction graph:** `src/app/api/outfit-day/route.ts` and `src/app/api/outfit-shopmy/route.ts` will both gain a new dependency on shared signal computation and shared output guardrails. `src/app/api/outfit-image/route.ts` remains unchanged but benefits from cleaner upstream outfit text.
- **Error propagation:** Prompt or parse failures should continue to surface through the existing route error handling. Guardrail violations add one internal retry path, then fail cleanly if the second response remains invalid.
- **State lifecycle risks:** This change is request-local and stateless. The main risk is duplicate model work from the retry path, which should remain bounded to one retry.
- **API surface parity:** Both outfit routes should share the same weather-signal semantics. Response JSON contracts should remain unchanged on success.
- **Integration coverage:** Route-level integration tests should verify that the new prompt/guardrail flow does not break creator candidate indexing or day-mode response parsing.
- **Unchanged invariants:** `DayOutfit`, `CreatorOutfit`, and the current UI rendering contracts remain intact. The fix changes route internals, not public response shape.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| The signal set becomes too large and turns into a disguised rules engine. | Keep the first pass to the eight planned signals and three override flags; defer broader heuristics. |
| Guardrail keyword matching blocks acceptable warm-weather tailoring language. | Keep first-pass checks narrow and tie them only to active override flags, with targeted regression tests. |
| Retry behavior adds latency or token cost in edge cases. | Retry only once, only on guardrail violation, and keep the validation fast and deterministic. |
| Day mode and creator mode drift because one route bypasses the shared signal path. | Require both routes to compute the same signal brief and cover both in prompt tests. |

## Documentation / Operational Notes

- Update `docs/plans/2026-04-14-outfit-quality-plan.md` only if needed to reference this follow-on corrective plan after implementation lands.
- No rollout tooling or feature flag is required for the first pass, but implementation should log or surface enough context during development to confirm when guardrails are triggering.

## Sources & References

- **Origin document:** `docs/brainstorms/2026-04-14-outfit-quality-brainstorm.md`
- Follow-on plan: `docs/plans/2026-04-14-outfit-quality-plan.md`
- Related code:
  - `src/lib/outfit-prompt.ts`
  - `src/app/api/outfit-day/route.ts`
  - `src/app/api/outfit-shopmy/route.ts`
  - `src/components/day-card.tsx`
  - `src/app/api/outfit-image/route.ts`
