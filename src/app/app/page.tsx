"use client";

import { useCallback, useEffect, useState } from "react";

import { CreatorCard } from "@/components/creator-card";
import { DayCard } from "@/components/day-card";
import { Nav } from "@/components/nav";
import { OutfitLoader } from "@/components/outfit-loader";
import { PackLink } from "@/components/pack-link";
import { SearchControls } from "@/components/search-controls";
import { useRecents } from "@/hooks/use-recents";
import type { CreatorInfo, CreatorOutfit, Mode, TodayResult, TripResult } from "@/lib/types";

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
  const [mode, setMode] = useState<Mode>("today");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingSearch, setEditingSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { recents, add: addRecent } = useRecents();

  // Today
  const [todayResult, setTodayResult] = useState<TodayResult | null>(null);
  const [dayIndex, setDayIndex] = useState(0);

  // Trip
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [tripStart, setTripStart] = useState(() => new Date().toISOString().split("T")[0]);
  const [tripEnd, setTripEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });

  // Trip → day drill-down
  const [drillDay, setDrillDay] = useState<TodayResult | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);

  // Creator
  const [creators, setCreators] = useState<CreatorInfo[]>([]);
  const [selectedCreator, setSelectedCreator] = useState("");
  const [creatorResult, setCreatorResult] = useState<CreatorOutfit | null>(null);

  useEffect(() => {
    fetch("/api/creators")
      .then((r) => r.json())
      .then(setCreators)
      .catch(() => {});
  }, []);

  const fetchToday = useCallback(async (q: string, day: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/outfit-day?q=${encodeURIComponent(q)}&day=${day}`);
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setTodayResult(data);
      setDayIndex(data.dayIndex);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrip = useCallback(
    async (q: string) => {
      setLoading(true);
      setError(null);
      setDrillDay(null);
      try {
        const res = await fetch(`/api/trip?q=${encodeURIComponent(q)}&startDate=${tripStart}&endDate=${tripEnd}`);
        if (!res.ok) throw new Error((await res.json()).error);
        setTripResult(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    },
    [tripStart, tripEnd],
  );

  const fetchDrillDay = useCallback(async (q: string, dayIdx: number) => {
    setDrillLoading(true);
    try {
      const res = await fetch(`/api/outfit-day?q=${encodeURIComponent(q)}&day=${dayIdx}`);
      if (!res.ok) throw new Error((await res.json()).error);
      setDrillDay(await res.json());
    } catch (e) {
      // Surface drill-down failures to the user instead of silently swallowing.
      setDrillDay(null);
      setError(e instanceof Error ? e.message : "Couldn't load that day");
    } finally {
      setDrillLoading(false);
    }
  }, []);

  const fetchCreatorOutfit = useCallback(async (q: string, creator: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/outfit-shopmy?q=${encodeURIComponent(q)}&creator=${encodeURIComponent(creator)}`);
      if (!res.ok) throw new Error((await res.json()).error);
      setCreatorResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  const doSearch = (q: string) => {
    addRecent(q);
    if (selectedCreator) {
      fetchCreatorOutfit(q, selectedCreator);
    } else if (mode === "today") {
      setDayIndex(0);
      fetchToday(q, 0);
    } else if (mode === "trip") {
      fetchTrip(q);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    doSearch(query.trim());
    setEditingSearch(false);
  };

  const handleDayNav = (dir: number) => {
    if (!query.trim()) return;
    const next = dayIndex + dir;
    if (todayResult && next >= 0 && next < todayResult.totalDays) fetchToday(query.trim(), next);
  };

  const hasResult = todayResult || tripResult || creatorResult;
  const collapsed = !editingSearch && (loading || !!hasResult);
  const resultLocation = todayResult?.location || tripResult?.location || creatorResult?.location;
  const tripDateRange = tripResult
    ? `${fmt(tripResult.days[0].date)} – ${fmt(tripResult.days[tripResult.days.length - 1].date)}`
    : undefined;

  return (
    <main className="flex-1 w-full bg-background">
      <Nav />

      <div className="w-full max-w-[1100px] mx-auto px-5 md:px-10 pt-4 md:pt-8 pb-16">
        <SearchControls
          collapsed={collapsed}
          mode={mode}
          query={query}
          selectedCreator={selectedCreator}
          creators={creators}
          loading={loading}
          tripStart={tripStart}
          tripEnd={tripEnd}
          resultLocation={resultLocation}
          tripDateRange={tripDateRange}
          onModeChange={(m) => {
            setMode(m);
            setDrillDay(null);
          }}
          onQueryChange={setQuery}
          onCreatorChange={setSelectedCreator}
          onTripStartChange={setTripStart}
          onTripEndChange={setTripEnd}
          onSubmit={handleSearch}
          onEdit={() => setEditingSearch(true)}
        />

        {error && <div className="rounded-2xl bg-destructive/10 text-destructive text-[13px] p-3 mb-4">{error}</div>}
        {loading && <OutfitLoader variant={mode} />}

        {/* ═══════════ TODAY ═══════════ */}
        {mode === "today" && todayResult && !loading && (
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
        {mode === "trip" && tripResult && !loading && (
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
                        fetchDrillDay(query, i);
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
                        <PackLink key={j} text={item} />
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
        {selectedCreator && creatorResult && !loading && <CreatorCard result={creatorResult} />}

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
                      onClick={() => {
                        setQuery(r);
                        doSearch(r);
                      }}
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
                {mode === "today" ? "Dress for the day." : "Where to?"}
              </p>
              <p className="text-[15px] text-ink-faint mb-8 max-w-[420px] mx-auto leading-relaxed">
                {mode === "today"
                  ? "Enter a city and we'll read the forecast."
                  : "Enter a destination and we'll pack your bag."}
                {selectedCreator && (
                  <span> Styled with {creators.find((c) => c.username === selectedCreator)?.name}&apos;s pieces.</span>
                )}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Los Angeles", "New York", "London", "Tokyo", "Paris"].map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setQuery(city);
                      doSearch(city);
                    }}
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
