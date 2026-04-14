---
title: Improve outfit quality and weather coherence
type: feature
date: 2026-04-14
status: completed
---

# Improve outfit quality and weather coherence

## Overview

The outfit-quality brainstorm is trying to fix a very specific failure mode in the current product: recommendations are often weather-aware in a narrow sense, but they still feel like separately picked garments rather than one intentional outfit. The current prompts in `src/app/api/outfit-day/route.ts` and `src/app/api/outfit-shopmy/route.ts` do ask for weather adaptation, but they still rely on slot-filling plus a random color direction, which leaves too much room for mismatched palettes, weak silhouettes, and robotic midday/evening changes.

This plan focuses on prompt architecture, not model swaps or UI redesign. The goal is to make both outfit modes feel more stylist-driven by adding a stronger styling framework, a lighter city-style signal, and threshold-based transitions that only speak when the weather actually changes enough to matter.

Origin document: `docs/brainstorms/2026-04-14-outfit-quality-brainstorm.md`

## Essential win

Ship one shared outfit-guidance layer that both day-mode and creator-mode routes use, so recommendations:

1. feel like one cohesive outfit built around an anchor piece
2. reflect the vibe of the destination city without rigid lookup tables
3. stop inventing carry/evening changes when the forecast is basically stable
4. remain structurally compatible with the existing API contracts and UI

## Requirements carried forward from origin

- Add a loose city-vibe prompt signal instead of a hardcoded city profile system (see origin: `docs/brainstorms/2026-04-14-outfit-quality-brainstorm.md`)
- Add an anchor-piece styling framework so the model builds supporting pieces around one focal item
- Keep transitions minimal and only describe adjustments when the weather changes meaningfully
- Do not add few-shot prompt examples in the first pass
- Build a small canonical query benchmark set for repeatable review of prompt tuning
- Treat creator mode as dressing for the destination city, not the creator’s home city
- Keep personalization, seasonal wardrobe logic, and creator-voice imitation out of scope

## Review-driven decisions

### 1. Extract shared styling guidance instead of editing two prompts independently

The brainstorm’s ideas apply to both `src/app/api/outfit-day/route.ts` and `src/app/api/outfit-shopmy/route.ts`. If we patch each prompt by hand, they will drift quickly.

Decision:

- Create a small shared prompt-building helper in `src/lib/outfit-prompt.ts`
- Keep route-specific differences local:
  - `outfit-day` still produces free-text garment strings
  - `outfit-shopmy` still produces indexed product picks
- Move the common style logic into shared helpers:
  - city-vibe instruction
  - anchor-piece instruction
  - transition threshold summary
  - headline guidance

This keeps the product behavior aligned without forcing both routes into one giant prompt string.

### 2. City vibe should be derived from the destination query already resolved by weather lookup

The brainstorm is explicit that city style should track where the user is going, not the creator’s home base. The current routes already compute `locationName` from geocoding.

Decision:

- Use the resolved destination city/location already present in each route
- Build one short reflective instruction around that city, framed as a question rather than a directive
- Do not introduce a city profile data file or a hardcoded palette/formality taxonomy

This preserves variety while still nudging the model to reason about local style culture.

### 3. Transition logic should be computed before prompt assembly, not delegated entirely to the model

Right now both routes always ask for carry/evening adjustments. That guarantees output in those sections even on flat-weather days.

Decision:

- Compute a lightweight transition summary from the already-available `moments` data in each route
- Classify transition intensity using explicit thresholds, for example:
  - temperature shift greater than 10°F
  - precipitation jump large enough to change gear expectations
  - wind increase large enough to affect layering
- Feed the result into the prompt as guidance:
  - `"stable day"` means keep transitions minimal and prefer “outfit holds all day”
  - `"meaningful shift"` means describe concrete carry/evening adjustments

This keeps the model expressive without asking it to infer whether transitions should exist from scratch every time.

### 4. Preserve the existing response shape in the first pass

`src/lib/ai-shapes.ts` and `src/lib/types.ts` already define stable contracts for day-mode and creator-mode outputs. The brainstorm talks about better copy and better outfit logic, not a schema migration.

Decision:

- Keep the current JSON shape unchanged for both routes
- Improve wording expectations inside the existing fields instead of changing field names
- Use prompt instructions to allow terse stable-day copy like `"Outfit holds all day"` inside the current `carry` and `evening` objects

This makes the improvement low-risk for the client and keeps the change focused on output quality.

### 5. Benchmark validation should start as a checked-in prompt-review fixture, not a full screenshot framework

The brainstorm wants a canonical query suite. That is the right instinct, but a full screenshot automation harness is bigger than this feature needs for the first pass.

Decision:

- Create small checked-in benchmark fixtures with frozen inputs rather than relying on live API/weather runs
- Add a lightweight script that can run those fixtures and save comparable outputs for manual review
- Keep browser screenshots and visual diffing out of scope for this plan unless prompt iteration proves impossible without them

The benchmark must be deterministic enough to compare before/after prompt changes. That means:

