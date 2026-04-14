---
topic: Making outfits more stylish and weather-coherent
date: 2026-04-14
status: decided
---

# Making Outfits More Stylish and Weather-Coherent

## What We're Building

Three prompt-level improvements that make outfit recommendations feel like they came from a real stylist who also checked the forecast — not an algorithm.

1. **City vibe injection** — one reflective sentence in the prompt that reminds Claude to consider local style culture. No lookup tables. NYC 55° and LA 55° produce different outfits because Claude already knows the difference — it just needs to be asked.

2. **Anchor-piece styling framework** — replace the current "pick items per slot" prompt structure with a process: choose one visually interesting anchor piece first, then build the rest to support it (balanced volume, cohesive palette, intentional proportions).

3. **Minimal transitions** — only describe carry/evening changes when the weather actually shifts meaningfully (>10° swing, rain arriving, wind change). Silence is better than "put your coat back on."

## Why This Approach

### Problems observed
- Colors don't go together — each item picked independently, no palette center of gravity
- Proportions/silhouette off — oversized on oversized, no volume balance
- Weather transitions feel robotic — "remove coat at midday, add coat at evening" even when the swing is only 5°
- City-blind — same output for NYC and LA at the same temperature

### Research finding: city is a style signal, not just a weather signal
No major fashion app treats city as a first-class input beyond temperature. The research identified three levers:

| Signal | NYC | LA | Paris | Tokyo |
|---|---|---|---|---|
| **Mobility** | Walk-heavy → chunky soles, fashion sneakers | Car-dependent → slides, mules, sandals | Medium-walk → ballet flats, block heels | Heavy-walk → platform soles |
| **Formality** | Effort visible is good (blazer over tee = polished) | Effort should be invisible (linen, cashmere basics) | Effort that shows is the faux pas | Theatrical is normal |
| **Palette** | Black-dominant | Earth tones + bleached neutrals | Muted French neutrals + one accent | Hyper-mono or deliberate maximalism |

Same temperature, completely different recommendations. This is a genuine product differentiator.

### Why framework > guardrails > examples
- **Guardrails** (avoid bad things) produce "not bad" but not intentional. Avoiding mistakes ≠ having taste.
- **Examples** (few-shot) are effective but cost ~500 extra tokens and encode one aesthetic moment that goes stale.
- **Framework** (anchor + supporting cast) gives Claude a decision-making *process*. "Pick the most visually interesting piece → build the palette around it → balance volume" mirrors how real stylists work. Addresses color coherence and proportion issues simultaneously because everything orbits a center of gravity.

### Why minimal transitions
The current carry/evening sections feel formulaic because they describe mechanical actions regardless of magnitude. A 3° temperature drop doesn't warrant styling advice. Only speak when the weather actually changes the calculus — otherwise the "transitions" section adds noise that makes the whole recommendation feel algorithmic.

## Key Decisions

### 1. ~~Curated city profiles~~ → Loose vibe injection (revised)

Originally planned 15-20 hand-tuned city profiles with palette/mobility/formality fields. **Scrapped** after realizing codified profiles would make Claude take them literally — every NYC outfit becomes black, every LA outfit becomes earth tones. Claude takes instructions as hard constraints, not suggestions, which kills variety.

**Instead:** one question-framed sentence in the prompt:

> "How do people in {city} actually dress? Let the local style culture — the pace, the vibe, what's normal on the street — shape this outfit as much as the temperature does."

Claude already knows NYC vs LA vs Tokyo vs Paris from its training data. The question framing makes it *reflect* rather than *comply* — producing more varied, natural outputs than a directive would. No lookup table, no data file, no maintenance burden.

The existing color-direction randomization fires independently on top, so some combos will be "on brand" for the city and some will be unexpected — which is exactly what real style looks like.

Revisit curated profiles only if this approach produces outputs that are *wrong* about a city's vibe for the major cities users care about.

### 2. Anchor-piece framework in the prompt
Add ~3 sentences to both today-mode and creator-mode prompts:

> Style this outfit around ONE anchor piece — the most visually interesting or distinctive item. Everything else supports the anchor: complementary palette, balanced volume (if the anchor is relaxed/oversized, the other pieces should be more fitted, and vice versa). The outfit should feel like it has a point of view, not like five items that happen to be weather-appropriate.

### 3. Minimal transitions — threshold-based
Only generate carry/evening content when:
- Temperature swings >10°F between moments
- Rain probability jumps significantly (e.g., 10% → 60%)
- Wind increases notably

If conditions are stable, the carry/evening sections should say something brief like "Outfit holds all day" rather than manufacturing changes.

### 4. No prompt examples (for now)
Few-shot examples were considered but deferred. The framework approach is cheaper (no extra tokens) and more flexible. If results still feel off after implementing the framework, revisit with 2-3 curated examples.

### 5. Validation via canonical query test suite
Build a set of 8-10 benchmark queries:
- NYC 45°F winter morning
- LA 75°F summer afternoon
- Tokyo 60°F spring rain
- London 50°F overcast
- Paris 55°F autumn
- Miami 85°F humid
- Chicago 30°F wind chill
- SF 60°F fog + wind

Generate outfits for each, screenshot, review. This becomes the regression baseline for prompt tuning. Re-run after each prompt change.

## Open Questions

1. **Creator mode: city style vs creator style?** If Aimee Song (LA-based) is styling an outfit for NYC, should the vibe injection reference NYC or defer to the creator's aesthetic? Probably NYC — the user asked "what to wear IN New York," not "what would Aimee wear at home."

2. **Should the headline reflect the city vibe?** Current headlines are generic ("Olive layers for cool transitions"). Could be: "All-black Tribeca layers for a sharp 45° morning." More character, more city-specific.

## What This Doesn't Cover

- Prompt examples / few-shot learning (deferred)
- User preference learning ("I always wear sneakers" → personalization)
- Seasonal wardrobe rotation (spring vs winter within same city)
- Creator-specific styling voice (making Claude write like a specific influencer)
