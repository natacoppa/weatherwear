---
topic: Flexible outfit families and variation
date: 2026-04-14
status: active
---

# Flexible Outfit Families and Variation

## What We're Actually Trying to Solve

The product problem is no longer just "why no dresses?" It is:

1. The outfit schema is too rigid, so the model keeps collapsing into `top + bottom` even when a dress or other one-piece silhouette would be the most natural answer.
2. Even if we fix that schema issue, repeated similar weather can still produce repeated similar silhouettes, which means different users in the same city could keep getting near-clone answers.

So the real goal is:

- make the outfit shape flexible enough to represent different base silhouettes
- while also creating meaningful variation across users and across days
- without turning the system into either a rigid rules engine or pure randomness

## What We Learned From The Prompt Pass

The hot-weather prompt work was useful, but it exposed a ceiling:

- stronger wording reduced some bad outputs
- it did **not** stop the model from repeatedly choosing airy trousers as the safest polished answer
- that suggests the response contract is steering behavior more than the prompt can overcome

At the same time, pure model freedom is not enough for variation:

- if two users ask for `75° in LA`, the model may keep returning the same safe silhouette
- if we only use weather + prompt, the answer space gets repetitive fast

That means we need **both**:

- a better outfit representation
- a deliberate variation mechanism

## Core Product Principle

We should not randomize full outfits.

We should:

1. decide which **outfit families** are valid for the day
2. pick one valid family using controlled variation
3. make that chosen family an explicit internal constraint
4. let the model style within that family

This keeps:

- weather correctness in code
- variation in the system
- actual taste and styling judgment in the model

It also means the chosen family cannot be just a loose prompt hint. It needs to be an internal first-class field the prompt, parser, and validator can all see, even if it never appears in the UI.

## Recommended Schema Direction

The outfit should be modeled around a **base silhouette**, not fixed apparel slots.

### Why

Today the contract assumes:

- top
- layer
- bottom
- shoes

That is fine for separates, but it makes dresses and other one-piece shapes unnatural.

The cleaner abstraction is:

- the outfit has one **base silhouette**
- then supporting pieces build around it

### Recommended first-pass shape

For day mode, the base silhouette should be one of:

- `separates`
- `dress`

Conceptually:

- `separates` = top + bottom
- `dress` = one-piece base garment

Then keep:

- layer
- shoes
- accessories
- carry
- evening
- bag essentials

### Why this is better than just adding a dress slot

Adding a `dress` slot to the current schema is the fastest patch, but it creates awkward states like:

- dress + top
- dress + bottom
- dress + top + bottom

A base-silhouette model avoids that ambiguity:

- one base choice per outfit
- clean rendering logic
- room later for broader one-piece families if we ever want them

## Variation Principle

We should not let the model choose from the entire universe of valid outfits with no system guidance.

We also should not prescribe exact silhouettes by temperature alone.

Instead:

- code defines the **valid outfit families** for the day
- code picks one family with controlled variation
- the model styles the final outfit within that family

This means:

- you and your neighbor can get different plausible families on the same day
- a single user does not get the same silhouette over and over
- the answer still feels styled, not algorithmically templated

## Recommended Variation Mechanism

### 1. Build a set of valid families for the day

Weather, walking load, and style context determine which families are allowed.

Example for a warm LA day:

- easy dress
- skirt separates
- shorts separates
- airy trouser separates

Example for a humid NYC heat day:

- city dress
- skirt separates
- airy trouser separates
- shorts separates only when the overall style context allows it

### 2. Choose a family using seeded variation

The family choice should not be global random.

It should be seeded by some user-specific input, for example:

- user id if we have one
- otherwise a browser/device id
- plus date
- plus city / weather bucket

That gives:

- different users different likely families
- some day-to-day variation for the same user
- stable-enough behavior that the app does not feel chaotic

### 2.5 Carry the chosen family through the whole request

This is critical.

If the family is only used to influence prompt wording, the model can still ignore it and collapse back to the same safe answer. We already have evidence that prompt-only steering is not reliable enough for that.

So the selected family should be treated as a first-class internal field:

- prompt input should name the chosen family
- output parsing should know which family was selected
- validation should check whether the returned silhouette actually matches the selected family closely enough

Examples:

- if family is `easy_dress`, the output should not come back as trouser separates
- if family is `skirt_separates`, the output should not quietly become airy trousers
- if family is `airy_trouser_separates`, that is the one time trousers are explicitly expected

This family field does **not** need to surface in the UI, but it should exist in the request/response pipeline so the system can enforce the variation decision it made.

### 3. Add anti-repetition memory

