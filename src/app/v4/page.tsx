"use client";

import { useState, useCallback } from "react";

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

type Mode = "today" | "trip";

// ── Utils ────────────────────────────────────────────────────────────

function shopUrl(text: string) {
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(text.replace(/^\d+\s*/g, "").replace(/\s*—.*$/, "").replace(/\s*\(.*?\)\s*/g, "").trim())}`;
}

function ShopLink({ text }: { text: string }) {
  return (
    <a href={shopUrl(text)} target="_blank" rel="noopener noreferrer"
      className="text-[13px] text-[#5a5248] leading-relaxed underline decoration-[#d4ccc0] underline-offset-2 hover:decoration-[#6b7c5e] transition-colors">
      {text} <span className="text-[10px] text-[#c0b4a0] no-underline">↗</span>
    </a>
  );
}

function PackLink({ text }: { text: string }) {
  return (
    <a href={shopUrl(text)} target="_blank" rel="noopener noreferrer"
      className="block text-[13px] text-[#5a5248] leading-relaxed underline decoration-[#d4ccc0] underline-offset-2 hover:decoration-[#6b7c5e] transition-colors">
      {text} <span className="text-[10px] text-[#c0b4a0] no-underline">↗</span>
    </a>
  );
}

function Scallop() {
  return (
    <div className="w-full h-3 flex items-center justify-center overflow-hidden">
      <div className="flex">{Array.from({ length: 30 }).map((_, i) => <div key={i} className="w-3 h-3 rounded-full bg-[#faf8f4] -mx-[1px]" />)}</div>
    </div>
  );
}

function TodayLoader() {
  return (
    <div className="flex flex-col items-center gap-5 py-20">
      <div className="w-full max-w-[240px] h-2 rounded-full overflow-hidden bg-[#ece6dc]">
        <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #d4b896, #c4a882, #a8b4a0, #6b7c5e, #d4b896)", backgroundSize: "300% 100%", animation: "breatheBar 6s ease-in-out infinite" }} />
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#c0b4a0]">Reading your day</p>
      <style>{`@keyframes breatheBar { 0%, 100% { background-position: 0% 50%; opacity: 0.7; } 50% { background-position: 100% 50%; opacity: 1; } }`}</style>
    </div>
  );
}

function TripLoader() {
  return (
    <div className="flex flex-col items-center gap-5 py-20">
      <div className="flex items-center gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="relative">
            <div className="w-3 h-3 rounded-full border-2 border-[#6b7c5e] bg-[#f5f0ea]" style={{ animation: `dotPulse 4s ease-in-out infinite ${i * 0.6}s` }} />
            {i < 4 && <div className="absolute top-1/2 left-full w-3 h-px border-t border-dashed border-[#d4ccc0]" style={{ transform: "translateY(-50%)" }} />}
          </div>
        ))}
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#c0b4a0]">Building your list</p>
      <style>{`@keyframes dotPulse { 0%, 100% { background-color: #f5f0ea; transform: scale(1); } 50% { background-color: #6b7c5e; transform: scale(1.2); } }`}</style>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

export default function V4Page() {
  const [mode, setMode] = useState<Mode>("today");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (mode === "today") { setDayIndex(0); fetchToday(query.trim(), 0); }
    else fetchTrip(query.trim());
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
    <main className="flex-1 w-full max-w-[420px] mx-auto px-4 pt-10 pb-16 overflow-x-hidden bg-[#faf8f4]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <img src="/logo-1.svg" alt="WeatherWear" className="w-6 h-6" />
        <span className="font-[var(--font-serif)] text-[18px] text-[#3a3530]">WeatherWear</span>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#ece6dc] mb-4 w-fit">
        {(["today", "trip"] as Mode[]).map((m) => (
          <button key={m} onClick={() => { setMode(m); setDrillDay(null); }}
            className={`px-4 py-1.5 rounded-lg text-[12px] font-medium capitalize transition-all ${mode === m ? "bg-white text-[#3a3530] shadow-sm" : "text-[#a09080]"}`}
          >{m === "today" ? "Today" : "Trip"}</button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-1">
        <div className="flex gap-2">
          <input type="text" placeholder={mode === "today" ? "City..." : "Where are you going?"}
            value={query} onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-10 px-3.5 rounded-xl bg-white border border-[#e0d8cc] text-[14px] text-[#3a3530] placeholder:text-[#c0b8a8] outline-none focus:border-[#c4a882]"
          />
          <button type="submit" disabled={loading || !query.trim()}
            className="h-10 px-4 rounded-xl bg-[#6b7c5e] text-white text-[13px] font-medium disabled:opacity-30 shrink-0"
          >{mode === "today" ? "Go" : "Pack"}</button>
        </div>
      </form>

      {/* Trip dates */}
      {mode === "trip" && (
        <div className="flex items-center gap-3 mt-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[11px] text-[#a09080]">From</span>
            <input type="date" value={tripStart}
              onChange={(e) => { setTripStart(e.target.value); if (e.target.value > tripEnd) setTripEnd(e.target.value); }}
              min={new Date().toISOString().split("T")[0]}
              className="flex-1 min-w-0 h-8 px-2 rounded-lg bg-white border border-[#e0d8cc] text-[12px] text-[#3a3530] outline-none" />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[11px] text-[#a09080]">To</span>
            <input type="date" value={tripEnd}
              onChange={(e) => setTripEnd(e.target.value)} min={tripStart}
              className="flex-1 min-w-0 h-8 px-2 rounded-lg bg-white border border-[#e0d8cc] text-[12px] text-[#3a3530] outline-none" />
          </div>
        </div>
      )}

      {mode === "today" && <div className="mb-3" />}

      {error && <div className="rounded-xl bg-[#ffeee8] text-[#c06040] text-[13px] p-3 mb-4">{error}</div>}
      {loading && (mode === "today" ? <TodayLoader /> : <TripLoader />)}

      {/* ═══════════ TODAY MODE ═══════════ */}
      {mode === "today" && todayResult && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-2">
            {dayIndex > 0 && <button onClick={() => handleDayNav(-1)} className="text-[#b0a490] hover:text-[#6b7c5e] text-[13px]">←</button>}
            <p className="text-[13px] text-[#6b7c5e] font-medium">{dayLabel(todayResult)}</p>
            {dayIndex < todayResult.totalDays - 1 && <button onClick={() => handleDayNav(1)} className="text-[#b0a490] hover:text-[#6b7c5e] text-[13px]">→</button>}
          </div>
          <DayCard result={todayResult} />
        </div>
      )}

      {/* ═══════════ TRIP MODE ═══════════ */}
      {mode === "trip" && tripResult && !loading && (
        <div className="space-y-3">
          {/* Packing list card */}
          <div className="rounded-3xl bg-[#f5f0ea] border border-[#e8e0d4] overflow-hidden">
            <div className="p-5 pb-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#a09080] mb-1">Packing for</p>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-[var(--font-serif)] text-[28px] text-[#3a3530] leading-tight">{tripResult.location.split(",")[0]}</h2>
                  <p className="text-[12px] text-[#a09080] mt-0.5">{tripResult.location.split(",").slice(1).join(",").trim()}</p>
                </div>
                <span className="text-[11px] text-[#6b7c5e] bg-[#6b7c5e]/10 px-2.5 py-1 rounded-full font-medium shrink-0">{tripResult.days.length} days</span>
              </div>
              <div className="flex gap-6 mt-4">
                <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#a09080]">Dates</p><p className="text-[13px] font-medium text-[#3a3530] mt-0.5">{fmt(tripResult.days[0].date)} – {fmt(tripResult.days[tripResult.days.length - 1].date)}</p></div>
                <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#a09080]">Temps</p><p className="text-[13px] font-medium text-[#3a3530] mt-0.5">{tripResult.days[0].tempRange}</p></div>
                {tripResult.days.some((d) => d.precipChance > 30) && (
                  <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#a09080]">Rain</p><p className="text-[13px] font-medium text-[#3a3530] mt-0.5">{Math.max(...tripResult.days.map((d) => d.precipChance))}%</p></div>
                )}
              </div>
              {tripResult.isHistorical && <p className="text-[10px] text-[#b0a090] italic mt-2">Based on typical conditions for these dates</p>}
            </div>

            <Scallop />

            <div className="px-5 pt-3 pb-4">
              <p className="font-[var(--font-serif)] text-[18px] text-[#3a3530] leading-snug">{tripResult.packingList.headline}</p>
              <p className="text-[12px] text-[#a09080] mt-1.5 leading-relaxed">{tripResult.packingList.weatherSummary}</p>
            </div>

            <div className="px-5 pb-2">
              {tripResult.packingList.categories.map((cat, idx) => (
                <div key={cat.name} className="relative pl-6 pb-5">
                  {idx < tripResult.packingList.categories.length - 1 && <div className="absolute left-[7px] top-[10px] bottom-0 w-px border-l border-dashed border-[#d4ccc0]" />}
                  <div className="absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 border-[#6b7c5e] bg-[#f5f0ea]" />
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7c5e] font-medium mb-1.5">{cat.name}</p>
                  <div className="space-y-1">{cat.items.map((item, j) => <PackLink key={j} text={item} />)}</div>
                </div>
              ))}
            </div>

            {tripResult.packingList.skipList.length > 0 && (
              <>
                <div className="mx-5 border-t border-dashed border-[#d4ccc0]" />
                <div className="px-5 py-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#c09070] font-medium mb-2">Leave at home</p>
                  <div className="space-y-1">{tripResult.packingList.skipList.map((s, j) => <p key={j} className="text-[12px] text-[#a09080] leading-relaxed">{s}</p>)}</div>
                </div>
              </>
            )}

            {tripResult.packingList.proTip && (
              <div className="mx-5 mb-5 rounded-xl bg-[#6b7c5e]/8 p-3.5">
                <p className="text-[11px] text-[#6b7c5e] leading-relaxed">{tripResult.packingList.proTip}</p>
              </div>
            )}
          </div>

          {/* Day-by-day — tappable for drill-down */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#a09080] mb-2 px-1">Tap a day for the full outfit</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {tripResult.days.map((day, i) => {
                const isActive = drillDay?.day.date === day.date;
                return (
                  <button key={day.date}
                    onClick={() => { setDrillDay(null); fetchDrillDay(query, i); }}
                    className={`flex flex-col items-center py-2 px-3 rounded-xl border shrink-0 transition-all ${
                      isActive ? "bg-[#6b7c5e] border-[#6b7c5e] text-white" : "bg-[#f5f0ea] border-[#e8e0d4] text-[#3a3530]"
                    }`}>
                    <span className={`text-[10px] ${isActive ? "text-white/70" : "text-[#a09080]"}`}>{day.dayName.slice(0, 3)}</span>
                    <span className={`text-[11px] font-medium whitespace-nowrap ${isActive ? "text-white" : ""}`}>{day.tempRange}</span>
                    {day.precipChance > 30 && <span className={`text-[9px] ${isActive ? "text-white/70" : "text-[#c09070]"}`}>{day.precipChance}%</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drill-down day card */}
          {drillLoading && (
            <div className="flex justify-center py-8">
              <div className="w-full max-w-[200px] h-1.5 rounded-full overflow-hidden bg-[#ece6dc]">
                <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #d4b896, #6b7c5e, #d4b896)", backgroundSize: "300% 100%", animation: "breatheBar 6s ease-in-out infinite" }} />
              </div>
              <style>{`@keyframes breatheBar { 0%, 100% { background-position: 0% 50%; opacity: 0.7; } 50% { background-position: 100% 50%; opacity: 1; } }`}</style>
            </div>
          )}

          {drillDay && !drillLoading && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#a09080]">{dayLabel(drillDay)} — full outfit</p>
                <button onClick={() => setDrillDay(null)} className="text-[11px] text-[#b0a490] hover:text-[#6b7c5e]">Close</button>
              </div>
              <DayCard result={drillDay} />
            </div>
          )}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && ((mode === "today" && !todayResult) || (mode === "trip" && !tripResult)) && (
        <div className="text-center mt-20">
          <p className="font-[var(--font-serif)] text-[32px] text-[#e0d8cc]">{mode === "today" ? "?" : "..."}</p>
          <p className="text-[13px] text-[#c0b8a8] mt-2">{mode === "today" ? "What city are you dressing for?" : "Where are you headed?"}</p>
        </div>
      )}
    </main>
  );
}

// ── Shared Day Card ──────────────────────────────────────────────────

function DayCard({ result }: { result: TodayResult }) {
  return (
    <div className="rounded-3xl bg-[#f5f0ea] border border-[#e8e0d4] overflow-hidden">
      <div className="p-5 pb-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#a09080] mb-3">{result.location}</p>
        <p className="font-[var(--font-serif)] text-[20px] text-[#3a3530] leading-snug">{result.outfit.headline}</p>
        <div className="flex gap-5 mt-4">
          <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#a09080]">Range</p><p className="text-[13px] font-medium text-[#3a3530]">{Math.round(result.day.tempMin)}–{Math.round(result.day.tempMax)}°</p></div>
          <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#a09080]">UV</p><p className="text-[13px] font-medium text-[#3a3530]">{result.day.uvIndexMax}</p></div>
          {result.day.precipitationProbability > 20 && <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#a09080]">Rain</p><p className="text-[13px] font-medium text-[#3a3530]">{result.day.precipitationProbability}%</p></div>}
        </div>
      </div>

      <Scallop />

      <div className="px-5 pt-4 pb-2">
        {/* Walk out */}
        <TimelineSection
          label="Walk out the door" timeRange={result.moments[0]?.timeRange || "7–9am"}
          temp={result.moments[0] ? `${result.moments[0].sunFeel}°` : undefined}
          tempSub={result.moments[0] ? `${result.moments[0].shadeFeel}° shade` : undefined}
          dotColor="border-[#d4a860]" hasLine
        >
          <p className="text-[12px] text-[#a09080] italic mb-3">{result.outfit.walkOut.summary}</p>
          <div className="space-y-2">
            <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#b0a490] mb-0.5">Top</p><ShopLink text={result.outfit.walkOut.top} /></div>
            {result.outfit.walkOut.layer && <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#b0a490] mb-0.5">Layer</p><ShopLink text={result.outfit.walkOut.layer} /></div>}
            <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#b0a490] mb-0.5">Bottom</p><ShopLink text={result.outfit.walkOut.bottom} /></div>
            <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#b0a490] mb-0.5">Shoes</p><ShopLink text={result.outfit.walkOut.shoes} /></div>
          </div>
          {result.outfit.walkOut.accessories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {result.outfit.walkOut.accessories.map((a, j) => <span key={j} className="text-[10px] text-[#6b7c5e] bg-[#6b7c5e]/8 px-2 py-0.5 rounded-full">{a}</span>)}
            </div>
          )}
        </TimelineSection>

        {/* Midday */}
        <TimelineSection
          label="Midday shift" timeRange={result.moments[1]?.timeRange || "11am–3pm"}
          temp={result.moments[1] ? `${result.moments[1].sunFeel}°` : undefined}
          tempSub={result.moments[1] ? `${result.moments[1].shadeFeel}° shade` : undefined}
          dotColor="border-[#c4a882]" hasLine
        >
          <p className="text-[12px] text-[#a09080] italic mb-3">{result.outfit.carry.summary}</p>
          {result.outfit.carry.remove.length > 0 && (
            <div className="mb-2">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#c09070] mb-1">Take off</p>
              {result.outfit.carry.remove.map((item, j) => <p key={j} className="text-[13px] text-[#5a5248]">{item}</p>)}
            </div>
          )}
          {result.outfit.carry.add.length > 0 && (
            <div className="mb-2">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#6b7c5e] mb-1">Put on</p>
              {result.outfit.carry.add.map((item, j) => <p key={j} className="text-[13px] text-[#5a5248]">{item}</p>)}
            </div>
          )}
          <p className="text-[11px] text-[#b0a490]">{result.outfit.carry.note}</p>
        </TimelineSection>

        {/* Evening */}
        <TimelineSection
          label="By evening" timeRange={result.moments[2]?.timeRange || "6–10pm"}
          temp={result.moments[2] ? `${result.moments[2].shadeFeel}°` : undefined}
          tempSub={result.moments[2]?.windSpeed && result.moments[2].windSpeed > 5 ? "wind chill" : undefined}
          dotColor="border-[#8890a0]"
        >
          <p className="text-[12px] text-[#a09080] italic mb-3">{result.outfit.evening.summary}</p>
          {result.outfit.evening.add.length > 0 && (
            <div className="mb-2">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#6b7c5e] mb-1">Put back on</p>
              {result.outfit.evening.add.map((item, j) => <p key={j} className="text-[13px] text-[#5a5248]">{item}</p>)}
            </div>
          )}
          <p className="text-[11px] text-[#b0a490]">{result.outfit.evening.note}</p>
        </TimelineSection>
      </div>

      {/* Bag */}
      {result.outfit.bagEssentials.length > 0 && (
        <>
          <div className="mx-5 border-t border-dashed border-[#d4ccc0]" />
          <div className="px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#a09080] mb-2">In your bag</p>
            <div className="flex flex-wrap gap-1.5">
              {result.outfit.bagEssentials.map((item, i) => <span key={i} className="text-[11px] text-[#5a5248] bg-[#ece6dc] px-2.5 py-1 rounded-full">{item}</span>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TimelineSection({ label, timeRange, temp, tempSub, dotColor, hasLine, children }: {
  label: string; timeRange: string; temp?: string; tempSub?: string; dotColor: string; hasLine?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="relative pl-6 pb-5">
      {hasLine && <div className="absolute left-[7px] top-[10px] bottom-0 w-px border-l border-dashed border-[#d4ccc0]" />}
      <div className={`absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 ${dotColor} bg-[#f5f0ea]`} />
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7c5e] font-medium">{label}</p>
          <p className="text-[11px] text-[#b0a490]">{timeRange}</p>
        </div>
        {temp && (
          <div className="text-right">
            <span className="font-[var(--font-serif)] text-[28px] leading-none text-[#3a3530]">{temp}</span>
            {tempSub && <p className="text-[10px] text-[#b0a490]">{tempSub}</p>}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
