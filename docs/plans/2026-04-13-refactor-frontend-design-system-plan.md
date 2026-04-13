---
title: Refactor frontend to a real design system
type: refactor
date: 2026-04-13
status: revised after plan review (DHH / Kieran-TS / Simplicity)
---

# Refactor frontend to a real design system

## Overview

Two monolith page files (`src/app/page.tsx` 686 lines, `src/app/app/page.tsx` 1,056 lines) contain 52 unique inline hex colors retyped dozens of times, zero use of the shadcn components already sitting in `src/components/ui/`, and inline `<style>` keyframe tags that duplicate and collide. This refactor fixes that in **4 phases** across ~10 hours of work. No new features, no new behavior beyond fixing one silent error.

## Essential win

The real leverage is two things:
1. **Rebind shadcn CSS vars to the earthy palette** so `bg-primary`/`border-border`/`text-muted-foreground` render in brand colors, then sweep every hex → token.
2. **Extract components that carry real logic** (`<Nav>`, `<DayCard>`, `<MomentBlock>`, `<SearchBar>`, etc.) — not styled-paragraph wrappers.

Everything else (new state machines, validation libraries, toast libraries, typography components) is cut — it's feature creep dressed as refactor.

## Scope decisions (what was cut after review)

| Cut | Why |
|---|---|
| `<Rule>`, `<Eyebrow>`, `<Display>`, `<SectionLabel>` typography primitives | Each names a class string without adding behavior. Use `@apply` utilities in `globals.css` or raw Tailwind. |
| `<HeroImage>`, `<PaletteSwatches>`, `<StatTile>` | One-off sections masquerading as generic primitives. |
| 7-subdirectory component taxonomy | Over-structured for a solo product. Flat `src/components/` with light grouping only where it emerges. |
| `zod` API validation | No reported validation bug. Routes serve own UI. Add when a real failure appears. |
| `sonner` toast library | Overkill to replace one `alert()`. Keep the alert or inline toast div. |
| `useOutfitResult` reducer + discriminated union | Current `useState` works. "Type safety" benefit is marginal solo-dev. The only real bug is one silent catch — fix that inline. |
| Split `outfit-shopmy/route.ts` (283 lines) | Linear request-handling code at 283 lines is fine. Defer until it actively hurts. |
| Line-count targets as success metric | Arbitrary. Real goal is "I can find the search bar in under 10 seconds." |

## Scope kept

- Delete dead code (`page-v1.tsx`, empty `api/test/`, unused `useMemo`)
- Consolidate keyframes into `globals.css` (fix `breatheBar` out-of-scope bug, deduplicate `blink`, reconcile `slowScroll`)
- Rebind shadcn CSS vars to earthy palette + sweep hex → tokens
- Extract logic-carrying components (see Phase 2 list)
- Adopt shadcn `<Button>` and `<Input>` (replaces raw primitives)
- Fix silent drill-down error
- Creator picker `<select>` accessibility
- `next/image` decision for outfit collage

---

## Phase 0 — Regression gate (30 min)

**Kieran's non-negotiable catch:** this refactor touches 1,700 lines with zero existing tests. Ship a tiny smoke test before touching any code.

- [ ] `npm i -D @playwright/test`
- [ ] Config pointing at `http://localhost:3014` (matches project dev-server memory)
- [ ] One test file, three assertions:
  - `/` renders and `<h1>` contains "Never"
  - `/app` renders and the search input exists
  - Type "Los Angeles", click submit, wait for a result card headline to appear
- [ ] `npm run smoke` script: `next build && next start -p 3014 & sleep 3 && playwright test && kill %1`
- [ ] Run once; commit baseline pass

**Success:** one command gates every subsequent phase.

---

## Phase 1 — Cleanup + tokenize (3–4 hours)

Bundled from the reviewers' consensus that phases 1+2+3 are one sitting.

### 1a. Delete dead code
- [ ] `rm src/app/page-v1.tsx`
- [ ] `rmdir src/app/api/test`
- [ ] Remove unused `useMemo` import (`src/app/app/page.tsx:3`)

### 1b. Consolidate keyframes in `globals.css`
- [ ] Move `@keyframes blink` (defined 2× at `app/page.tsx:155,172`)
- [ ] Move `@keyframes breatheBar` (defined `app/page.tsx:1004`, referenced at `551` — out-of-scope bug)
- [ ] Move `@keyframes ticker`, `tickerReverse`, `mockScroll` from `page.tsx:662-682`
- [ ] Reconcile `slowScroll` — `globals.css:143` uses `-100% + 480px`, `page.tsx:671` uses `-100% + 460px`. Keep the 460px value (matches actual mock card `h-[460px]` at `page.tsx:511`).
- [ ] Move `.scrollbar-hide` rules to `globals.css`
- [ ] `rg "<style>" src --type tsx` → expect 0

