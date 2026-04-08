"use client";

import { useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────

interface OutfitPeriod {
  period: string;
  timeRange: string;
  sunFeel: number;
  shadeFeel: number;
  summary: string;
  top: string;
  outerwear: string | null;
  bottom: string;
  shoes: string;
  accessories: string[];
  materialNote: string;
}

interface DayForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  uvIndexMax: number;
  precipitationProbability: number;
}

interface WeatherResult {
  weather: {
    location: string;
    daily: DayForecast[];
    current: { temperature: number; windSpeed: number; humidity: number; uvIndex: number; cloudCover: number; weatherCode: number; isDay: boolean };
  };
  selectedDay: number;
  periods: { period: string; label: string; timeRange: string; avgTemp: number; feelsLike: { sunFeel: number; shadeFeel: number }; uvIndex: number; windSpeed: number; humidity: number; precipChance: number; cloudCover: number }[];
  outfit: { headline: string; vibe: string; periods: OutfitPeriod[]; allDayEssentials: string[] };
}

interface TripResult {
  location: string;
  isHistorical?: boolean;
  days: { dayName: string; date: string; tempRange: string; precipChance: number }[];
  packingList: { headline: string; weatherSummary: string; categories: { name: string; items: string[] }[]; skipList: string[]; proTip: string };
}

type Mode = "today" | "trip";

// ── Loading: Today — Breathing Gradient Bar ─────────────────────────

