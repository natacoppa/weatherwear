---
topic: Hot-weather silhouette preference
date: 2026-04-14
status: superseded
---

# Hot-Weather Silhouette Preference

> Superseded by `docs/brainstorms/2026-04-14-outfit-family-variation-brainstorm.md`, which captures the broader direction: flexible base silhouettes plus controlled user-to-user variation.

## What We're Building

A focused prompt-quality improvement that makes very warm and extreme-heat outfit recommendations prefer **less-fabric silhouettes** instead of defaulting to polished separates.

In practice, that means hot-weather recommendations should more naturally surface:

- Dresses
- Skirts
- Shorts
- Sandals
- Airy, low-bulk separates

Instead of repeatedly defaulting to:

- Trousers
- Tailoring
- Light blazers
- Editorial layered city looks

## Why This Matters

The recent outfit-quality and weather-guardrail work fixed obvious nonsense, but it did **not** teach the model a strong positive preference for the most heat-appropriate silhouette.

Current behavior is better at avoiding absurd choices, but still often feels like:

- "smart city outfit, but lighter"

Instead of:

- "this is actually a brutally hot day, so the silhouette itself should get simpler, airier, and less fabric-heavy"

That creates two product problems:

1. **Hot days still feel too tailored.**
   The app is less wrong, but not yet obviously right.

2. **Dresses, skirts, and shorts feel abnormally rare.**
   Users notice this because those are some of the most natural real-world answers to heat.

## What We Think Is Happening

### 1. The prompt still has a strong polished-separates bias

The shared styling framework in `src/lib/outfit-prompt.ts` is doing useful work around cohesion and city vibe, but it still gives the model plenty of room to interpret "stylish" as:

- trousers
- loafers
- blazer-adjacent polish

Especially in cities like New York.

### 2. The schema is still separates-shaped

The outfit contracts in `src/lib/types.ts` and `src/lib/ai-shapes.ts` assume a `top + bottom + layer + shoes` structure.

That means:

- **dresses do not have a natural home** in the current outfit response shape
- **skirts and shorts are technically allowed**, but only as generic `bottom` choices

So even before prompt preference, the system is structurally nudged toward separates.

### 3. Guardrails stop bad outcomes but do not create the best ones

The new guardrails can block obviously wrong results in `src/lib/outfit-output-guardrails.ts`, but they do not say:

- "prefer dresses over trousers in oppressive heat"
- "prefer shorts or skirts over wide-leg pants when heat is the dominant constraint"

That is a different kind of behavior: **preference**, not prohibition.

## Key Decisions

### 1. Treat this as a separate product-quality patch, not an extension of the guardrail bugfix

The current branch solved "do not be obviously stupid."

This brainstorm is about:

- "what should the system positively prefer when it is very hot?"

That is a different problem and should stay separate in scope.

### 2. Immediate fix: add a strong hot-weather silhouette preference

On `hot` and especially `extreme` days, the prompt should explicitly favor:

- Dresses
- Skirts
- Shorts
- Sandals
- Sleeveless or low-bulk tops
- Airy, breathable shapes

Trousers should remain allowed, but they should stop being the default answer.

### 3. Keep the first patch prompt-level

The first move should be a prompt-preference patch, not a schema migration.

Why:

- lower risk
- faster feedback
- likely enough to improve outputs immediately

### 4. Schema support for dresses is a likely follow-up, not part of the first patch

Longer term, dresses probably need a real path in the outfit contract rather than being squeezed into a separates-oriented system.

But we should not combine these into one patch unless the prompt-preference pass clearly fails.

### 5. Shorts belong in the preference set, not as an afterthought

This is important: the issue is not just "why no dresses?" It is really:

- why does the system default to **more fabric** on hot days?

So the preference set needs to include:

- dresses
- skirts
- shorts
- sandals

Not just dresses alone.

## Recommended Direction

Do this in two stages:

### Stage 1: Hot-weather preference patch

Update the prompt so that on hot and extreme-heat days it clearly favors less-fabric silhouettes first.

Success looks like:

- fewer trouser-first hot-weather outfits
- more dresses, skirts, shorts, and sandals
- city vibe still matters, but does not overpower heat reality

### Stage 2: Revisit schema if needed

Only if Stage 1 still feels pants-shaped should we do the larger structural change:

- add a real dress path to the response schema
- allow outfit assembly to choose between `dress` and `top + bottom`

## Decision Rule: When Prompt Preference Is Not Enough

We should **not** jump to schema work just because one or two outputs still look too trouser-first. Prompt work needs a fair shot first.

Prompt preference should be considered **good enough** if, after implementation and spot-checking a small benchmark set of hot-weather scenarios:

- dresses, skirts, shorts, and sandals begin showing up naturally in hot-weather outputs
- trousers are no longer the dominant default on extreme-heat days
- the outputs feel more obviously heat-native without losing coherence or city/style character

We should escalate to schema support only if one or more of these remain true **after** the prompt-preference patch:

1. **Dresses still almost never appear**
   Even in scenarios where a human stylist would frequently choose one.

2. **The model keeps forcing one-piece silhouettes into separates logic**
   For example, repeatedly choosing top + bottom combinations that feel more contrived than a simple dress would.

3. **Prompt wording starts doing unnatural contortions**
   If we find ourselves adding increasingly specific dress-preferring language and the system still resists, that is a sign the contract is fighting the desired outcome.

4. **Creator mode clearly suffers from the same structural ceiling**
   If the candidate set contains appropriate dresses but the route almost never picks them, that suggests the problem is deeper than wording.

## If We Escalate: Preferred Schema Direction

If Stage 2 becomes necessary, the first schema move should be modest:

- add a real `dress` slot/path
- allow `top` and `bottom` to be nullable when `dress` is used

This is preferable to a full silhouette abstraction in the first pass because it:

- directly addresses the current product gap
- keeps API and UI changes understandable
- avoids turning a focused improvement into a larger outfit-engine redesign

Broader one-piece modeling (jumpsuits, sets, more flexible base silhouettes) should be treated as later work only if the `dress` path still proves too narrow.

## Open Questions

1. Should the hot-weather preference be triggered only for `extreme` heat, or also for `hot` days in the mid/high 80s?
2. Should skirts and shorts be preferred equally, or should the system bias toward the more polished option when city/formality pressure is high?
3. In creator mode, should candidate-set construction also do more to surface skirts/shorts/dresses on hot days, or is prompt preference enough for the first pass?

## What This Doesn't Cover

- Reworking the outfit schema in this first pass
- Personal style preferences
- Occasion-specific dress codes
- A full simplification pass on the entire styling engine