The system should avoid choosing the same family for the same user over and over when similar alternatives are also valid.

This can be lightweight at first:

- remember the last few family choices locally
- downweight repeated family picks

### 4. Let the model style within the chosen family

Once a family is selected, the model still decides:

- the exact garment phrasing
- proportions
- color combinations
- accessories
- overall tone

That preserves taste and variation inside the family, rather than replacing styling with templates.

## Starter Outfit Family Set

These are not exact outfits. They are lanes the model can style within.

### Extreme / oppressive heat

- `easy_dress`
  - one-piece, breathable, low-bulk
- `city_dress`
  - more polished one-piece silhouette
- `skirt_separates`
  - sleeveless or airy top + skirt
- `shorts_separates`
  - relaxed but still styled
- `airy_trouser_separates`
  - valid fallback, not default

### Hot but not oppressive

- `easy_dress`
- `skirt_separates`
- `shorts_separates`
- `airy_trouser_separates`
- `light_tailored_separates`
  - only when the day and city support more structure without feeling heavy

### Warm / mild

- `light_separates`
- `skirt_separates`
- `airy_trouser_separates`
- `light_dress`
- `soft_layered_separates`

### Cool

- `structured_separates`
- `soft_layered_separates`
- `dress_plus_layer`
- `tailored_trouser_separates`

### Cold

- `winter_separates`
- `skirt_with_tights`
- `dress_with_layering`
- `coat_anchored_separates`

## What Family Choice Should Influence

The chosen family should shape:

- what the prompt asks for
- what output structure is legal
- how image prompts describe the outfit
- how variation works across repeat requests
- how validation checks whether the model stayed inside the chosen lane

It should **not** fully determine:

- exact garments
- palette
- style nuance
- accessories

Those stay with the model.

The chosen family should therefore be visible at least to:

- the prompt builder
- the output parser / normalizer
- the validator / guardrail layer

It does not need to be rendered in the UI unless we want it for debugging.

## How Prescriptive The System Should Be

We do **not** want:

- `75° = dress`
- `85° = shorts`
- `NYC = skirt`

That would make the product mechanical.

We do want:

- valid family set narrowed by weather and context
- one family selected with variation
- model freedom inside that family

So the system should be **structured**, not over-prescribed.

## Recommended Rollout

### Stage 1: Day-mode flexible base silhouette

Introduce a base silhouette concept for day mode first:

- `separates`
- `dress`

Why day mode first:

- it is free-text, so it is the easiest place to prove the concept
- it touches fewer inventory/indexing constraints than creator mode

### Stage 2: Family-based variation for day mode

Add family selection and seeded variation:

- valid families from weather/context
- choose one family per request using seeded variation
- keep a light anti-repetition memory

### Stage 3: Extend to creator mode carefully

Only after day mode works should creator mode adopt the same family logic.

Creator mode is harder because:

- the output is candidate-index-based
- inventory availability matters
- dresses may be sparse or uneven by creator

So creator mode should follow, not lead.

## Success Criteria

We should consider this direction successful if:

1. hot-weather day mode no longer defaults to airy trousers over and over
2. dresses become a real option without becoming the default every time
3. similar-weather days for one user show more silhouette variety
4. two users in the same city are less likely to get near-identical silhouettes
5. outputs still feel intentional and styled, not random or templated
6. when the system selects a family, the returned outfit usually stays within that family instead of collapsing back to the same default lane

## Risks

### 1. Too much variation creates chaotic outfits

Mitigation:

- choose from valid families, not from arbitrary garment combinations

### 2. Too little variation creates "same answer every day"

Mitigation:

- seeded family selection plus anti-repetition memory

### 3. Schema work balloons in scope

Mitigation:

- keep first silhouette pass to day mode
- support only `separates` and `dress` initially

### 4. Creator mode becomes the tail that wags the dog

Mitigation:

- do not force creator mode into the first schema change
- prove the model in day mode first

## Key Decisions

1. The product needs both **flexible silhouette representation** and **controlled variation**.
2. Pure prompt nudging is not enough.
3. Pure random outfit generation is not acceptable.
4. The right abstraction is **outfit family selection**, not random garment iteration.
5. Outfit family must be a first-class internal constraint, not just a prompt hint.
6. The best first implementation target is **day mode**, not creator mode.

## Open Questions

1. What is the best seed source for variation in anonymous sessions?
2. How many prior family choices should be remembered to reduce repetition without overfitting?
3. Should family selection be visible in debugging/benchmark output for review?
4. At what point does creator mode have enough dress coverage to justify the same schema?