### 1c. Rebind shadcn CSS vars + tokenize colors

**Decision per Kieran:** collapse the triple indirection. Palette tokens go directly into shadcn's existing `:root` block; `@theme inline` exposes them as utilities. No `--ink` → `--primary` → `--color-primary` chain.

```css
/* src/app/globals.css :root */
--background:           #faf8f4;  /* bone */
--foreground:           #3a3530;  /* ink */
--card:                 #f5f0ea;  /* dune */
--card-foreground:      #3a3530;
--popover:              #ffffff;
--popover-foreground:   #3a3530;
--primary:              #3a3530;  /* ink */
--primary-foreground:   #faf8f4;
--secondary:            #ece6dc;  /* sand */
--secondary-foreground: #3a3530;
--muted:                #ece6dc;
--muted-foreground:     #8a8078;
--accent:               #c4725c;  /* clay */
--accent-foreground:    #faf8f4;
--destructive:          #c06040;
--border:               #e8e0d4;  /* rule */
--input:                #e0d8cc;
--ring:                 #c4725c;

/* Brand-only tokens (not in shadcn semantic space) */
--ink-soft:    #a09080;
--ink-faint:   #b0a490;
--ink-whisper: #c0b4a0;
--clay-warm:   #c09070;
--olive:       #6b7c5e;
--gold:        #d4a860;
--oat:         #c4a882;
--slate:       #8890a0;
--rule-dashed: #d4ccc0;
```

Expose brand tokens in `@theme inline`:

```css
@theme inline {
  --color-ink-soft: var(--ink-soft);
  --color-clay-warm: var(--clay-warm);
  --color-olive: var(--olive);
  /* ... */
}
```

### 1d. Sweep hex → tokens

**Mapping convention per Kieran:** use shadcn semantic utilities (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, etc.) for anything shadcn components also use. Use brand-only utilities (`text-ink-soft`, `text-olive`) for values outside that space.

Explicit mapping:

```
#faf8f4 → bg-background
#3a3530 → text-foreground / bg-primary
#f5f0ea → bg-card
#8a8078 → text-muted-foreground
#ece6dc → bg-muted / bg-secondary
#e8e0d4 → border-border
#e0d8cc → border-input
#c4725c → text-accent / bg-accent / text-primary-accent
#a09080 → text-ink-soft
#b0a490 → text-ink-faint
#c0b4a0 → text-ink-whisper
#c09070 → text-clay-warm
#6b7c5e → text-olive / bg-olive
#d4a860 → border-gold   (morning dot)
#c4a882 → border-oat    (midday dot)
#8890a0 → border-slate  (evening dot)
#d4ccc0 → border-rule-dashed
#ffeee8 → bg-destructive/10
#5a5248 → text-foreground/85  OR  a new --ink-subtle token if it shows up >3x
```

Sweep:
- [ ] `src/app/page.tsx`
- [ ] `src/app/app/page.tsx`
- [ ] `src/app/layout.tsx`, `src/app/not-found.tsx`, `src/app/docs/page.tsx`
- [ ] `src/components/loaders.tsx`
- [ ] `rg "#[0-9a-fA-F]{6}" src/app src/components --type tsx` → expect 0

**Gate:** Phase 0 smoke test green. Manual screenshot diff vs baseline — pixel-identical expected.

---

## Phase 2 — Extract real components + adopt shadcn (4–5 hours)

**Flat `src/components/` directory.** Group only when ≥3 files share a prefix. No `typography/`, no `primitives/`.

### 2a. Type and util extraction (no UI risk, do first)
- [ ] `src/lib/types.ts` — `DayOutfit`, `Moment`, `TodayResult`, `TripDay`, `TripResult`, `CreatorInfo`, `CreatorOutfitItem`, `CreatorOutfit`, `Mode`
- [ ] `src/lib/shop.ts` — `shopUrl()` + a tiny Playwright-agnostic unit test (`src/lib/shop.test.ts`) for edge cases: `"Coat (wool) — navy"`, leading digits, em-dashes
- [ ] `src/lib/proxy.ts` — `proxyImg()`
- [ ] `src/hooks/use-recents.ts` — `useRecents()` with SSR guards

