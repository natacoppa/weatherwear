---
status: complete
priority: p1
issue_id: "be-006"
tags: [backend, performance, cost, cache]
dependencies: []
---

# Weather + geocode caching — biggest single cost win

## Problem

Every `/api/outfit-*` and `/api/trip` call makes fresh Open-Meteo geocode + hourly forecast requests. No caching layer anywhere. Open-Meteo data is stable for ~10 minutes. Geocode results are effectively permanent.

Result:
- Duplicate work on every repeat visit
- 200–500ms of latency on every request
- Open-Meteo rate limit risk at scale

## Findings

Performance oracle (CRITICAL #2):
> Weather data is stable for ~10-15 minutes. A simple cache keyed on `(lat_rounded, lon_rounded, forecastDays)` with 10-min TTL would eliminate redundant fetches for popular cities. Eliminates ~200-500ms latency per request.
> Geocode results are entirely deterministic. Cache indefinitely.
> **Outfit-day results by (location, day) with 30-min TTL would cut repeat-visitor Claude API calls to zero. This is where you save money.**

## Proposed solutions

### Option A — Three-layer cache (recommended)

1. **Geocode cache**: in-memory `Map` with indefinite TTL keyed on normalized query. Already-loaded cities stay resident. OK to lose on cold start.

2. **Weather cache**: Vercel KV or Upstash with 10-min TTL keyed on `(lat.toFixed(2), lon.toFixed(2), forecastDays)`. Survives cold starts.

3. **Outfit result cache** (the money maker): 30-min TTL keyed on `(location, day, colorDirection-if-random)`. If randomness makes cache-hit rate low, strip it from the key and accept slightly less variety.

### Option B — Just HTTP Cache-Control
Return `Cache-Control: public, s-maxage=600` from each endpoint; let Vercel's edge cache do the work. Simplest. Doesn't help direct API consumers but solves the repeat-page-load case.

Start with B; add A if KV-backed cache is worth the setup.

## Acceptance

- [ ] Geocode result cached across requests within a session
- [ ] Weather data cached with 10-min TTL
- [ ] Outfit-day responses cached OR documented as intentionally fresh
- [ ] Cache-Control headers set on relevant endpoints
- [ ] Measured: repeat-request latency ≤50ms for popular cities

## Files

- `src/lib/weather.ts` — `geocode` + `fetchWeather`
- All `src/app/api/outfit-*/route.ts` — Cache-Control headers
- New: `src/lib/cache.ts` if using Option A
