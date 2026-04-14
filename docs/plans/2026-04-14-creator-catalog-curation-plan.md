---
title: Build creator catalog curation pipeline
type: feature
date: 2026-04-14
status: completed
---

# Build creator catalog curation pipeline

## Overview

We already have two working scrapers (`scripts/scrape-ltk.ts`, `scripts/scrape-shopmy.ts`) and a creator outfit route (`src/app/api/outfit-shopmy/route.ts`) that assumes each creator JSON file is already outfit-ready. What is missing is the middle layer: a durable curation step that turns raw creator inventories into balanced catalogs with enough tops, layers, bottoms, shoes, dresses, and bags for the route's `addFromPool` logic to work reliably.

The origin brainstorm is directionally right: keep scraping and curation separate, prefer complete outfits over perfect freshness, and make the curator cheap to rerun. The main planning work is tightening a few gaps so implementation does not stall:

- ShopMy currently scrapes `tab=popular`, not a trustworthy recency signal
- The current data contract is implicit and source-detected by heuristics (`profileId` vs `curatorId`)
- Merging LTK and ShopMy inventories will need explicit duplicate handling
- "Incomplete creator" needs a real index/API contract, not just a note in prose

Origin document: `docs/brainstorms/2026-04-14-catalog-curation-brainstorm.md`

## Essential win

Ship a two-pass creator catalog pipeline with one source of truth for category minimums and coverage status:

1. Scrapers write raw, source-specific dumps into `data/creators-raw/`
2. A curator merges, dedupes, and balances those raw dumps into `data/creators/{username}.json`
3. The curator also refreshes `data/creators/_index.json` so the API and UI can see completeness metadata without manual bookkeeping

The route should stop guessing what kind of catalog it loaded and instead consume a canonical curated schema with explicit source metadata, coverage stats, and incomplete flags.

## Requirements carried forward from origin

- Two-pass architecture: scrape first, curate second (see origin: `docs/brainstorms/2026-04-14-catalog-curation-brainstorm.md`)
- Category minimums must match the current outfit route selection floor:
  - Tops: 3
  - Layers: 3
  - Bottoms: 2
  - Shoes: 2
  - Dresses: 1
  - Bags: 1
- Prefer recency, but never at the expense of missing key outfit slots
- Do not add runtime availability checks
- Do not cap category sizes once a category has qualified for inclusion
- Preserve freshness metadata where the source supports it
- Flag creators that still miss category minimums after expansion
- Keep scheduled re-scraping, runtime availability checks, UI freshness indicators, and AI-based classification out of scope for this plan

## Review-driven decisions

### 1. Canonical curated schema, not source heuristics

`src/app/api/outfit-shopmy/route.ts` currently infers source by checking whether the loaded JSON has `profileId`. That is brittle and gets worse once curated files are built from multiple sources. The curated output should carry explicit top-level metadata:

- `username`
- `name`
- `image`
- `sources` (`["ltk"]`, `["shopmy"]`, or both)
- `sourceMeta`
- `catalogUpdatedAt`
- `coverage`
- `incomplete`
- `products`

Each curated product should also carry enough provenance for debugging and later recuration:

- `source`
- `sourceProductId`
- `addedAt` (`string | null`)
- `addedAtSource` (`"source" | "scraped_at" | "unknown"`)
- `url` as the final user-facing shop link
- `canonicalCategory` as the curator-approved outfit bucket the route should use directly

`sourceMeta` is where source-specific fields that still matter operationally live, for example ShopMy `curatorId` and LTK `profileId`. Even if the route eventually stops using them directly, the curated schema must not throw them away during the migration.

### 2. Treat ShopMy as weakly dated until the scraper has a trustworthy freshness signal

The brainstorm's time-window expansion works cleanly only when product recency is real. Today `scripts/scrape-shopmy.ts` requests `tab=popular`, so "position" is not equivalent to "newest". The first implementation should not pretend otherwise.

Decision:

