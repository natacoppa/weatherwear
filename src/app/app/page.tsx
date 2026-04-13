"use client";

import { useState, useCallback, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────────

interface DayOutfit {
  headline: string;
  walkOut: { summary: string; top: string; layer: string | null; bottom: string; shoes: string; accessories: string[] };
  carry: { summary: string; add: string[]; remove: string[]; note: string };
  evening: { summary: string; add: string[]; note: string };
  bagEssentials: string[];
}

interface Moment {
  label: string; timeRange: string; temp: number; sunFeel: number; shadeFeel: number; windSpeed: number; uvIndex: number; precipChance: number;
}

interface TodayResult {
  location: string;
  day: { date: string; tempMax: number; tempMin: number; uvIndexMax: number; precipitationProbability: number };
  dayIndex: number;
  totalDays: number;
  moments: Moment[];
  outfit: DayOutfit;
}

interface TripDay {
  dayName: string; date: string; tempRange: string; precipChance: number;
}

interface TripResult {
  location: string;
  isHistorical?: boolean;
  days: TripDay[];
  packingList: { headline: string; weatherSummary: string; categories: { name: string; items: string[] }[]; skipList: string[]; proTip: string };
}

interface CreatorInfo {
  username: string;
  name: string;
  image: string | null;
  productCount: number;
  topBrands: string[];
}

interface CreatorOutfitItem {
  index: number;
  title: string;
  image: string;
  url: string | null;
  price: number | null;
  brand: string;
}

interface CreatorOutfit {
  location: string;
  creator: string;
  catalogSize: number;
  day: { date: string; tempMax: number; tempMin: number; uvIndexMax: number; precipitationProbability: number };
  moments: Moment[];
  outfit: {
    headline: string;
    walkOut: {
      summary: string;
      top: CreatorOutfitItem | null;
      layer: CreatorOutfitItem | null;
      bottom: CreatorOutfitItem | null;
      shoes: CreatorOutfitItem | null;
      accessories: CreatorOutfitItem[];
    };
    carry: { summary: string; add: string[]; remove: string[]; note: string };
    evening: { summary: string; add: string[]; note: string };
    bagEssentials: string[];
  };
}

type Mode = "today" | "trip";

// ── Utils ────────────────────────────────────────────────────────────

function shopUrl(text: string) {
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(text.replace(/^\d+\s*/g, "").replace(/\s*—.*$/, "").replace(/\s*\(.*?\)\s*/g, "").trim())}`;
}

function ShopLink({ text }: { text: string }) {
  return (
    <a href={shopUrl(text)} target="_blank" rel="noopener noreferrer"
      className="text-[14px] text-foreground leading-snug hover:text-clay transition-colors">
      {text} <span className="text-[10px] text-ink-whisper">↗</span>
    </a>
  );
}

function PackLink({ text }: { text: string }) {
  return (
    <a href={shopUrl(text)} target="_blank" rel="noopener noreferrer"
      className="block text-[13px] text-ink-subtle leading-relaxed underline decoration-rule-dashed underline-offset-2 hover:decoration-olive transition-colors">
      {text} <span className="text-[10px] text-ink-whisper no-underline">↗</span>
    </a>
  );
}

function Scallop() {
  return (
    <div className="w-full h-3 overflow-hidden" style={{
      backgroundImage: "radial-gradient(circle at 6px 6px, var(--background) 5.5px, transparent 6px)",
      backgroundSize: "10px 12px",
      backgroundRepeat: "repeat-x",
      backgroundPosition: "center",
    }} />
  );
}

function StylistVoice({ phrases }: { phrases: string[] }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const current = phrases[phraseIdx];
    if (charIdx < current.length) {
      // Type next character
      const t = setTimeout(() => setCharIdx((c) => c + 1), 35 + Math.random() * 30);
      return () => clearTimeout(t);
    }
    // At end of phrase — pause then advance
    const t = setTimeout(() => {
      setCharIdx(0);
      setPhraseIdx((i) => (i + 1) % phrases.length);
    }, 1600);
    return () => clearTimeout(t);
  }, [charIdx, phraseIdx, phrases]);

  const current = phrases[phraseIdx];
  return (
    <p className="font-[var(--font-serif)] text-[18px] md:text-[22px] text-foreground italic leading-[1.4] text-center min-h-[3em]">
      {current.slice(0, charIdx)}
      <span className="inline-block w-[2px] h-[0.9em] bg-clay ml-1 -mb-[0.1em] animate-[blink_1s_steps(2)_infinite]" />
    </p>
  );
}

function TodayLoader() {
  return (
    <div className="flex flex-col items-center gap-6 py-16 md:py-24 max-w-[560px] mx-auto px-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-ink-whisper">Reading your day</p>
      <StylistVoice phrases={[
        "Pulling the hourly forecast…",
        "It's cool now, warmer by noon, breezy after sunset…",
        "Reaching for something soft, tonal, layered…",
        "Pairing wool with denim, cream with charcoal…",
        "Adding a piece you can shed, then put back on…",
        "Almost dressed.",
      ]} />
    </div>
  );
}

function TripLoader() {
  return (
    <div className="flex flex-col items-center gap-6 py-16 md:py-24 max-w-[560px] mx-auto px-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-ink-whisper">Building your list</p>
      <StylistVoice phrases={[
        "Reading the week ahead…",
        "Mostly mild, with a Tuesday rain spell…",
        "Layering for shoulder-season weather…",
        "Choosing pieces that mix and travel well…",
        "Editing for one consolidated bag…",
        "Almost packed.",
      ]} />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

function getRecents(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("ww_recents") || "[]"); } catch { return []; }
}

function saveRecent(city: string) {
  const recents = getRecents().filter((r) => r.toLowerCase() !== city.toLowerCase());
  recents.unshift(city);
  localStorage.setItem("ww_recents", JSON.stringify(recents.slice(0, 5)));
}

export default function AppPage() {
  const [mode, setMode] = useState<Mode>("today");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingSearch, setEditingSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recents, setRecents] = useState<string[]>([]);

  // Today
  const [todayResult, setTodayResult] = useState<TodayResult | null>(null);
  const [dayIndex, setDayIndex] = useState(0);

  // Trip
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [tripStart, setTripStart] = useState(() => new Date().toISOString().split("T")[0]);
  const [tripEnd, setTripEnd] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split("T")[0]; });

  // Trip → day drill-down
  const [drillDay, setDrillDay] = useState<TodayResult | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);

  // Creator
  const [creators, setCreators] = useState<CreatorInfo[]>([]);
  const [selectedCreator, setSelectedCreator] = useState("");
  const [creatorResult, setCreatorResult] = useState<CreatorOutfit | null>(null);

  // Load recents + creators on mount
  useEffect(() => {
    setRecents(getRecents());
    fetch("/api/creators").then((r) => r.json()).then(setCreators).catch(() => {});
  }, []);

  const fetchToday = useCallback(async (q: string, day: number) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/outfit-day?q=${encodeURIComponent(q)}&day=${day}`);
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setTodayResult(data); setDayIndex(data.dayIndex);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, []);

  const fetchTrip = useCallback(async (q: string) => {
    setLoading(true); setError(null); setDrillDay(null);
    try {
      const res = await fetch(`/api/trip?q=${encodeURIComponent(q)}&startDate=${tripStart}&endDate=${tripEnd}`);
      if (!res.ok) throw new Error((await res.json()).error);
      setTripResult(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, [tripStart, tripEnd]);

  const fetchDrillDay = useCallback(async (q: string, dayIdx: number) => {
    setDrillLoading(true);
    try {
      const res = await fetch(`/api/outfit-day?q=${encodeURIComponent(q)}&day=${dayIdx}`);
      if (!res.ok) throw new Error((await res.json()).error);
      setDrillDay(await res.json());
    } catch { /* silently fail drill-down */ }
    finally { setDrillLoading(false); }
  }, []);

  const fetchCreatorOutfit = useCallback(async (q: string, creator: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/outfit-shopmy?q=${encodeURIComponent(q)}&creator=${encodeURIComponent(creator)}`);
      if (!res.ok) throw new Error((await res.json()).error);
      setCreatorResult(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, []);

  const doSearch = (q: string) => {
    saveRecent(q);
    setRecents(getRecents());
    if (selectedCreator) {
      fetchCreatorOutfit(q, selectedCreator);
    } else if (mode === "today") {
      setDayIndex(0); fetchToday(q, 0);
    } else if (mode === "trip") {
      fetchTrip(q);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    doSearch(query.trim());
  };

  const handleDayNav = (dir: number) => {
    if (!query.trim()) return;
    const next = dayIndex + dir;
    if (todayResult && next >= 0 && next < todayResult.totalDays) fetchToday(query.trim(), next);
  };

  const dayLabel = (result: TodayResult) => {
    if (result.dayIndex === 0) return "Today";
    if (result.dayIndex === 1) return "Tomorrow";
    return new Date(result.day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <main className="flex-1 w-full bg-background">
      {/* Nav — matches landing page */}
      <nav className="w-full max-w-[1200px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
        <a href="/" className="font-[var(--font-serif)] text-[20px] md:text-[22px] text-foreground tracking-[-0.01em]">Well Suited</a>
        <div className="flex items-center gap-6">
          <a href="/docs" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">API</a>
        </div>
      </nav>

      <div className="w-full max-w-[1100px] mx-auto px-5 md:px-10 pt-4 md:pt-8 pb-16">

        {(() => {
          const hasResult = todayResult || tripResult || creatorResult;
          const showCollapsed = !editingSearch && (loading || hasResult);
          const selectedCreatorName = creators.find((c) => c.username === selectedCreator)?.name;

          if (showCollapsed) {
            /* ─── Collapsed summary bar ─── */
            return (
              <div className="mb-6 md:mb-10 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-2 flex-wrap text-[14px] text-foreground">
                  <span className="font-medium">{query || (todayResult?.location || tripResult?.location || creatorResult?.location || "").split(",")[0]}</span>
                  {mode === "trip" && tripResult && (
                    <>
                      <span className="text-rule-dashed">·</span>
                      <span className="text-muted-foreground">{fmt(tripResult.days[0].date)} – {fmt(tripResult.days[tripResult.days.length - 1].date)}</span>
                    </>
                  )}
                  <span className="text-rule-dashed">·</span>
                  <span className="text-muted-foreground">
                    {mode === "today" ? "Today" : "Trip"}
                    {selectedCreatorName && <span> · styled by {selectedCreatorName}</span>}
                  </span>
                </div>
                <button onClick={() => setEditingSearch(true)}
                  className="text-[13px] text-foreground bg-primary/[0.06] hover:bg-primary/[0.1] px-4 py-1.5 rounded-full transition-colors">
                  Edit
                </button>
              </div>
            );
          }

          /* ─── Full search controls ─── */
          return (
            <>
              {/* Mode toggle + Style by — compact row */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex gap-1 p-1 rounded-full bg-muted w-fit">
                  {(["today", "trip"] as Mode[]).map((m) => (
                    <button key={m} onClick={() => { setMode(m); setDrillDay(null); }}
                      className={`px-5 py-1.5 rounded-full text-[12px] font-medium transition-all ${mode === m ? "bg-primary text-primary-foreground shadow-sm" : "text-ink-soft hover:text-ink-subtle"}`}
                    >{m === "today" ? "Today" : "Trip"}</button>
                  ))}
                </div>

                {/* Style by — matching pill */}
                <div className="relative inline-flex items-center">
                  <div className={`flex items-center gap-1.5 h-9 px-4 rounded-full pointer-events-none transition-colors ${
                    selectedCreator ? "bg-primary text-white" : "bg-muted text-foreground"
                  }`}>
                    <span className="text-[12px] font-medium">
                      {selectedCreatorName ? `Styled by ${selectedCreatorName}` : "Styled by anyone"}
                    </span>
                    <span className={`text-[10px] ${selectedCreator ? "text-white/60" : "text-ink-soft"}`}>▾</span>
                  </div>
                  <select
                    value={selectedCreator}
                    onChange={(e) => setSelectedCreator(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  >
                    <option value="">Anyone</option>
                    {creators.map((c) => (
                      <option key={c.username} value={c.username}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search */}
              <form onSubmit={(e) => { handleSearch(e); if (query.trim()) setEditingSearch(false); }} className="mb-3">
                <div className="flex items-center gap-2">
                  <input type="text" placeholder={selectedCreator ? `City to style with ${selectedCreatorName || ""}...` : mode === "today" ? "Enter a city..." : "Where are you going?"}
                    value={query} onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 min-w-0 h-12 px-5 rounded-full bg-white border border-input text-[15px] text-foreground placeholder:text-ink-whisper outline-none focus:border-clay transition-colors"
                  />
                  {mode === "trip" && (
                    <div className="hidden md:flex items-center gap-1 h-12 px-4 rounded-full bg-white border border-input text-[13px] text-foreground">
                      <input type="date" value={tripStart}
                        onChange={(e) => { setTripStart(e.target.value); if (e.target.value > tripEnd) setTripEnd(e.target.value); }}
                        min={new Date().toISOString().split("T")[0]}
                        className="bg-transparent outline-none border-0 text-[13px] text-foreground cursor-pointer" />
                      <span className="text-rule-dashed">—</span>
                      <input type="date" value={tripEnd}
                        onChange={(e) => setTripEnd(e.target.value)} min={tripStart}
                        className="bg-transparent outline-none border-0 text-[13px] text-foreground cursor-pointer" />
                    </div>
                  )}
                  <button type="submit" disabled={loading || !query.trim()}
                    className="h-12 px-6 rounded-full bg-primary text-white text-[14px] font-medium disabled:opacity-30 hover:bg-primary-hover transition-colors shrink-0"
                  >{mode === "today" ? "Go" : "Pack"}</button>
                </div>
              </form>

              {/* Trip dates — mobile only (stacked below search) */}
              {mode === "trip" && (
                <div className="md:hidden flex items-center gap-2 mb-3 px-1">
                  <input type="date" value={tripStart}
                    onChange={(e) => { setTripStart(e.target.value); if (e.target.value > tripEnd) setTripEnd(e.target.value); }}
                    min={new Date().toISOString().split("T")[0]}
                    className="flex-1 min-w-0 h-10 px-3 rounded-full bg-white border border-input text-[13px] text-foreground outline-none" />
                  <span className="text-rule-dashed text-[13px]">—</span>
                  <input type="date" value={tripEnd}
                    onChange={(e) => setTripEnd(e.target.value)} min={tripStart}
                    className="flex-1 min-w-0 h-10 px-3 rounded-full bg-white border border-input text-[13px] text-foreground outline-none" />
                </div>
              )}

              <div className="mb-4" />
            </>
          );
        })()}

      {error && <div className="rounded-2xl bg-destructive/10 text-destructive text-[13px] p-3 mb-4">{error}</div>}
      {loading && (mode === "today" ? <TodayLoader /> : <TripLoader />)}

      {/* ═══════════ TODAY MODE ═══════════ */}
      {mode === "today" && todayResult && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={() => handleDayNav(-1)} disabled={dayIndex <= 0}
              className="w-8 h-8 rounded-full bg-white border border-input text-foreground text-[13px] flex items-center justify-center disabled:opacity-20 hover:border-clay transition-colors">←</button>
            <p className="text-[14px] text-foreground font-medium">{dayLabel(todayResult)}</p>
            <button onClick={() => handleDayNav(1)} disabled={dayIndex >= todayResult.totalDays - 1}
              className="w-8 h-8 rounded-full bg-white border border-input text-foreground text-[13px] flex items-center justify-center disabled:opacity-20 hover:border-clay transition-colors">→</button>
          </div>
          <DayCard result={todayResult} />
        </div>
      )}

      {/* ═══════════ TRIP MODE ═══════════ */}
      {mode === "trip" && tripResult && !loading && (
        <div>
          {/* Header */}
          <div className="mb-8 md:mb-10">
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink-soft mb-3">Packing for</p>
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <h2 className="font-[var(--font-serif)] text-[40px] md:text-[56px] text-foreground leading-[1.0] tracking-[-0.02em]">{tripResult.location.split(",")[0]}</h2>
                {tripResult.location.split(",").slice(1).join(",").trim() && (
                  <p className="text-[14px] text-ink-soft mt-2">{tripResult.location.split(",").slice(1).join(",").trim()}</p>
                )}
              </div>
              <div className="flex gap-8 md:gap-10">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">Dates</p>
                  <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">{fmt(tripResult.days[0].date)} – {fmt(tripResult.days[tripResult.days.length - 1].date)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">Days</p>
                  <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">{tripResult.days.length}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">Temps</p>
                  <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">{tripResult.days[0].tempRange}</p>
                </div>
                {tripResult.days.some((d) => d.precipChance > 30) && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">Rain</p>
                    <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">{Math.max(...tripResult.days.map((d) => d.precipChance))}%</p>
                  </div>
                )}
              </div>
            </div>
            {tripResult.isHistorical && <p className="text-[11px] text-ink-faint italic mt-4">Based on typical conditions for these dates</p>}
          </div>

          <div className="border-t border-border" />

          {/* Day strip */}
          <div className="py-6 md:py-7">
            <p className="text-[10px] uppercase tracking-[0.22em] text-ink-soft mb-3">Day by day</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {tripResult.days.map((day, i) => {
                const isActive = drillDay?.day.date === day.date;
                return (
                  <button key={day.date}
                    onClick={() => { setDrillDay(null); fetchDrillDay(query, i); }}
                    className={`flex flex-col items-center py-2.5 px-4 rounded-2xl border shrink-0 transition-all ${
                      isActive ? "bg-primary border-primary text-white" : "bg-white border-input text-foreground hover:border-clay"
                    }`}>
                    <span className={`text-[10px] uppercase tracking-[0.18em] ${isActive ? "text-white/70" : "text-ink-soft"}`}>{day.dayName.slice(0, 3)}</span>
                    <span className={`font-[var(--font-serif)] text-[18px] leading-none mt-1 ${isActive ? "text-white" : "text-foreground"}`}>{day.tempRange}</span>
                    {day.precipChance > 30 && <span className={`text-[10px] mt-0.5 ${isActive ? "text-white/70" : "text-clay-warm"}`}>{day.precipChance}% rain</span>}
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
            <p className="text-[15px] text-muted-foreground leading-relaxed md:pt-2">{tripResult.packingList.weatherSummary}</p>
          </div>

          <div className="border-t border-border" />

          {/* Packing categories — 2-column grid on desktop */}
          <div className="py-6 md:py-8">
            <p className="text-[10px] uppercase tracking-[0.22em] text-ink-soft mb-6">The list</p>
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {tripResult.packingList.categories.map((cat) => (
                <div key={cat.name}>
                  <h4 className="font-[var(--font-serif)] text-[20px] text-foreground mb-3">{cat.name}</h4>
                  <div className="space-y-1.5">
                    {cat.items.map((item, j) => <PackLink key={j} text={item} />)}
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
                      {tripResult.packingList.skipList.map((s, j) => <p key={j} className="text-[14px] text-muted-foreground leading-relaxed">{s}</p>)}
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
                  <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, var(--oat-light), var(--olive), var(--oat-light))", backgroundSize: "300% 100%", animation: "breatheBar 6s ease-in-out infinite" }} />
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
                  <p className="text-[11px] uppercase tracking-[0.22em] text-ink-soft">{dayLabel(drillDay)} — full outfit</p>
                  <button onClick={() => setDrillDay(null)} className="text-[12px] text-ink-faint hover:text-foreground">Close</button>
                </div>
                <DayCard result={drillDay} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════ CREATOR-FILTERED RESULT ═══════════ */}
      {selectedCreator && creatorResult && !loading && (
        <CreatorCard result={creatorResult} />
      )}

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
                    onClick={() => { setQuery(r); doSearch(r); }}
                    className="text-[13px] text-foreground bg-white border border-input hover:border-clay px-4 py-2 rounded-full transition-colors"
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
              {mode === "today" ? "Enter a city and we'll read the forecast." : "Enter a destination and we'll pack your bag."}
              {selectedCreator && <span> Styled with {creators.find((c) => c.username === selectedCreator)?.name}'s pieces.</span>}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Los Angeles", "New York", "London", "Tokyo", "Paris"].map((city) => (
                <button key={city} onClick={() => { setQuery(city); doSearch(city); }}
                  className="text-[13px] text-foreground bg-white border border-input hover:border-clay px-4 py-2 rounded-full transition-colors">
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

// ── Shared Day Card ──────────────────────────────────────────────────

// ── Creator Outfit Card ──────────────────────────────────────────────

function proxyImg(url: string) {
  return `/api/img?url=${encodeURIComponent(url)}`;
}

function CreatorProductLink({ item, label }: { item: CreatorOutfitItem | null; label: string }) {
  if (!item) return null;
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.15em] text-ink-faint mb-0.5">{label}</p>
      <a href={item.url || "#"} target="_blank" rel="noopener noreferrer"
        className="text-[13px] text-ink-subtle leading-relaxed underline decoration-rule-dashed underline-offset-2 hover:decoration-olive transition-colors">
        {item.title} <span className="text-[11px] text-ink-faint no-underline">— {item.brand}{item.price ? ` $${item.price}` : ""}</span> <span className="text-[10px] text-ink-whisper no-underline">↗</span>
      </a>
    </div>
  );
}

function OutfitCollage({ items }: { items: (CreatorOutfitItem | null)[] }) {
  const valid = items.filter(Boolean) as CreatorOutfitItem[];
  if (valid.length === 0) return null;

  return (
    <div className="relative bg-card rounded-2xl p-4 min-h-[300px]">
      {/* Top row: small accessories + main garment */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex flex-col gap-2 w-[68px] shrink-0 pt-1">
          {valid.slice(4).map((item, i) => (
            <a key={i} href={item.url || "#"} target="_blank" rel="noopener noreferrer" className="block">
              <img src={proxyImg(item.image)} alt={item.title} className="w-[68px] h-[68px] object-contain drop-shadow-sm" />
            </a>
          ))}
        </div>
        <div className="flex-1 flex justify-center">
          {valid[0] && (
            <a href={valid[0].url || "#"} target="_blank" rel="noopener noreferrer" className="block">
              <img src={proxyImg(valid[0].image)} alt={valid[0].title} className="w-[150px] h-[170px] object-contain drop-shadow-sm" />
            </a>
          )}
        </div>
        {valid[1] && (
          <div className="w-[85px] shrink-0 pt-4">
            <a href={valid[1].url || "#"} target="_blank" rel="noopener noreferrer" className="block">
              <img src={proxyImg(valid[1].image)} alt={valid[1].title} className="w-[85px] h-[100px] object-contain drop-shadow-sm" />
            </a>
          </div>
        )}
      </div>
      {/* Bottom row: shoes + bottom */}
      <div className="flex items-end gap-3">
        {valid[3] && (
          <a href={valid[3].url || "#"} target="_blank" rel="noopener noreferrer" className="block shrink-0">
            <img src={proxyImg(valid[3].image)} alt={valid[3].title} className="w-[85px] h-[75px] object-contain drop-shadow-sm" />
          </a>
        )}
        {valid[2] && (
          <div className="flex-1 flex justify-center">
            <a href={valid[2].url || "#"} target="_blank" rel="noopener noreferrer" className="block">
              <img src={proxyImg(valid[2].image)} alt={valid[2].title} className="w-[130px] h-[130px] object-contain drop-shadow-sm" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function CreatorCard({ result }: { result: CreatorOutfit }) {
  const o = result.outfit;

  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-card border border-border overflow-hidden">
        <div className="p-5 pb-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink-soft mb-1">Styled by @{result.creator}</p>
          <p className="text-[10px] text-ink-faint mb-3">{result.location}</p>
          <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-snug">{o.headline}</p>
          {(() => {
            const feelsLow = result.moments.length > 0 ? Math.min(...result.moments.map(m => m.shadeFeel)) : Math.round(result.day.tempMin);
            const feelsHigh = result.moments.length > 0 ? Math.max(...result.moments.map(m => m.sunFeel)) : Math.round(result.day.tempMax);
            return (
              <div className="flex gap-5 mt-4">
                <div><p className="text-[9px] uppercase tracking-[0.15em] text-ink-soft">Feels like</p><p className="text-[13px] font-medium text-foreground">{feelsLow}–{feelsHigh}°</p></div>
                <div><p className="text-[9px] uppercase tracking-[0.15em] text-ink-soft">UV</p><p className="text-[13px] font-medium text-foreground">{result.day.uvIndexMax}</p></div>
                {result.day.precipitationProbability > 20 && <div><p className="text-[9px] uppercase tracking-[0.15em] text-ink-soft">Rain</p><p className="text-[13px] font-medium text-foreground">{result.day.precipitationProbability}%</p></div>}
              </div>
            );
          })()}
        </div>

        <Scallop />

        {/* Walk out — same layout as regular outfit */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative pl-6 pb-5">
            <div className="absolute left-[7px] top-[10px] bottom-0 w-px border-l border-dashed border-rule-dashed" />
            <div className="absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 border-gold bg-card" />
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-olive font-medium">Walk out the door</p>
                <p className="text-[11px] text-ink-faint">{result.moments[0]?.timeRange || "7–9am"}</p>
              </div>
              {result.moments[0] && (
                <div className="text-right">
                  <span className="font-[var(--font-serif)] text-[28px] leading-none text-foreground">{result.moments[0].sunFeel}°</span>
                  <p className="text-[10px] text-ink-faint">{result.moments[0].shadeFeel}° shade</p>
                </div>
              )}
            </div>
            <p className="text-[12px] text-ink-soft italic mb-3">{o.walkOut.summary}</p>
            <div className="space-y-2">
              <CreatorProductLink item={o.walkOut.top} label="Top" />
              {o.walkOut.layer && <CreatorProductLink item={o.walkOut.layer} label="Layer" />}
              <CreatorProductLink item={o.walkOut.bottom} label="Bottom" />
              <CreatorProductLink item={o.walkOut.shoes} label="Shoes" />
            </div>
            {o.walkOut.accessories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {o.walkOut.accessories.map((a, j) => (
                  <a key={j} href={a.url || "#"} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-olive bg-olive/8 px-2 py-0.5 rounded-full hover:bg-olive/15 transition-colors">
                    {a.title} ↗
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Midday */}
          <div className="relative pl-6 pb-5">
            <div className="absolute left-[7px] top-[10px] bottom-0 w-px border-l border-dashed border-rule-dashed" />
            <div className="absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 border-oat bg-card" />
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-olive font-medium">Midday shift</p>
                <p className="text-[11px] text-ink-faint">{result.moments[1]?.timeRange || "11am–3pm"}</p>
              </div>
              {result.moments[1] && (
                <div className="text-right">
                  <span className="font-[var(--font-serif)] text-[28px] leading-none text-foreground">{result.moments[1].sunFeel}°</span>
                  <p className="text-[10px] text-ink-faint">{result.moments[1].shadeFeel}° shade</p>
                </div>
              )}
            </div>
            <p className="text-[12px] text-ink-soft italic mb-3">{o.carry.summary}</p>
            {o.carry.remove.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] uppercase tracking-[0.15em] text-clay-warm mb-1">Take off</p>
                {o.carry.remove.map((item, j) => <p key={j} className="text-[13px] text-ink-subtle">{item}</p>)}
              </div>
            )}
            {o.carry.add.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] uppercase tracking-[0.15em] text-olive mb-1">Put on</p>
                {o.carry.add.map((item, j) => <p key={j} className="text-[13px] text-ink-subtle">{item}</p>)}
              </div>
            )}
            <p className="text-[11px] text-ink-faint">{o.carry.note}</p>
          </div>

          {/* Evening */}
          <div className="relative pl-6 pb-5">
            <div className="absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 border-slate bg-card" />
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-olive font-medium">By evening</p>
                <p className="text-[11px] text-ink-faint">{result.moments[2]?.timeRange || "6–10pm"}</p>
              </div>
              {result.moments[2] && (
                <div className="text-right">
                  <span className="font-[var(--font-serif)] text-[28px] leading-none text-foreground">{result.moments[2].shadeFeel}°</span>
                  {result.moments[2].windSpeed > 5 && <p className="text-[10px] text-ink-faint">wind chill</p>}
                </div>
              )}
            </div>
            <p className="text-[12px] text-ink-soft italic mb-3">{o.evening.summary}</p>
            {o.evening.add.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] uppercase tracking-[0.15em] text-olive mb-1">Put back on</p>
                {o.evening.add.map((item, j) => <p key={j} className="text-[13px] text-ink-subtle">{item}</p>)}
              </div>
            )}
            <p className="text-[11px] text-ink-faint">{o.evening.note}</p>
          </div>
        </div>

        {/* Bag */}
        {o.bagEssentials.length > 0 && (
          <>
            <div className="mx-5 border-t border-dashed border-rule-dashed" />
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-ink-soft mb-2">In your bag</p>
              <div className="flex flex-wrap gap-1.5">
                {o.bagEssentials.map((item, i) => <span key={i} className="text-[11px] text-ink-subtle bg-muted px-2.5 py-1 rounded-full">{item}</span>)}
              </div>
            </div>
          </>
        )}

        {/* Outfit collage — replaces the AI generated image */}
        <div className="mx-5 border-t border-dashed border-rule-dashed" />
        <div className="p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink-soft mb-3">The look</p>
          <OutfitCollage items={[o.walkOut.top, o.walkOut.layer, o.walkOut.bottom, o.walkOut.shoes, ...o.walkOut.accessories]} />
        </div>
      </div>
    </div>
  );
}

// ── Shared Day Card ──────────────────────────────────────────────────

function DayCard({ result }: { result: TodayResult }) {
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    setOutfitImage(null);
    setImageLoading(true);
    fetch("/api/outfit-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outfit: result.outfit,
        location: result.location,
        temp: (result.day.tempMin + result.day.tempMax) / 2,
      }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.image) setOutfitImage(data.image); })
      .catch(() => {})
      .finally(() => setImageLoading(false));
  }, [result.location, result.day.date, result.outfit.headline]);

  const handleShare = async () => {
    const text = `${result.outfit.headline}\n\n` +
      `Walk out: ${result.outfit.walkOut.top}${result.outfit.walkOut.layer ? `, ${result.outfit.walkOut.layer}` : ""}, ${result.outfit.walkOut.bottom}, ${result.outfit.walkOut.shoes}\n\n` +
      `${result.location} — via Well Suited`;
    if (navigator.share) {
      try {
        const shareData: ShareData = { title: "Well Suited", text };
        if (outfitImage) {
          const blob = await fetch(outfitImage).then((r) => r.blob());
          const file = new File([blob], "outfit.png", { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) shareData.files = [file];
        }
        await navigator.share(shareData);
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    }
  };

  return (
    <div className="md:grid md:grid-cols-[1fr_minmax(0,460px)] md:gap-10 lg:gap-14">
      {/* LEFT — text content */}
      <div className="order-2 md:order-1">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-soft mb-3">{result.location}</p>
          <h2 className="font-[var(--font-serif)] text-[32px] md:text-[44px] text-foreground leading-[1.05] tracking-[-0.02em] mb-5">
            {result.outfit.headline}
          </h2>
          <div className="flex gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">Range</p>
              <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">{Math.round(result.day.tempMin)}–{Math.round(result.day.tempMax)}°</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">UV</p>
              <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">{result.day.uvIndexMax}</p>
            </div>
            {result.day.precipitationProbability > 20 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">Rain</p>
                <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">{result.day.precipitationProbability}%</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Morning */}
        <MomentSection
          label="Morning"
          timeRange={result.moments[0]?.timeRange || "7–9am"}
          temp={result.moments[0] ? `${result.moments[0].sunFeel}°` : undefined}
          tempSub={result.moments[0] ? `${result.moments[0].shadeFeel}° in shade` : undefined}
          summary={result.outfit.walkOut.summary}
        >
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <OutfitRow label="Top" text={result.outfit.walkOut.top} />
            {result.outfit.walkOut.layer && <OutfitRow label="Layer" text={result.outfit.walkOut.layer} />}
            <OutfitRow label="Bottom" text={result.outfit.walkOut.bottom} />
            <OutfitRow label="Shoes" text={result.outfit.walkOut.shoes} />
          </div>
          {result.outfit.walkOut.accessories.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-2">Accessories</p>
              <p className="text-[13px] text-ink-subtle">{result.outfit.walkOut.accessories.join(" · ")}</p>
            </div>
          )}
        </MomentSection>

        <div className="border-t border-border" />

        {/* Midday */}
        <MomentSection
          label="Midday"
          timeRange={result.moments[1]?.timeRange || "11am–3pm"}
          temp={result.moments[1] ? `${result.moments[1].sunFeel}°` : undefined}
          tempSub={result.moments[1] ? `${result.moments[1].shadeFeel}° in shade` : undefined}
          summary={result.outfit.carry.summary}
        >
          {result.outfit.carry.remove.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-clay-warm mb-2">Take off</p>
              {result.outfit.carry.remove.map((item, j) => <p key={j} className="text-[14px] text-foreground">{item}</p>)}
            </div>
          )}
          {result.outfit.carry.add.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-olive mb-2">Put on</p>
              {result.outfit.carry.add.map((item, j) => <p key={j} className="text-[14px] text-foreground">{item}</p>)}
            </div>
          )}
          {result.outfit.carry.note && <p className="text-[12px] text-ink-faint italic">{result.outfit.carry.note}</p>}
        </MomentSection>

        <div className="border-t border-border" />

        {/* Evening */}
        <MomentSection
          label="Evening"
          timeRange={result.moments[2]?.timeRange || "6–10pm"}
          temp={result.moments[2] ? `${result.moments[2].shadeFeel}°` : undefined}
          tempSub={result.moments[2]?.windSpeed && result.moments[2].windSpeed > 5 ? "with wind chill" : undefined}
          summary={result.outfit.evening.summary}
        >
          {result.outfit.evening.add.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-olive mb-2">Put back on</p>
              {result.outfit.evening.add.map((item, j) => <p key={j} className="text-[14px] text-foreground">{item}</p>)}
            </div>
          )}
          {result.outfit.evening.note && <p className="text-[12px] text-ink-faint italic">{result.outfit.evening.note}</p>}
        </MomentSection>

        {/* Bag */}
        {result.outfit.bagEssentials.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="py-6">
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink-soft mb-3">In your bag</p>
              <p className="text-[14px] text-foreground">{result.outfit.bagEssentials.join(" · ")}</p>
            </div>
          </>
        )}

        {/* Share */}
        <button
          onClick={handleShare}
          className="w-full md:w-auto md:px-8 py-3.5 rounded-full bg-primary text-white text-[14px] font-medium tracking-wide hover:bg-primary-hover transition-colors mt-2"
        >
          Share this look →
        </button>
      </div>

      {/* RIGHT — outfit image (top on mobile, sticky on desktop) */}
      <div className="order-1 md:order-2 mb-6 md:mb-0">
        <div className="md:sticky md:top-5">
          {imageLoading && (
            <div className="rounded-3xl bg-muted aspect-[3/4] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-full max-w-[120px] h-1.5 rounded-full overflow-hidden bg-input">
                  <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, var(--oat-light), var(--olive), var(--oat-light))", backgroundSize: "300% 100%", animation: "breatheBar 6s ease-in-out infinite" }} />
                </div>
                <p className="text-[10px] text-ink-faint uppercase tracking-[0.2em]">Styling your look</p>
              </div>
            </div>
          )}
          {outfitImage && (
            <img
              src={outfitImage}
              alt="Outfit visualization"
              className="w-full rounded-3xl object-cover aspect-[3/4]"
            />
          )}
          {!imageLoading && !outfitImage && (
            <div className="rounded-3xl bg-muted aspect-[3/4] flex items-center justify-center">
              <p className="text-[11px] text-ink-faint uppercase tracking-[0.2em]">Couldn&apos;t generate image</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MomentSection({ label, timeRange, temp, tempSub, summary, children }: {
  label: string; timeRange: string; temp?: string; tempSub?: string; summary?: string; children: React.ReactNode;
}) {
  return (
    <div className="py-6 md:py-7">
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-4">
          <h3 className="font-[var(--font-serif)] text-[22px] md:text-[26px] text-foreground leading-none">{label}</h3>
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-soft">{timeRange}</p>
        </div>
        {temp && (
          <div className="text-right">
            <span className="font-[var(--font-serif)] text-[32px] md:text-[38px] leading-none text-foreground">{temp}</span>
            {tempSub && <p className="text-[10px] text-ink-faint mt-1">{tempSub}</p>}
          </div>
        )}
      </div>
      {summary && <p className="text-[14px] text-muted-foreground leading-relaxed mb-5 italic">{summary}</p>}
      {children}
    </div>
  );
}

function OutfitRow({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1.5">{label}</p>
      <ShopLink text={text} />
    </div>
  );
}
