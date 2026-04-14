---
topic: Creator catalog scraping and curation strategy
date: 2026-04-14
status: decided
---

# Creator Catalog Curation Strategy

## What We're Building

A two-pass pipeline for building creator product catalogs:

1. **Scraper** — dumps raw product data from LTK/ShopMy (as many as available)
2. **Curator** — processes the raw dump into a balanced, outfit-ready catalog with guaranteed category coverage

The curator uses a **time-window expansion** strategy: start with the last 3 months of products, then expand to 6 → 12 → all-time per category until minimums are met.

## Why This Approach

**Core tension:** LTK creators can have 7,000+ products spanning years. Most old products are discontinued. But scraping only recent products (e.g., last 6 months) can leave some creators with only 20 items — not enough category coverage for outfit generation.

**Priority decision: full outfit first.** A complete outfit with all slots filled matters more than perfect recency. Users can check availability themselves, and resale sites are good enough that "is this still in stock?" is not a meaningful product blocker. A dead affiliate link is minor friction; a missing bottom/shoe slot makes the entire recommendation useless.

**Two-pass separation** keeps each script focused:
- Scraper: reliable data extraction, no business logic
- Curator: all the smart filtering, classification, balancing — easy to re-run without re-scraping

## Key Decisions

### 1. Filter at curation time, not scrape time
Scraper dumps everything it can get. Curator makes quality decisions. This way we can re-curate with different parameters without re-scraping (which is slow + rate-limited).

### 2. Merge sources only for the same creator
If a creator exists in both LTK and ShopMy, merge those two inventories into one final catalog for that creator only. Never mix products across different creators.

Example:
- `aimeesong` LTK + `aimeesong` ShopMy → one final `aimeesong` catalog
- `aimeesong` products never mix with `tezza`

### 3. Time-window expansion for category coverage
Per category, the curator:
- Takes all products from the last **3 months**
- If a category has fewer than its minimum, expands to **6 months** for just that category
- Then **12 months**
- Then **all-time**
- Newest products always preferred within each window

### 4. Category minimums match route needs
The outfit-shopmy route's `addFromPool` calls define the floor:

| Category | Minimum | What the route picks |
|---|---|---|
| Tops (incl. knits) | 3 | 3 candidates |
| Layers (outerwear) | 3 | 3 candidates |
| Bottoms | 2 | 2 candidates |
| Shoes | 2 | 2 candidates |
| Dresses | 1 | 1 candidate |
| Bags | 1 | 1 candidate |
| **Total** | **12** | **~12 sent to Claude** |

If a creator can't hit these minimums even after expanding to all-time, flag them as "incomplete" in the index.

### 5. Skip availability checks
Product availability (`catalog_retailer_product_available`) is unreliable and single-retailer-scoped. A product marked "unavailable" at Nordstrom may still be on SSENSE or available resale. Don't make extra API calls for stock checks.

### 6. No caps — keep everything that passes the time-window
No hard limits per category or per total. If a creator has 200 shoes from the last 3 months, keep all 200. The route already shuffles + picks ~12 candidates via `addFromPool`, so a large catalog just means more variety across requests. Smaller files aren't worth losing products over.

### 7. Store `addedAt` on each product
The curator preserves the `created_at` timestamp from LTK (or scrape date for ShopMy) as `addedAt`. Useful for:
- Downstream recency weighting in the route
- Debugging why a product was included
- Future freshness indicators in the UI

### 8. LTK is the better freshness source; ShopMy helps fill gaps
LTK is the source that best supports "newest first" if we can capture a trustworthy timestamp. ShopMy is still useful, but more as coverage support than as a true freshness signal.

Practical effect:
- Use recent LTK products first where possible
- Pull in ShopMy products when a creator is missing enough tops, bottoms, shoes, etc.
- Best of both: LTK helps freshness, ShopMy helps coverage

## Architecture

```
scripts/scrape-ltk.ts       → data/creators-raw/{username}-ltk.json
scripts/scrape-shopmy.ts    → data/creators-raw/{username}-shopmy.json
                                      ↓
scripts/curate-catalog.ts   → data/creators/{username}.json  (outfit-ready)
                                      ↓
                              data/creators/_index.json  (auto-updated)
```

### Curator pseudocode

```
for each category in [tops, layers, bottoms, shoes, dresses, bags]:
  window = 3 months
  items = products.filter(p => p.category in categoryNames && p.addedAt >= window)
  
  while items.length < minimum[category] && window < ALL_TIME:
    window = nextWindow(window)  // 3m → 6m → 12m → all
    items = products.filter(...)
  
  catalog[category] = items  // all items that passed the window, newest first

output = flatten(catalog) + metadata
```

## User-Facing Implications

- Creator outfits should get more reliable because merged same-creator catalogs have better category coverage.
- Some outfits may include older products if that's what it takes to complete the look.
- Some creators may be flagged as "incomplete" if they still don't have enough useful product coverage.
- We are explicitly not optimizing for "is this still in stock?" in this phase.
- Variety should improve because the route gets a larger valid pool to shuffle from.

## Open Questions

1. **Should the curator auto-update `_index.json`?** Currently manual. Auto-update during curation would save a step.
2. **Should we store raw scrapes permanently?** Or treat them as ephemeral (re-scrape when needed)?
3. **ShopMy doesn't have `created_at` — how do we date those products?** Options: use scrape timestamp (all same date) or scrape in "most recent" order and use position as a proxy.
4. **Should the curated catalog include an `"incomplete": true` flag** if minimums weren't met? The route could show a warning or fall back to non-creator mode.

## What This Doesn't Cover

- Scheduled re-scraping (manual for now)
- Availability checking at runtime
- User-facing freshness indicators
- Claude-based classification (deferred — keyword classifier is good enough)