### 2b. Extract components that carry logic/structure

Keep only these:

**Shared layout (server components — no `"use client"`):**
- [ ] `src/components/nav.tsx` — wordmark + API link + Get dressed CTA. Used on `/`, `/app`, `/docs`, `/not-found`. Server component.

**Outfit rendering:**
- [ ] `src/components/moment-block.tsx` — **unifies the 3 variants** (landing mock, DayCard, CreatorCard) via props `{ label, timeRange, temp?, tempSub?, summary, dotColor?, connector?, children }`. Server component.
- [ ] `src/components/day-card.tsx` — client (`useEffect` for outfit-image fetch + share handler)
- [ ] `src/components/creator-card.tsx` — server (no state of its own)
- [ ] `src/components/outfit-collage.tsx` — **decision per Kieran re next/image**: keep raw `<img>` here, proxied via `/api/img`. `next/image` + custom loader is a double-proxy (Vercel pays serverless invocation for every optimization pass). Defer unless image LCP becomes a problem. Server component; add `loading="lazy"`.
- [ ] `src/components/shop-link.tsx`, `src/components/pack-link.tsx` — server

**Search (all client):**
- [ ] `src/components/search-bar.tsx` — pulls the 110-line IIFE (`app/page.tsx:307-416`) out
- [ ] `src/components/mode-toggle.tsx`
- [ ] `src/components/creator-picker.tsx` — **a11y fix here**: replace native `<select>` overlay with shadcn `<Select>` (base-ui-backed, keyboard + aria for free). Label via `<Label htmlFor>`.
- [ ] `src/components/collapsed-summary.tsx`

**Landing (server components):**
- [ ] `src/components/mock-outfit-card.tsx` — **dedup'd**: `<MockOutfitCard variant="classic" | "funky" />` consumes variant config
- [ ] `src/components/mock-packing-list.tsx`
- [ ] `src/components/ticker.tsx`
- [ ] `src/components/rotating-word.tsx` — client (uses `useEffect` interval)
- [ ] `src/components/api-example.tsx`

**Loaders:**
- [ ] `src/components/outfit-loader.tsx` — **unifies** `TodayLoader` + `TripLoader` via `variant` prop driving phrase list
- [ ] `src/components/stylist-voice.tsx`
- [ ] `src/components/breathe-bar.tsx` — used by drill-down loader + outfit-image loader

**Server/client hygiene (Kieran's catch):** landing page itself stays a server component; interactivity lives in extracted client components (`<RotatingWord>`, `<Ticker>` wrappers, etc.). `app/page.tsx` stays client (too much state) but its leaf components go server where possible.

### 2c. Adopt shadcn Button + Input

After Phase 1 rebind, `<Button variant="default">` renders ink-on-bone with no custom variants needed.

- [ ] Add `pill` size variant to `src/components/ui/button.tsx` (`h-9 rounded-full px-5 text-[12px]`)
- [ ] Add `icon-round` size variant (`w-8 h-8 rounded-full`)
- [ ] Replace 10 raw `<button>` in `app/page.tsx`:
  - Edit summary → `variant="secondary" size="sm"`
  - Mode toggle pills → `variant={active ? "default" : "ghost"} size="pill"`
  - Search submit → `size="lg"`
  - Day nav ←/→ → `variant="outline" size="icon-round"` + `aria-label`
  - Day strip chips → `variant={isActive ? "default" : "outline"}`
  - Close drill-down → `variant="ghost" size="sm"`
  - Recent + sample city chips → `variant="outline" size="pill"`
  - Share button → `size="lg"`
- [ ] Replace 5 raw `<input>`:
  - Search input → `<Input>` with rounded-pill className
  - 4× date inputs → `<Input type="date">`
- [ ] Landing page `<Link>` buttons: leave as links (semantically correct). Could adopt `buttonVariants()` styling later if needed.

### 2d. Gut page files

- [ ] `src/app/page.tsx` — compose from extracted components
- [ ] `src/app/app/page.tsx` — compose from extracted components; keep `mode`, `query`, `selectedCreator`, `tripStart/End` as `useState` (the pure inputs); keep the 4 result states as-is (see Phase 3 for the one fix)

**Gate:** Phase 0 smoke test green. All 3 app modes (today, trip, creator) manually verified.

---

## Phase 3 — Polish (2 hours)

### 3a. Fix the silent drill-down error

Per Simplicity's 2-line fix (chosen over Kieran's full nested discriminated union — the union is correct but disproportionate for solo use):