- LTK items participate in real date windows whenever the upstream payload exposes a usable timestamp
- ShopMy items are preserved in the raw dump with `scrapedAt` and `sourceRank`, but they are treated as undated supplemental inventory during curation
- Within a category, dated items sort first by newest; undated items only backfill coverage gaps after dated inventory is exhausted

This keeps the complete-outfit priority from the brainstorm without encoding false recency.

### 3. Auto-update `_index.json` as part of curation

Manual index updates fight the whole point of a cheap recuration pass. `scripts/curate-catalog.ts` should be the single command that writes:

- `data/creators/{username}.json`
- `data/creators/_index.json`

The index should expose, at minimum:

- `username`
- `name`
- `image`
- `productCount`
- `topBrands`
- `sources`
- `incomplete`
- `coverage`

### 4. Keep raw scrapes on disk

The origin document's main operational advantage is "re-curate without re-scraping." That only works if raw dumps persist in `data/creators-raw/`. Treat them as checked-in build inputs unless repo size becomes a proven problem.

### 5. Add an explicit creator identity registry

Merging only works if the pipeline knows which LTK and ShopMy accounts belong to the same person. Username equality is not enough because creator handles can differ across platforms.

Decision:

- Add a small checked-in registry file, likely `data/creators/_registry.json`
- One registry entry represents one canonical creator in the product
- Each entry maps that canonical creator to zero or one LTK handle and zero or one ShopMy handle
- Curator input discovery keys off the registry, not off filename coincidence

This makes "merge same creator only" operational instead of aspirational.

### 6. No silent route fallback for incomplete creators

If a creator catalog is incomplete, the route should still be allowed to run. It should surface that status in the response so clients can decide whether to warn, badge, or later fallback. Quietly switching to non-creator mode would hide data quality issues and make debugging harder.

## Scope boundaries

### In scope

- Raw creator schema normalization across LTK and ShopMy
- Canonical creator registry for cross-platform identity mapping
- Curated catalog generation with category coverage guarantees
- Duplicate removal across combined source inventories
- Auto-maintained creator index with completeness metadata
- Route/type updates so creator mode consumes curated metadata intentionally
- Automated tests for selection, dedupe, and index generation behavior

### Out of scope

- Cron or scheduled refresh jobs
- Extra network calls for retailer availability
- UI work beyond plumbing new API fields through existing types
- Replacing the current keyword classifier with an AI classifier
- Large refactors of `src/app/api/outfit-shopmy/route.ts` unrelated to catalog consumption

## Implementation units

### Unit 1. Shared catalog contract and curation engine

- [ ] Create `src/lib/creator-catalog.ts`
- [ ] Extend `src/lib/types.ts` with curated index/coverage types used by APIs and client code
- [ ] Add `tests/creator-catalog.test.ts`

Responsibilities:

- Define canonical category names and minimums in one place
- Define canonical creator identity types used by the registry and curator
- Define raw-source, curated-product, curated-catalog, and coverage-summary types
- Implement pure helpers for:
  - mapping source categories into canonical outfit buckets
  - expanding date windows (`3m -> 6m -> 12m -> all`)
  - sorting dated items ahead of undated items
  - deduping merged source inventories
  - computing `coverage` and `incomplete`

Key design choices:

- Dedupe by normalized destination first (`url` when stable), then fall back to a conservative fingerprint (`normalized title + brand + image`)
- Keep products flat in the final JSON so the route can continue filtering and shuffling from one array, but compute `coverage` by canonical bucket at curation time
- Preserve `addedAt` even when the route does not yet use it so later freshness weighting does not require a re-scrape
- Canonical curated products store a ready-to-use `url`; retained source metadata is for debugging and future tooling, not required for normal rendering
- Canonical curated products also store `canonicalCategory`, and the API route should use that field instead of maintaining its own parallel category lists

Test scenarios for `tests/creator-catalog.test.ts`:

- Date-window expansion stops at the first window that satisfies a category minimum
- When no dated items satisfy a category minimum, undated items backfill instead of being dropped
- Dedupe keeps one copy of the same product appearing in both LTK and ShopMy
- Coverage correctly marks a creator incomplete when one or more minima are still unmet
- Output ordering is newest-first among dated items and stable for undated backfill
- Registry mapping joins different platform handles into one canonical creator without cross-merging unrelated creators

### Unit 2. Normalize raw scraper output for both sources

- [ ] Create `data/creators/_registry.json`
- [ ] Update `scripts/scrape-ltk.ts`
- [ ] Update `scripts/scrape-shopmy.ts`
- [ ] Add `tests/creator-raw-normalization.test.ts`

Responsibilities:

- Introduce a canonical registry entry per creator before merge logic depends on it
- Write both scrapers to a shared raw envelope instead of two unrelated JSON shapes
- Include source-level metadata needed for later curation:
  - `source`
  - `username`
  - `name`
  - `image`
  - `scrapedAt`
  - `products`
- Add per-product provenance fields:
  - `sourceProductId`
  - `sourceRank`
  - `addedAt`
  - `addedAtSource`
  - source-specific metadata needed to derive or verify the final shop link

LTK-specific work:

- Capture a trustworthy timestamp if available from the activities or related product payloads
- If the API does not expose a usable product/post time, leave `addedAt: null` and mark `addedAtSource: "unknown"` rather than fabricating recency

ShopMy-specific work:

- Preserve the order returned by the API as `sourceRank`
- Keep `scrapedAt` at the file level and, if needed for downstream compatibility, optionally mirror it onto `addedAt` only when `addedAtSource` clearly says `"scraped_at"`
- Do not claim ShopMy order is recency unless the upstream request is explicitly changed to a newest/recent sort
- Either emit the final creator-affiliate `url` during normalization/curation or preserve enough source metadata to derive it once and store it in the curated product

Bootstrap-specific work:

- Define how the current creator set enters the registry
- Prefer a one-time explicit registry seed over inference from existing filenames
- If a creator exists today only as a legacy curated file, the bootstrap path must still give them a canonical registry entry
- Define a legacy-import normalization rule: imported legacy products may leave `addedAt: null` and `addedAtSource: "unknown"`, and may derive `sourceProductId` from the legacy product id only when no better source identifier exists

Test scenarios for `tests/creator-raw-normalization.test.ts`:

- LTK normalization produces the raw envelope and retains source/product ids
- ShopMy normalization preserves `sourceRank` in API order
- Missing timestamps remain explicit nulls instead of bogus ISO strings
- Existing fields needed by the route (`title`, `image`, `url`, `price`, `brand`, `category`, `department`) remain present after normalization
- Legacy import normalization produces valid canonical records without inventing fake timestamps or provenance certainty

### Unit 3. Build the curator CLI and curated/index outputs

- [ ] Create `scripts/curate-catalog.ts`
- [ ] Add `tests/creator-curation-cli.test.ts`
- [ ] Add `data/creators-raw/.gitkeep`

Responsibilities:

- Read one canonical creator definition from `data/creators/_registry.json`
- Resolve that creator's raw source files from `data/creators-raw/`
- Merge all available source dumps for that creator
- Run dedupe + coverage expansion by canonical category
- Write curated output to `data/creators/{username}.json`
- Rebuild `data/creators/_index.json` from curated files, not from ad hoc manual edits

Curated output contract:

- Keep all products that qualify once a category's expansion window is chosen
- Store `coverage` with per-category counts, required minimums, and the final window used
- Set `incomplete: true` when any category still misses its required minimum after all windows plus undated backfill are considered
- Preserve source provenance on each product for debugging and later tooling
- Ensure every curated product has a final shoppable `url` before the API switch happens
- Use the registry's canonical username for final output paths and index entries
- Ensure every curated product has one canonical category field that downstream routes can trust without reclassifying

CLI behavior:

- Support a single-creator mode first; batch-all-creators support can be added only if it falls out naturally
- Fail loudly when no raw inputs exist for the requested creator
- Rebuilding `_index.json` should happen in the same invocation so the repo cannot drift into curated/index mismatch
- Include a bootstrap mode that regenerates the current creator set before Phase 3, so the API never has to read a mixed old/new catalog set
- Bootstrap mode must support two explicit sources of input:
  - preferred: fresh raw dumps in `data/creators-raw/`
  - fallback: import legacy `data/creators/{username}.json` files into the canonical schema for creators not yet re-scraped

Bootstrap rule:

- Do not block the migration on a full same-day re-scrape of every existing creator
- Legacy curated files may be imported once as a temporary bootstrap source, but all newly refreshed creators should flow through the raw -> curate path afterward
- Legacy import must normalize into the same canonical schema as raw-driven curation, with unknown fields left explicitly unknown rather than guessed

Test scenarios for `tests/creator-curation-cli.test.ts`:

- Single-source LTK creator curates successfully with coverage metadata
- Mixed-source creator merges and dedupes as expected
- Incomplete creator writes `incomplete: true` and the index reflects it
- Running curation twice on unchanged raw input is deterministic
- Bootstrap/all-creators mode rewrites the existing catalog set into the canonical schema without leaving partial old-format files behind
- Bootstrap mode can ingest a legacy curated file when no raw dump exists yet
- Bootstrap-imported legacy products still emerge with `canonicalCategory`, `url`, and explicit unknown provenance fields

### Unit 4. Consume curated metadata in creator APIs

- [ ] Update `src/app/api/outfit-shopmy/route.ts`
- [ ] Update `src/app/api/creators/route.ts`
- [ ] Extend `src/lib/types.ts`
- [ ] Add `tests/creator-api-contract.test.ts`

Responsibilities:

- Load curated catalogs by their explicit schema instead of source guessing
- Preserve current outfit generation behavior for product selection and image fetching
- Return completeness metadata in the creator outfit response without forcing a UI redesign
- Return completeness metadata from `/api/creators` so the picker can eventually surface it
- Trust the curated product `url` as the source of truth after the schema switch
- Trust the curated product `canonicalCategory` as the source of truth for tops/layers/bottoms/shoes/dresses/bags selection after the schema switch

Concrete API additions:

- `/api/creators` items gain optional `incomplete`, `coverage`, and `sources`
- `/api/outfit-shopmy` response gains optional `incompleteCatalog`, `coverage`, and `catalogUpdatedAt`

Route simplification rule:

- After Phase 3, `src/app/api/outfit-shopmy/route.ts` should stop reconstructing source-specific shop links for curated products
- `product.url` from the curated catalog becomes the single rendering-time link source
- `sourceMeta` remains available for diagnostics and future tooling, not day-to-day request handling
- After Phase 3, `src/app/api/outfit-shopmy/route.ts` should stop maintaining its own category mapping lists for curated products
- `product.canonicalCategory` from the curated catalog becomes the single selection-time category source

Test scenarios for `tests/creator-api-contract.test.ts`:

- Valid curated catalog loads without `profileId` or `curatorId` heuristics
- Incomplete catalogs still return 200 when products exist, but expose `incompleteCatalog: true`
- Missing/empty curated catalogs still produce the current not-found behavior
- Existing client-critical fields (`location`, `creator`, `catalogSize`, `day`, `moments`, `outfit`) stay intact
- Candidate-pool selection in the route matches curated `canonicalCategory` values rather than a duplicated route-local classifier

## Sequencing

### Phase 0. Lock the contract first

- [ ] Finalize canonical category names/minimums in `src/lib/creator-catalog.ts`
- [ ] Finalize `data/creators/_registry.json` shape and canonical username rules
- [ ] Finalize raw and curated JSON shapes before changing scraper output

Gate: one agreed schema for raw dump, curated catalog, and index entry exists before any data rewrite happens.

