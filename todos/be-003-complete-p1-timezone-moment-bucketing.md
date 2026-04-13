---
status: complete
priority: p1
issue_id: "be-003"
tags: [backend, correctness, timezone, bug]
dependencies: []
---

# Timezone bug — moment bucketing uses server TZ, not city TZ

## Problem

**Every outfit recommendation for a city outside the server's timezone is computed with wrong hours.**

`src/app/api/outfit-day/route.ts:86-88` and `src/app/api/outfit-shopmy/route.ts:91-93`:

```ts
new Date(h.time).getHours()
```

Open-Meteo returns hourly timestamps in the **city's** local timezone (because `timezone: "auto"` is set) as bare ISO strings like `"2026-04-13T08:00"` — no `Z`, no offset. `new Date(...)` in Node.js parses these as **server local time**. A Tokyo query running on a US-East Vercel server treats 08:00 JST as 08:00 EST → morning hours become evening, the 11am–3pm midday window catches Tokyo's midnight hours, moment arrays collapse to empty.

The null-guard in `analyzeMoment` prevents a crash — the AI just gets nonsense or empty moments and produces a bad outfit.

Related timezone inconsistencies:

- `src/app/api/trip/route.ts:35`: `new Date().toISOString().split("T")[0]` is UTC — disagrees with Open-Meteo's city-local day 0 for users querying near midnight
- `src/lib/weather.ts:fetchHistoricalWeather` — historical archive doesn't reliably return `precipitation_probability`; code defaults to `?? 0`, silently zeroing rain probability for trips >7 days out → 14-day Seattle trip in November shows 0% rain
- `outfit-day/route.ts`: `feelsLike` field on `MomentWeather` is Open-Meteo's `apparent_temperature` (no solar adjustment), while `sunFeel`/`shadeFeel` are the custom calc — same field name, different semantics, not documented

## Findings

Spec-reviewer (CRITICAL #1, #2, IMPORTANT #6, #9):
> `new Date(h.time).getHours()` is parsed using the JavaScript runtime's local timezone (the Vercel server), not the city's timezone. For a Tokyo query running on a US server, the hour buckets will be completely wrong.
> Historical fallback silently zeroes out rain probability for all historical days. A 14-day trip to Seattle in November will show 0% rain.

## Proposed solutions

### Option A — Parse hour directly from string (recommended)
```ts
const hour = parseInt(h.time.split("T")[1].split(":")[0], 10);
```
One-line fix at both callsites. Add a comment explaining why — Open-Meteo `timezone: "auto"` returns bare local timestamps, and this is not obvious from the types.

### Option B — Use Luxon / date-fns-tz
Heavier; pulls in a dep. Overkill for the simple case.

**For historical precipitation**: either fetch from `/v1/forecast` up to horizon then /archive beyond, OR document the zero-probability edge and show a badge like "typical conditions" (already partially done via `isHistorical` flag).

## Acceptance

- [ ] Hour parsing uses bare-string split, not `new Date()`
- [ ] Applied in both outfit-day and outfit-shopmy routes
- [ ] Comment explaining the Open-Meteo assumption
- [ ] Test with a city far from UTC (Tokyo, Honolulu) confirms moments contain correct hour ranges
- [ ] Trip route's UTC `today` baseline reconsidered or documented
- [ ] Historical `precipitation_probability` defaults surfaced to user (not silently 0)

## Files

- `src/app/api/outfit-day/route.ts:86-88` — hour parse
- `src/app/api/outfit-shopmy/route.ts:91-93` — same bug
- `src/app/api/trip/route.ts:35` — UTC `today`
- `src/lib/weather.ts:fetchHistoricalWeather` — precip fallback
- `src/app/api/outfit-day/route.ts:25-54` — `feelsLike` semantics