```tsx
// src/app/app/page.tsx fetchDrillDay
} catch (e) {
  setDrillDay(null);
  setError(e instanceof Error ? e.message : "Couldn't load that day");
}
```

Surface in the existing error banner. If error UX becomes a broader need later, revisit.

### 3b. Accessibility pass
- [ ] Creator picker shadcn `<Select>` (done in Phase 2 but verify VoiceOver reads "Styled by, combobox, Anyone")
- [ ] `aria-label` on icon-only day nav
- [ ] Tab through `/` and `/app` — visible focus ring on every target (shadcn provides this via `focus-visible:ring`)
- [ ] Lighthouse a11y ≥ 95 on `/app`

### 3c. Share UX
- [ ] Replace `alert("Copied to clipboard!")` (`app/page.tsx:874`) with an inline ephemeral `<div>` that auto-hides after 2s — no new library. ~15 lines.

### 3d. Nav consolidation
- [ ] Verify `<Nav>` used on `/`, `/app`, `/docs`, `/not-found`
- [ ] `src/app/not-found.tsx` looks right with the nav

**Gate:** Phase 0 smoke test green. Lighthouse a11y ≥ 95. Manual VO pass on creator picker.

---

## Phase 4 — API cleanup (optional, defer)

Only do this phase if `outfit-shopmy/route.ts` actively hurts to work in. Otherwise skip entirely.

- Split prompt construction into `src/app/api/outfit-shopmy/prompt.ts`
- Extract `analyzeMoment` to `src/app/api/_lib/moments.ts` **only if** a 3rd route needs it

No zod. No `withApi` wrapper. No structural changes for the sake of it.

---

## Acceptance criteria

### Functional (unchanged behavior required)
- [ ] `/`, `/app`, `/docs`, `/not-found` render correctly
- [ ] Today mode works for multiple cities
- [ ] Trip mode + drill-down works
- [ ] Creator picker filters by creator
- [ ] Recents persist across reloads
- [ ] Share button copies (or native-shares) without `alert()`
- [ ] **NEW:** drill-down error surfaces to user instead of silently failing

### Structural
- [ ] `rg "#[0-9a-fA-F]{6}" src/app src/components --type tsx` → 0
- [ ] `rg "<button" src/app/app` → 0
- [ ] `rg "<input" src/app/app` → 0
- [ ] `rg "<style>" src --type tsx` → 0
- [ ] `rg "alert\(" src --type tsx` → 0
- [ ] shadcn `<Button>`, `<Input>`, `<Select>` imported in `/app`
- [ ] Playwright smoke test green
- [ ] `next build` clean
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] Lighthouse a11y ≥ 95 on `/app`

### Non-goals (explicitly not measured)
- Specific line counts on page files
- Test coverage beyond the smoke test + `shopUrl` unit test
- API refactor completion
- Component count

## Risks (trimmed)

| Risk | Mitigation |
|---|---|
| Color sweep introduces visual drift on opacity modifiers (`#3a3530/[0.06]`) | Explicit mapping table, preserve opacity modifiers verbatim, screenshot diff per phase |
| Rebinding shadcn `--primary` surfaces latent shadcn component we haven't noticed | Already confirmed 0 current imports; re-grep after each `shadcn add` |
| shadcn Button focus ring shifts tight pill group layout | Audit mode toggle on Phase 2c; add `ring-offset-0` if needed |
| `<select>` → shadcn Select breaks creator filtering | Manually exercise all creators post-swap |
| `@keyframes` rename/move breaks animation | Phase 1b isolated, visually verifiable |

## Effort

~10 hours total. Down from 20.

- Phase 0: 30 min
- Phase 1: 3–4 hr
- Phase 2: 4–5 hr
- Phase 3: 2 hr
- Phase 4: skipped

## References

- Prior code review (`src/app/page.tsx`, `src/app/app/page.tsx`, `src/components/ui/*`)
- Plan review feedback (DHH / Kieran-TS / Simplicity reviewers)
- Project memory: no icons, earthy palette, slow animations, one-card layouts, dev on `next build && next start -p 3014`, never commit without explicit request
- Silent error: `src/app/app/page.tsx:249`
- Dead shadcn: `grep -rn "@/components/ui" src --include="*.tsx"` returns 0
- Disconnected tokens: `src/app/globals.css:51-84`
- Inline keyframes: `src/app/app/page.tsx:155, 172, 1004`; `src/app/page.tsx:662-682`
- Out-of-scope animation bug: `src/app/app/page.tsx:551` references `breatheBar` defined at `1004`