- fixed weather/moment fixture data instead of live forecasts
- deterministic palette selection or an explicit benchmark-mode palette override
- prompt snapshots or saved JSON outputs generated from the frozen inputs

That gives the team a durable prompt-regression baseline without turning planning into an automation project.

### 6. Benchmark day-mode and creator-mode separately

The two routes are both changing, but they do not operate on the same input surface. Day-mode depends mostly on resolved location plus weather moments. Creator mode depends on location, weather, and the curated candidate product set visible to the model.

Decision:

- Keep the canonical city/weather benchmark for `outfit-day`
- Add a second creator-mode benchmark fixture with frozen candidate products and destination/weather inputs
- Do not treat day-mode benchmark coverage as sufficient validation for creator-mode quality

This keeps the validation honest: creator mode needs fixed candidate-set review, not just prompt-string tests.

## Scope boundaries

### In scope

- Shared prompt-building helpers for outfit-day and creator outfit mode
- City-vibe injection for both routes
- Anchor-piece framework guidance for both routes
- Threshold-based transition guidance derived from weather moments
- Slight headline guidance tightening if needed to reflect stronger styling direction
- Checked-in benchmark queries and a small script or fixture-driven test harness for repeatable review
- Focused tests around prompt assembly and transition classification

### Out of scope

- Model/provider changes
- Few-shot prompt examples
- UI redesign or new frontend affordances
- Persisted user preferences or style learning
- Creator-specific voice imitation
- Full screenshot automation or visual diffing infrastructure

## Implementation units

### Unit 1. Shared outfit prompt guidance layer

- [x] Create `src/lib/outfit-prompt.ts`
- [x] Add `tests/outfit-prompt.test.ts`

Responsibilities:

- Define shared prompt fragments for:
  - city-vibe reflection
  - anchor-piece styling framework
  - headline guidance
  - stable-day vs shifting-day transition guidance
- Expose small composable helpers rather than one monolithic prompt string
- Keep day-mode and creator-mode prompt differences explicit at the call site

Key design choices:

- Shared helpers should return plain strings and lightweight metadata, not own API calling or parsing
- The anchor-piece instruction should emphasize palette cohesion and volume balance, because those are the two main quality failures named in the origin brainstorm
- City-vibe language should stay suggestive, not prescriptive, so we do not flatten outputs into “all NYC outfits are black”

Test scenarios for `tests/outfit-prompt.test.ts`:

- Shared city-vibe helper includes the resolved destination city in reflective language
- Anchor-piece helper explicitly instructs the model to pick one focal piece and make the rest support it
- Stable-day transition guidance tells the model not to invent unnecessary changes
- Significant-shift guidance tells the model to describe concrete carry/evening adjustments

### Unit 2. Transition classification from existing weather moments

- [x] Extend `src/lib/outfit-prompt.ts` or add `src/lib/outfit-transitions.ts`
- [x] Add `tests/outfit-transitions.test.ts`

Responsibilities:

- Consume the route’s existing moment summaries and classify the day as:
  - stable
  - moderate shift
  - significant shift
- Base the classification on existing fields already computed in the routes:
  - air temperature
  - sun/shade feel
  - wind speed
  - precipitation chance
- Produce a concise transition note the prompt can consume

Key design choices:

- Keep the heuristic legible and deterministic; this is product behavior, not model taste
- Prefer a small pure helper over embedding threshold math directly in both routes
- Bias toward under-speaking rather than over-speaking, since the current problem is noisy transitions

Test scenarios for `tests/outfit-transitions.test.ts`:

- A day with only a small temperature drift is classified as stable
- A day with a temperature swing above the threshold is classified as shifting
- A large precipitation increase forces a shift classification even if temperature is flat
- A notable wind jump can force a shift classification when layering expectations change

### Unit 3. Update `outfit-day` prompt composition

- [x] Update `src/app/api/outfit-day/route.ts`
- [x] Add `tests/outfit-day-prompt.test.ts`

Responsibilities:

- Replace the current inline prompt assembly with shared guidance helpers
- Inject destination-city styling language
- Inject anchor-piece instructions
- Feed the route-specific transition classification into the prompt
- Tighten wording so stable days can produce brief carry/evening copy without sounding empty

Key design choices:

- Preserve the existing `DayOutfit` response shape from `src/lib/ai-shapes.ts`
- Keep day-mode’s color direction randomization only if it still complements the city-vibe guidance rather than fighting it
- If the current color-direction randomness clashes with anchor-piece coherence, soften it into “palette direction” instead of deleting variation entirely

Test scenarios for `tests/outfit-day-prompt.test.ts`:

- Prompt contains the city-vibe instruction derived from `locationName`
- Prompt contains anchor-piece language and support-piece language
- Stable-day prompt asks for minimal transition changes
- Significant-shift prompt asks for actual adaptations

### Unit 4. Update creator outfit prompt composition

- [x] Update `src/app/api/outfit-shopmy/route.ts`
- [x] Add `tests/outfit-shopmy-prompt.test.ts`

Responsibilities:

- Reuse the shared styling guidance from Unit 1
- Preserve creator-mode specifics:
  - indexed product references
  - candidate image blocks
  - temperature-appropriateness rules for catalog picks
- Use destination-city vibe rather than creator identity as the city-style signal

Key design choices:

- Do not weaken the route’s existing temperature guardrails while improving style quality
- Keep creator-mode’s prompt explicit that the outfit is built from the visible candidate set
- Preserve the current schema and hallucinated-index handling

Test scenarios for `tests/outfit-shopmy-prompt.test.ts`:

- Prompt includes destination-city styling guidance, not creator-home assumptions
- Prompt includes anchor-piece guidance phrased for indexed product selection
- Prompt includes stable-day transition guidance when conditions barely move
- Prompt still includes the existing temperature-critical instructions

### Unit 5. Benchmark fixtures for prompt review

- [x] Create `tests/fixtures/outfit-benchmark-queries.json`
- [x] Create `tests/fixtures/creator-outfit-benchmark.json`
- [x] Create `scripts/review-outfit-benchmarks.ts`
- [x] Add `tests/outfit-benchmark-fixture.test.ts`

Responsibilities:

- Check in the day-mode benchmark set called for in the origin brainstorm:
  - NYC cold morning
  - LA warm afternoon
  - Tokyo spring rain
  - London overcast
  - Paris autumn
  - Miami humid heat
  - Chicago wind chill
  - San Francisco fog + wind
- Check in a separate creator-mode benchmark fixture containing:
  - fixed destination/weather inputs
  - fixed candidate product metadata
  - fixed representative candidate imagery or precomputed image payload fixtures
  - enough representative products to evaluate anchor-piece styling and transition guidance
- Provide one small script that can execute or prepare these fixtures for manual review
- Validate both fixture schemas so the benchmark sets stay stable over time

Key design choices:

- Keep the benchmark files data-only so they can support later automation if we want it
- The first pass should optimize for repeatable review, not for fully automated prompt scoring
- Benchmark runs must use frozen weather/moment inputs and deterministic palette selection
- The script should save machine-readable outputs that can be inspected after prompt changes
- Creator-mode benchmark runs should use the frozen candidate set fixture rather than live catalog/image fetches
- Creator-mode benchmark coverage should exercise the same image-aware prompt shape the route uses in production, not a text-only approximation
- If fixture size becomes unwieldy, the explicit fallback is to scope the benchmark to prompt-assembly validation only and say so in the script output; do not silently pretend text-only validation covers full styling quality

Test scenarios for `tests/outfit-benchmark-fixture.test.ts`:

- Day-mode fixture entries include the minimum fields the review script needs
- The day-mode benchmark set contains all required canonical scenarios from the origin brainstorm
- Creator-mode fixture entries include destination/weather, a fixed candidate set, and image fixture references or payloads
- Fixture validation fails loudly if a scenario is malformed or removed

## Dependencies and sequencing

1. Build the shared prompt guidance and transition classifier first
2. Update `outfit-day` to use the shared helpers
3. Update `outfit-shopmy` to use the same helpers while preserving indexed product selection
4. Add the benchmark fixtures and review script once prompt composition is stable enough to inspect

The core dependency is avoiding prompt drift between the two outfit routes. That is why the shared guidance layer comes before route-level edits.

## Risks and mitigations

- Risk: city-vibe language overwhelms weather logic and produces “fashion first, forecast second” output
  - Mitigation: keep the city guidance to one reflective sentence and preserve the current temperature-critical instructions
- Risk: anchor-piece guidance improves style but reduces catalog fit in creator mode
  - Mitigation: preserve the indexed candidate workflow and existing temperature guardrails, then validate against benchmark queries
- Risk: transition thresholds are too aggressive and suppress useful midday adjustments
  - Mitigation: isolate classification in a pure helper with focused tests so thresholds are easy to tune
- Risk: color-direction randomness fights the new anchor-piece logic
  - Mitigation: explicitly review whether the random palette remains additive after the shared prompt extraction
- Risk: benchmark outputs are too noisy to compare across prompt iterations
  - Mitigation: freeze benchmark inputs and make palette selection deterministic in benchmark mode
- Risk: creator-mode validation is underpowered because it depends on live catalogs
  - Mitigation: add a dedicated creator-mode benchmark fixture with a fixed candidate set plus frozen image inputs

## Open questions to resolve during implementation

These are implementation-owned, not planning blockers:

- Whether the random color/palette direction should be softened or kept unchanged after anchor-piece guidance is introduced
- Whether headline guidance needs one extra sentence to encourage more city-specific character
- Whether the benchmark review script should call shared prompt helpers directly or exercise thin route-level wrappers around frozen inputs

## Exit criteria

- Both outfit routes use the shared city-vibe + anchor-piece + transition-guidance layer
- API response shapes stay compatible with current consumers
- Stable-weather days stop producing noisy carry/evening adjustments by default
- Checked-in deterministic benchmark fixtures exist for both day-mode and creator-mode review
- Prompt-assembly and transition-threshold tests exist at the file paths named above
