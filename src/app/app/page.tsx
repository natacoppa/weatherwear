"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CreatorCard } from "@/components/creator-card";
import { DayCard } from "@/components/day-card";
import { Nav } from "@/components/nav";
import { OutfitLoader } from "@/components/outfit-loader";
import { SearchControls } from "@/components/search-controls";
import { useRecents } from "@/hooks/use-recents";
import { useSearchForm, type SearchFormState } from "@/hooks/use-search-form";
import { shopUrl } from "@/lib/shop";
import type { CreatorInfo, CreatorOutfit, TodayResult, TripResult } from "@/lib/types";

const fmt = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

function dayLabel(result: TodayResult) {
  if (result.dayIndex === 0) return "Today";
  if (result.dayIndex === 1) return "Tomorrow";
  return new Date(result.day.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function AppPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { recents, add: addRecent } = useRecents();

  // Fetch results — 4 parallel states; discriminated union deferred per
  // original plan. Race safety comes from AbortController refs below.
  const [todayResult, setTodayResult] = useState<TodayResult | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [drillDay, setDrillDay] = useState<TodayResult | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [creators, setCreators] = useState<CreatorInfo[]>([]);
  const [creatorResult, setCreatorResult] = useState<CreatorOutfit | null>(null);

  useEffect(() => {
    fetch("/api/creators")
      .then((r) => r.json())
      .then(setCreators)
      .catch(() => {});
  }, []);

  // Single AbortController for the primary mode fetch (today/trip/creator).
  // Drill-down has its own controller so it can run in parallel with a
  // trip-view result that's already on screen.
  const primaryCtrl = useRef<AbortController | null>(null);
  const drillCtrl = useRef<AbortController | null>(null);

  // Read the body once; fall back gracefully for non-JSON (502 gateway HTML etc.).
  async function readError(res: Response): Promise<string> {
    try {
      const body = (await res.json()) as { error?: string };
      return body.error || `HTTP ${res.status}`;
    } catch {
      return `HTTP ${res.status}`;
    }
  }
  const isAbort = (e: unknown) => e instanceof DOMException && e.name === "AbortError";

  const fetchToday = useCallback(async (q: string, day: number) => {
    primaryCtrl.current?.abort();
    const ctrl = new AbortController();
    primaryCtrl.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/outfit-day?q=${encodeURIComponent(q)}&day=${day}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(await readError(res));
      const data = (await res.json()) as TodayResult;
      setTodayResult(data);
      setDayIndex(data.dayIndex);
    } catch (e) {
      if (isAbort(e)) return;
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      if (primaryCtrl.current === ctrl) setLoading(false);
    }
  }, []);

  const fetchTrip = useCallback(async (q: string, start: string, end: string) => {
    primaryCtrl.current?.abort();
    drillCtrl.current?.abort();
    const ctrl = new AbortController();
    primaryCtrl.current = ctrl;
    setLoading(true);
    setError(null);
    setDrillDay(null);
    try {
      const res = await fetch(
        `/api/trip?q=${encodeURIComponent(q)}&startDate=${start}&endDate=${end}`,
        { signal: ctrl.signal },
      );
      if (!res.ok) throw new Error(await readError(res));
      setTripResult((await res.json()) as TripResult);
    } catch (e) {
      if (isAbort(e)) return;
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      if (primaryCtrl.current === ctrl) setLoading(false);
    }
  }, []);

  const fetchDrillDay = useCallback(async (q: string, dayIdx: number) => {
    drillCtrl.current?.abort();
    const ctrl = new AbortController();
    drillCtrl.current = ctrl;
    setDrillLoading(true);
    try {
      const res = await fetch(`/api/outfit-day?q=${encodeURIComponent(q)}&day=${dayIdx}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(await readError(res));
      setDrillDay((await res.json()) as TodayResult);
    } catch (e) {
      if (isAbort(e)) return;
      setDrillDay(null);
      setError(e instanceof Error ? e.message : "Couldn't load that day");
    } finally {
      if (drillCtrl.current === ctrl) setDrillLoading(false);
    }
  }, []);

  const fetchCreatorOutfit = useCallback(async (q: string, creator: string) => {
    primaryCtrl.current?.abort();
    const ctrl = new AbortController();
    primaryCtrl.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/outfit-shopmy?q=${encodeURIComponent(q)}&creator=${encodeURIComponent(creator)}`,
        { signal: ctrl.signal },
      );
      if (!res.ok) throw new Error(await readError(res));
      setCreatorResult((await res.json()) as CreatorOutfit);
    } catch (e) {
      if (isAbort(e)) return;
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      if (primaryCtrl.current === ctrl) setLoading(false);
    }
  }, []);

  const { state: formState, handlers: formHandlers } = useSearchForm({
    onSubmit: (s: SearchFormState) => {
      addRecent(s.query);
      if (s.selectedCreator) {
        fetchCreatorOutfit(s.query, s.selectedCreator);
      } else if (s.mode === "today") {
        setDayIndex(0);
        fetchToday(s.query, 0);
      } else if (s.mode === "trip") {
        fetchTrip(s.query, s.tripStart, s.tripEnd);
      }
    },
    onModeChange: () => {
      primaryCtrl.current?.abort();
      drillCtrl.current?.abort();
      setError(null);
      setLoading(false);
      setDrillDay(null);
      setDrillLoading(false);
      setTodayResult(null);
      setTripResult(null);
    },
    onCreatorChange: () => {
      primaryCtrl.current?.abort();
      setCreatorResult(null);
      setError(null);
      setLoading(false);
    },
  });

  const handleDayNav = useCallback(
    (dir: number) => {
      if (!formState.query.trim() || !todayResult) return;
      const next = dayIndex + dir;
      if (next >= 0 && next < todayResult.totalDays) fetchToday(formState.query.trim(), next);
    },
    [dayIndex, fetchToday, formState.query, todayResult],
  );

  const hasResult = todayResult || tripResult || creatorResult;
  const collapsed = !formState.editingSearch && (loading || !!hasResult);
  const resultLocation = todayResult?.location || tripResult?.location || creatorResult?.location;
  const tripDateRange = tripResult
    ? `${fmt(tripResult.days[0].date)} – ${fmt(tripResult.days[tripResult.days.length - 1].date)}`
    : undefined;

  return (
    <main className="flex-1 w-full bg-background">
      <Nav />

      <div className="w-full max-w-[1100px] mx-auto px-5 md:px-10 pt-4 md:pt-8 pb-16">
        <SearchControls
          state={formState}
          handlers={formHandlers}
          meta={{ collapsed, loading, creators, resultLocation, tripDateRange }}
        />

        {error && <div className="rounded-2xl bg-destructive/10 text-destructive text-[13px] p-3 mb-4">{error}</div>}
        {loading && <OutfitLoader variant={formState.mode} />}

        {/* ═══════════ TODAY ═══════════ */}
        {formState.mode === "today" && todayResult && !loading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleDayNav(-1)}
                disabled={dayIndex <= 0}
                aria-label="Previous day"
                className="w-8 h-8 rounded-full bg-popover border border-input text-foreground text-[13px] flex items-center justify-center disabled:opacity-20 hover:border-clay transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ←
              </button>
              <p className="text-[14px] text-foreground font-medium">{dayLabel(todayResult)}</p>
              <button
                onClick={() => handleDayNav(1)}
                disabled={dayIndex >= todayResult.totalDays - 1}
                aria-label="Next day"
                className="w-8 h-8 rounded-full bg-popover border border-input text-foreground text-[13px] flex items-center justify-center disabled:opacity-20 hover:border-clay transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                →
              </button>
            </div>
            <DayCard result={todayResult} />
          </div>
        )}

        {/* ═══════════ TRIP ═══════════ */}
        {formState.mode === "trip" && tripResult && !loading && (
          <div>
            {/* Header */}
            <div className="mb-8 md:mb-10">
              <p className="text-[11px] uppercase tracking-[0.22em] text-ink-soft mb-3">Packing for</p>
              <div className="flex items-end justify-between gap-6 flex-wrap">
                <div>
                  <h2 className="font-[var(--font-serif)] text-[40px] md:text-[56px] text-foreground leading-[1.0] tracking-[-0.02em]">
                    {tripResult.location.split(",")[0]}
                  </h2>
                  {tripResult.location.split(",").slice(1).join(",").trim() && (
                    <p className="text-[14px] text-ink-soft mt-2">
                      {tripResult.location.split(",").slice(1).join(",").trim()}
                    </p>
                  )}
                </div>
                <div className="flex gap-8 md:gap-10">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">Dates</p>
                    <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">
                      {fmt(tripResult.days[0].date)} – {fmt(tripResult.days[tripResult.days.length - 1].date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">Days</p>
                    <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">
                      {tripResult.days.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">Temps</p>
                    <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">
                      {tripResult.days[0].tempRange}
                    </p>
                  </div>
                  {tripResult.days.some((d) => d.precipChance > 30) && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">Rain</p>
                      <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">
                        {Math.max(...tripResult.days.map((d) => d.precipChance))}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {tripResult.isHistorical && (
                <p className="text-[11px] text-ink-faint italic mt-4">Based on typical conditions for these dates</p>
              )}
            </div>

            <div className="border-t border-border" />

            {/* Day strip */}
            <div className="py-6 md:py-7">
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink-soft mb-3">Day by day</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {tripResult.days.map((day, i) => {
                  const isActive = drillDay?.day.date === day.date;
                  return (
                    <button
                      key={day.date}
                      onClick={() => {
                        setDrillDay(null);
                        fetchDrillDay(formState.query, i);
                      }}
                      className={`flex flex-col items-center py-2.5 px-4 rounded-2xl border shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isActive
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-popover border-input text-foreground hover:border-clay"
                      }`}
                    >
                      <span className={`text-[10px] uppercase tracking-[0.18em] ${isActive ? "text-primary-foreground/70" : "text-ink-soft"}`}>
                        {day.dayName.slice(0, 3)}
                      </span>
                      <span
                        className={`font-[var(--font-serif)] text-[18px] leading-none mt-1 ${isActive ? "text-primary-foreground" : "text-foreground"}`}
                      >
                        {day.tempRange}
                      </span>
                      {day.precipChance > 30 && (
                        <span className={`text-[10px] mt-0.5 ${isActive ? "text-primary-foreground/70" : "text-clay-warm"}`}>
                          {day.precipChance}% rain
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Headline + summary */}
            <div className="py-6 md:py-8 grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8 md:gap-12">
              <h3 className="font-[var(--font-serif)] text-[26px] md:text-[34px] text-foreground leading-[1.15] tracking-[-0.01em]">
                {tripResult.packingList.headline}
              </h3>
              <p className="text-[15px] text-muted-foreground leading-relaxed md:pt-2">
                {tripResult.packingList.weatherSummary}
              </p>
            </div>

            <div className="border-t border-border" />

            {/* Packing categories */}
            <div className="py-6 md:py-8">
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink-soft mb-6">The list</p>
              <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                {tripResult.packingList.categories.map((cat) => (
                  <div key={cat.name}>
                    <h4 className="font-[var(--font-serif)] text-[20px] text-foreground mb-3">{cat.name}</h4>
                    <div className="space-y-1.5">
                      {cat.items.map((item, j) => (
                        <a
                          key={j}
                          href={shopUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[13px] text-ink-subtle leading-relaxed underline decoration-rule-dashed underline-offset-2 hover:decoration-olive transition-colors"
                        >
                          {item} <span className="text-[10px] text-ink-whisper no-underline">↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skip list + pro tip */}
            {(tripResult.packingList.skipList.length > 0 || tripResult.packingList.proTip) && (
              <>
                <div className="border-t border-border" />
                <div className="py-6 md:py-8 grid md:grid-cols-2 gap-8 md:gap-12">
                  {tripResult.packingList.skipList.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-clay-warm mb-3">Leave at home</p>
                      <div className="space-y-1">
                        {tripResult.packingList.skipList.map((s, j) => (
                          <p key={j} className="text-[14px] text-muted-foreground leading-relaxed">
                            {s}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {tripResult.packingList.proTip && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-olive mb-3">Pro tip</p>
                      <p className="text-[14px] text-foreground leading-relaxed italic">{tripResult.packingList.proTip}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Drill-down */}
            {drillLoading && (
              <>
                <div className="border-t border-border" />
                <div className="flex flex-col items-center gap-4 py-12">
                  <div className="w-full max-w-[200px] h-1.5 rounded-full overflow-hidden bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, var(--oat-light), var(--olive), var(--oat-light))",
                        backgroundSize: "300% 100%",
                        animation: "breatheBar 6s ease-in-out infinite",
                      }}
                    />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-ink-whisper">Reading the day</p>
                </div>
              </>
            )}

            {drillDay && !drillLoading && (
              <>
                <div className="border-t border-border" />
                <div className="pt-8 md:pt-10 pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-ink-soft">
                      {dayLabel(drillDay)} — full outfit
                    </p>
                    <button
                      onClick={() => setDrillDay(null)}
                      className="text-[12px] text-ink-faint hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      Close
                    </button>
                  </div>
                  <DayCard result={drillDay} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════ CREATOR RESULT ═══════════ */}
        {formState.selectedCreator && creatorResult && !loading && <CreatorCard result={creatorResult} />}

        {/* Empty + recents */}
        {!loading && !error && !todayResult && !tripResult && !creatorResult && (
          <div className="mt-12 md:mt-20 max-w-[640px] mx-auto">
            {recents.length > 0 && (
              <div className="mb-8 text-center">
                <p className="text-[11px] uppercase tracking-[0.18em] text-ink-faint mb-3">Recent</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {recents.map((r) => (
                    <button
                      key={r}
                      onClick={() => formHandlers.submitWith(r)}
                      className="text-[13px] text-foreground bg-popover border border-input hover:border-clay px-4 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="text-center pt-4">
              <p className="font-[var(--font-serif)] text-[32px] md:text-[44px] text-foreground leading-tight tracking-[-0.02em] mb-3">
                {formState.mode === "today" ? "Dress for the day." : "Where to?"}
              </p>
              <p className="text-[15px] text-ink-faint mb-8 max-w-[420px] mx-auto leading-relaxed">
                {formState.mode === "today"
                  ? "Enter a city and we'll read the forecast."
                  : "Enter a destination and we'll pack your bag."}
                {formState.selectedCreator && (
                  <span> Styled with {creators.find((c) => c.username === formState.selectedCreator)?.name}&apos;s pieces.</span>
                )}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Los Angeles", "New York", "London", "Tokyo", "Paris"].map((city) => (
                  <button
                    key={city}
                    onClick={() => formHandlers.submitWith(city)}
                    className="text-[13px] text-foreground bg-popover border border-input hover:border-clay px-4 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