### Phase 1. Upgrade raw scrapers without changing route behavior

- [ ] Seed the creator registry for the current known creator set
- [ ] Normalize `scripts/scrape-ltk.ts`
- [ ] Normalize `scripts/scrape-shopmy.ts`
- [ ] Capture one representative raw fixture from each source for tests

Gate: raw dumps are richer, but existing curated files and route behavior are still untouched.

### Phase 2. Add curation and index generation

- [ ] Build `scripts/curate-catalog.ts`
- [ ] Generate one or two curated catalogs and inspect coverage output
- [ ] Rebuild `_index.json` from curated files
- [ ] Import any unre-scraped legacy creator files needed for bootstrap
- [ ] Run a bootstrap pass across the existing creator set so all `data/creators/*.json` files are on the new schema before any route switch

Gate: curated files contain explicit coverage metadata and index rebuild is automatic.

### Phase 3. Switch APIs to curated metadata

- [ ] Update creator API types and route loading
- [ ] Keep current creator outfit experience functionally unchanged except for new metadata fields

Gate: creator mode still works, but catalog completeness is now observable instead of implicit.

## Acceptance criteria

### Functional

- [ ] A creator can be scraped into `data/creators-raw/` and curated into `data/creators/{username}.json` without manual JSON editing
- [ ] Curated catalogs preserve enough category coverage to satisfy the route's current `addFromPool` minima when inventory exists
- [ ] `_index.json` is regenerated by the curator and reflects `incomplete` creators
- [ ] `/api/creators` returns the existing list plus completeness metadata
- [ ] `/api/outfit-shopmy` continues to return creator outfits from curated catalogs

### Structural

- [ ] One shared source of truth exists for canonical category minimums
- [ ] One shared source of truth exists for canonical creator identity mapping across LTK and ShopMy
- [ ] Route loading no longer infers source from `profileId` / `curatorId`
- [ ] Route no longer reconstructs source-specific product links for curated products
- [ ] Route no longer maintains a separate category mapping for curated products
- [ ] Raw and curated creator files have explicit schemas with provenance fields
- [ ] Automated tests cover window expansion, undated backfill, dedupe, index rebuild, and API contract stability

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Same creator uses different handles across LTK and ShopMy | Checked-in registry maps platform handles to one canonical creator before merge logic runs |
| ShopMy never exposes trustworthy recency | Treat ShopMy as undated supplemental inventory and avoid fake `addedAt` semantics |
| Duplicate products across LTK and ShopMy inflate candidate pools | Make dedupe part of the shared curation engine, not a route-side cleanup |
| Bootstraped legacy products have weaker provenance than fresh raw dumps | Normalize them into the same schema but leave uncertain fields explicitly `unknown` / `null` instead of fabricating certainty |
| Curated/index schema drift breaks `/api/creators` | Rebuild `_index.json` from curated files in the same script invocation |
| New metadata breaks existing UI assumptions | Extend `src/lib/types.ts` additively and keep current fields stable |
| Bootstrap stalls because existing creators have no raw dumps yet | Allow one-time import of legacy curated files while moving the steady-state flow to raw -> curate |
| Curator coverage says a creator is complete but the route filters differently | Route consumes curated `canonicalCategory` directly instead of reclassifying products |
| Overfitting the curator to today's route shape | Keep category minimums centralized and documented so route and curator can evolve together |

## Verification plan

- `tests/creator-catalog.test.ts`
- `tests/creator-raw-normalization.test.ts`
- `tests/creator-curation-cli.test.ts`
- `tests/creator-api-contract.test.ts`
- Existing smoke coverage in `tests/smoke.spec.ts` remains the baseline regression guard for `/app`

## Assumptions

- Raw creator dumps are acceptable as repo artifacts for now
- Creator UI warning/badge work is not required to land the pipeline; API metadata is enough for this phase
- We are optimizing first for data quality and rerunnability, not for the fastest possible scrape/curate throughput