function TodayLoader() {
  return (
    <div className="flex flex-col items-center gap-5 py-20">
      <div className="w-full max-w-[240px] h-2 rounded-full overflow-hidden bg-[#ece6dc]">
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #d4b896, #c4a882, #a8b4a0, #6b7c5e, #d4b896)",
            backgroundSize: "300% 100%",
            animation: "breatheBar 6s ease-in-out infinite",
          }}
        />
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#c0b4a0]">Checking conditions</p>
      <style>{`
        @keyframes breatheBar {
          0%, 100% { background-position: 0% 50%; opacity: 0.7; }
          50% { background-position: 100% 50%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Loading: Trip — Dot Trail ───────────────────────────────────────

function TripLoader() {
  return (
    <div className="flex flex-col items-center gap-5 py-20">
      <div className="flex items-center gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="relative">
            <div
              className="w-3 h-3 rounded-full border-2 border-[#6b7c5e] bg-[#f5f0ea]"
              style={{ animation: `dotPulse 4s ease-in-out infinite ${i * 0.6}s` }}
            />
            {i < 4 && (
              <div className="absolute top-1/2 left-full w-3 h-px border-t border-dashed border-[#d4ccc0]" style={{ transform: "translateY(-50%)" }} />
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#c0b4a0]">Building your list</p>
      <style>{`
        @keyframes dotPulse {
          0%, 100% { background-color: #f5f0ea; transform: scale(1); }
          50% { background-color: #6b7c5e; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────

export default function V2Page() {
  const [mode, setMode] = useState<Mode>("today");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Today
  const [todayResult, setTodayResult] = useState<WeatherResult | null>(null);
  const [expandedPeriod, setExpandedPeriod] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [lastParams, setLastParams] = useState("");

  // Trip
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [tripStart, setTripStart] = useState(() => new Date().toISOString().split("T")[0]);
  const [tripEnd, setTripEnd] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split("T")[0]; });

  const fetchToday = useCallback(async (params: string, dayIndex?: number) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/weather?${params}${dayIndex !== undefined ? `&day=${dayIndex}` : ""}`);
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setTodayResult(data); setExpandedPeriod(0); setSelectedDay(data.selectedDay || 0);
      if (dayIndex === undefined) setLastParams(params);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, []);

  const fetchTrip = useCallback(async (params: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/trip?${params}&startDate=${tripStart}&endDate=${tripEnd}`);
      if (!res.ok) throw new Error((await res.json()).error);
      setTripResult(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, [tripStart, tripEnd]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const p = `q=${encodeURIComponent(query.trim())}`;
    if (mode === "today") { setSelectedDay(0); fetchToday(p); }
    else fetchTrip(p);
  };

  const handleDaySelect = (i: number) => {
    if (!lastParams || i === selectedDay) return;
    setSelectedDay(i); fetchToday(lastParams, i);
  };

  const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <main className="flex-1 w-full max-w-[420px] mx-auto px-4 pt-10 pb-16 overflow-x-hidden bg-[#faf8f4]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4b896] to-[#c4a882]" />
        <span className="font-[var(--font-serif)] text-[18px] text-[#3a3530]">WeatherWear</span>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#ece6dc] mb-4 w-fit">
        {(["today", "trip"] as Mode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-lg text-[12px] font-medium capitalize transition-all ${mode === m ? "bg-white text-[#3a3530] shadow-sm" : "text-[#a09080]"}`}
          >{m === "today" ? "Today" : "Trip"}</button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-1">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={mode === "today" ? "City..." : "Where are you going?"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
              className="flex-1 min-w-0 h-8 px-2 rounded-lg bg-white border border-[#e0d8cc] text-[12px] text-[#3a3530] outline-none"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[11px] text-[#a09080]">To</span>
            <input type="date" value={tripEnd}
              onChange={(e) => setTripEnd(e.target.value)} min={tripStart}
              className="flex-1 min-w-0 h-8 px-2 rounded-lg bg-white border border-[#e0d8cc] text-[12px] text-[#3a3530] outline-none"
            />
          </div>
        </div>
      )}

      {mode === "today" && <div className="mb-3" />}

      {error && <div className="rounded-xl bg-[#ffeee8] text-[#c06040] text-[13px] p-3 mb-4">{error}</div>}
      {loading && (mode === "today" ? <TodayLoader /> : <TripLoader />)}

      {/* ═══════════ TODAY MODE ═══════════ */}
      {mode === "today" && todayResult && !loading && (() => {
        const day = todayResult.weather.daily[selectedDay] || todayResult.weather.daily[0];
        return (
          <div className="space-y-3">
            {/* Day nav */}
            <div className="flex items-center justify-end gap-2">
              {selectedDay > 0 && <button onClick={() => handleDaySelect(selectedDay - 1)} className="text-[#b0a490] hover:text-[#6b7c5e] text-[13px]">←</button>}
              <p className="text-[13px] text-[#6b7c5e] font-medium">
                {selectedDay === 0 ? "Today" : selectedDay === 1 ? "Tomorrow" : new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
              {selectedDay < todayResult.weather.daily.length - 1 && <button onClick={() => handleDaySelect(selectedDay + 1)} className="text-[#b0a490] hover:text-[#6b7c5e] text-[13px]">→</button>}
            </div>

            {/* Main card */}
            <div className="rounded-3xl bg-[#f5f0ea] border border-[#e8e0d4] overflow-hidden">
              {/* Header */}
              <div className="p-5 pb-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#a09080] truncate min-w-0">{todayResult.weather.location}</p>
                  <span className="text-[10px] tracking-[0.12em] uppercase text-[#6b7c5e] bg-[#6b7c5e]/10 px-2.5 py-1 rounded-full font-medium shrink-0">{todayResult.outfit.vibe}</span>
                </div>
                <p className="font-[var(--font-serif)] text-[20px] text-[#3a3530] leading-snug">{todayResult.outfit.headline}</p>

                {/* Stats */}
                <div className="flex gap-5 mt-4">
                  <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#a09080]">Range</p><p className="text-[13px] font-medium text-[#3a3530]">{Math.round(day.tempMin)}–{Math.round(day.tempMax)}°</p></div>
                  <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#a09080]">UV</p><p className="text-[13px] font-medium text-[#3a3530]">{day.uvIndexMax}</p></div>
                  <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#a09080]">Wind</p><p className="text-[13px] font-medium text-[#3a3530]">{Math.round(todayResult.weather.current.windSpeed)}mph</p></div>
                  <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#a09080]">Rain</p><p className="text-[13px] font-medium text-[#3a3530]">{day.precipitationProbability}%</p></div>
                </div>
              </div>

              {/* Scallop */}
              <div className="w-full h-3 flex items-center justify-center overflow-hidden">
                <div className="flex">{Array.from({ length: 30 }).map((_, i) => <div key={i} className="w-3 h-3 rounded-full bg-[#faf8f4] -mx-[1px]" />)}</div>
              </div>

              {/* Period sections */}
              <div className="px-5 pt-3 pb-2">
                {todayResult.outfit.periods.map((period, i) => {
                  const wp = todayResult.periods[i];
                  const isExpanded = expandedPeriod === i;
                  const isNight = period.period.toLowerCase() === "night";
                  return (
                    <div key={period.period} className="relative pl-6 pb-4">
                      {i < todayResult.outfit.periods.length - 1 && (
                        <div className="absolute left-[7px] top-[10px] bottom-0 w-px border-l border-dashed border-[#d4ccc0]" />
                      )}
                      <div className={`absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 ${isNight ? "border-[#8890a0]" : "border-[#d4a860]"} bg-[#f5f0ea]`} />

                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7c5e] font-medium">{period.period}</p>
                          <p className="text-[11px] text-[#b0a490]">{period.timeRange}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-[var(--font-serif)] text-[28px] leading-none text-[#3a3530]">
                            {isNight ? period.shadeFeel : period.sunFeel}°
                          </span>
                          {!isNight && <p className="text-[10px] text-[#b0a490]">{period.shadeFeel}° shade</p>}
                          {isNight && wp && wp.windSpeed > 5 && <p className="text-[10px] text-[#b0a490]">wind chill</p>}
                        </div>
                      </div>

                      <div className="mt-3 space-y-2.5">
                        <p className="text-[12px] text-[#a09080] italic">{period.summary}</p>
                        <Item label="Top" value={period.top} />
                        {period.outerwear && <Item label="Layer" value={period.outerwear} />}
                        <Item label="Bottom" value={period.bottom} />
                        <Item label="Shoes" value={period.shoes} />
                        {period.accessories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {period.accessories.map((a, j) => (
                              <span key={j} className="text-[10px] text-[#6b7c5e] bg-[#6b7c5e]/8 px-2 py-0.5 rounded-full">{a}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Essentials */}
              {todayResult.outfit.allDayEssentials.length > 0 && (
                <>
                  <div className="mx-5 border-t border-dashed border-[#d4ccc0]" />
                  <div className="px-5 py-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#a09080] mb-2">Carry all day</p>
                    <div className="flex flex-wrap gap-1.5">
                      {todayResult.outfit.allDayEssentials.map((item, i) => (
                        <span key={i} className="text-[11px] text-[#5a5248] bg-[#ece6dc] px-2.5 py-1 rounded-full">{item}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ═══════════ TRIP MODE ═══════════ */}
      {mode === "trip" && tripResult && !loading && (
        <div className="space-y-3">
          <div className="rounded-3xl bg-[#f5f0ea] border border-[#e8e0d4] overflow-hidden">
            {/* Header */}
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

            {/* Scallop */}
            <div className="w-full h-3 flex items-center justify-center overflow-hidden">
              <div className="flex">{Array.from({ length: 30 }).map((_, i) => <div key={i} className="w-3 h-3 rounded-full bg-[#faf8f4] -mx-[1px]" />)}</div>
            </div>

            {/* Headline */}
            <div className="px-5 pt-3 pb-4">
              <p className="font-[var(--font-serif)] text-[18px] text-[#3a3530] leading-snug">{tripResult.packingList.headline}</p>
              <p className="text-[12px] text-[#a09080] mt-1.5 leading-relaxed">{tripResult.packingList.weatherSummary}</p>
            </div>

            {/* Timeline packing list */}
            <div className="px-5 pb-2">
              {tripResult.packingList.categories.map((cat, idx) => (
                <div key={cat.name} className="relative pl-6 pb-5">
                  {idx < tripResult.packingList.categories.length - 1 && <div className="absolute left-[7px] top-[10px] bottom-0 w-px border-l border-dashed border-[#d4ccc0]" />}
                  <div className="absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 border-[#6b7c5e] bg-[#f5f0ea]" />
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7c5e] font-medium mb-1.5">{cat.name}</p>
                  <div className="space-y-1">{cat.items.map((item, j) => <PackItem key={j} text={item} />)}</div>
                </div>
              ))}
            </div>

            {/* Skip */}
            {tripResult.packingList.skipList.length > 0 && (
              <>
                <div className="mx-5 border-t border-dashed border-[#d4ccc0]" />
                <div className="px-5 py-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#c09070] font-medium mb-2">Leave at home</p>
                  <div className="space-y-1">{tripResult.packingList.skipList.map((s, j) => <p key={j} className="text-[12px] text-[#a09080] leading-relaxed">{s}</p>)}</div>
                </div>
              </>
            )}

            {/* Tip */}
            {tripResult.packingList.proTip && (
              <div className="mx-5 mb-5 rounded-xl bg-[#6b7c5e]/8 p-3.5">
                <p className="text-[11px] text-[#6b7c5e] leading-relaxed">{tripResult.packingList.proTip}</p>
              </div>
            )}
          </div>

          {/* Day pills */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#a09080] mb-2 px-1">Day by day</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {tripResult.days.map((day) => (
                <div key={day.date} className="flex flex-col items-center py-2 px-3 rounded-xl bg-[#f5f0ea] border border-[#e8e0d4] shrink-0">
                  <span className="text-[10px] text-[#a09080]">{day.dayName.slice(0, 3)}</span>
                  <span className="text-[11px] font-medium text-[#3a3530] whitespace-nowrap">{day.tempRange}</span>
                  {day.precipChance > 30 && <span className="text-[9px] text-[#c09070]">{day.precipChance}%</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && ((mode === "today" && !todayResult) || (mode === "trip" && !tripResult)) && (
        <div className="text-center mt-20">
          <p className="font-[var(--font-serif)] text-[32px] text-[#e0d8cc]">{mode === "today" ? "?" : "..."}</p>
          <p className="text-[13px] text-[#c0b8a8] mt-2">{mode === "today" ? "Search a city to see what to wear" : "Where are you headed?"}</p>
        </div>
      )}
    </main>
  );
}

function shopUrl(text: string) {
  // Strip quantities/counts and filler words for a cleaner search
  const cleaned = text
    .replace(/^\d+\s*/g, "")
    .replace(/\s*—.*$/, "")
    .replace(/\s*\(.*?\)\s*/g, "")
    .trim();
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(cleaned)}`;
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.15em] text-[#b0a490] mb-0.5">{label}</p>
      <a
        href={shopUrl(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[13px] text-[#5a5248] leading-relaxed underline decoration-[#d4ccc0] underline-offset-2 hover:decoration-[#6b7c5e] transition-colors"
      >
        {value} <span className="text-[10px] text-[#c0b4a0] no-underline">↗</span>
      </a>
    </div>
  );
}

function PackItem({ text }: { text: string }) {
  return (
    <a
      href={shopUrl(text)}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-[13px] text-[#5a5248] leading-relaxed underline decoration-[#d4ccc0] underline-offset-2 hover:decoration-[#6b7c5e] transition-colors"
    >
      {text} <span className="text-[10px] text-[#c0b4a0] no-underline">↗</span>
    </a>
  );
}
