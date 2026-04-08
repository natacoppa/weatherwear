"use client";

import { useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────

interface Moment {
  label: string;
  timeRange: string;
  temp: number;
  sunFeel: number;
  shadeFeel: number;
  windSpeed: number;
  uvIndex: number;
  precipChance: number;
}

interface DayOutfit {
  headline: string;
  walkOut: {
    summary: string;
    top: string;
    layer: string | null;
    bottom: string;
    shoes: string;
    accessories: string[];
  };
  carry: {
    summary: string;
    add: string[];
    remove: string[];
    note: string;
  };
  evening: {
    summary: string;
    add: string[];
    note: string;
  };
  bagEssentials: string[];
}

interface Result {
  location: string;
  day: { date: string; tempMax: number; tempMin: number; uvIndexMax: number; precipitationProbability: number };
  dayIndex: number;
  totalDays: number;
  moments: Moment[];
  outfit: DayOutfit;
}

// ── Loader ───────────────────────────────────────────────────────────

function Loader() {
  return (
    <div className="flex flex-col items-center gap-5 py-20">
      <div className="w-full max-w-[240px] h-2 rounded-full overflow-hidden bg-[#ece6dc]">
        <div className="h-full rounded-full" style={{
          background: "linear-gradient(90deg, #d4b896, #c4a882, #a8b4a0, #6b7c5e, #d4b896)",
          backgroundSize: "300% 100%",
          animation: "breatheBar 6s ease-in-out infinite",
        }} />
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#c0b4a0]">Reading your day</p>
      <style>{`@keyframes breatheBar { 0%, 100% { background-position: 0% 50%; opacity: 0.7; } 50% { background-position: 100% 50%; opacity: 1; } }`}</style>
    </div>
  );
}

// ── Shopping URL ─────────────────────────────────────────────────────

function shopUrl(text: string) {
  const cleaned = text.replace(/^\d+\s*/g, "").replace(/\s*—.*$/, "").replace(/\s*\(.*?\)\s*/g, "").trim();
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(cleaned)}`;
}

function ShopLink({ text }: { text: string }) {
  return (
    <a href={shopUrl(text)} target="_blank" rel="noopener noreferrer"
      className="text-[13px] text-[#5a5248] leading-relaxed underline decoration-[#d4ccc0] underline-offset-2 hover:decoration-[#6b7c5e] transition-colors">
      {text} <span className="text-[10px] text-[#c0b4a0] no-underline">↗</span>
    </a>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

export default function V3Page() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [dayIndex, setDayIndex] = useState(0);

  const fetchDay = useCallback(async (q: string, day: number) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/outfit-day?q=${encodeURIComponent(q)}&day=${day}`);
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setResult(data);
      setDayIndex(data.dayIndex);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setDayIndex(0);
    fetchDay(query.trim(), 0);
  };

  const handleDayNav = (dir: number) => {
    const next = dayIndex + dir;
    if (!query.trim() || next < 0 || (result && next >= result.totalDays)) return;
    fetchDay(query.trim(), next);
  };

  const dayLabel = () => {
    if (!result) return "";
    if (dayIndex === 0) return "Today";
    if (dayIndex === 1) return "Tomorrow";
    const d = new Date(result.day.date + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  return (
    <main className="flex-1 w-full max-w-[420px] mx-auto px-4 pt-10 pb-16 overflow-x-hidden bg-[#faf8f4]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4b896] to-[#c4a882]" />
        <span className="font-[var(--font-serif)] text-[18px] text-[#3a3530]">WeatherWear</span>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-5">
        <div className="flex gap-2">
          <input
            type="text" placeholder="City..." value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-10 px-3.5 rounded-xl bg-white border border-[#e0d8cc] text-[14px] text-[#3a3530] placeholder:text-[#c0b8a8] outline-none focus:border-[#c4a882]"
          />
          <button type="submit" disabled={loading || !query.trim()}
            className="h-10 px-4 rounded-xl bg-[#6b7c5e] text-white text-[13px] font-medium disabled:opacity-30 shrink-0">
            Go
          </button>
        </div>
      </form>

      {error && <div className="rounded-xl bg-[#ffeee8] text-[#c06040] text-[13px] p-3 mb-4">{error}</div>}
      {loading && <Loader />}

      {result && !loading && (
        <div className="space-y-3">
          {/* Day nav */}
          <div className="flex items-center justify-end gap-2">
            {dayIndex > 0 && <button onClick={() => handleDayNav(-1)} className="text-[#b0a490] hover:text-[#6b7c5e] text-[13px]">←</button>}
            <p className="text-[13px] text-[#6b7c5e] font-medium">{dayLabel()}</p>
            {result && dayIndex < result.totalDays - 1 && <button onClick={() => handleDayNav(1)} className="text-[#b0a490] hover:text-[#6b7c5e] text-[13px]">→</button>}
          </div>

          {/* Main card */}
          <div className="rounded-3xl bg-[#f5f0ea] border border-[#e8e0d4] overflow-hidden">
            {/* Header */}
            <div className="p-5 pb-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#a09080] mb-3">{result.location}</p>
              <p className="font-[var(--font-serif)] text-[20px] text-[#3a3530] leading-snug">{result.outfit.headline}</p>

              <div className="flex gap-5 mt-4">
                <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#a09080]">Range</p><p className="text-[13px] font-medium text-[#3a3530]">{Math.round(result.day.tempMin)}–{Math.round(result.day.tempMax)}°</p></div>
                <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#a09080]">UV</p><p className="text-[13px] font-medium text-[#3a3530]">{result.day.uvIndexMax}</p></div>
                {result.day.precipitationProbability > 20 && (
                  <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#a09080]">Rain</p><p className="text-[13px] font-medium text-[#3a3530]">{result.day.precipitationProbability}%</p></div>
                )}
              </div>
            </div>

            {/* Scallop */}
            <div className="w-full h-3 flex items-center justify-center overflow-hidden">
              <div className="flex">{Array.from({ length: 30 }).map((_, i) => <div key={i} className="w-3 h-3 rounded-full bg-[#faf8f4] -mx-[1px]" />)}</div>
            </div>

            {/* ── Walk Out ── */}
            <div className="px-5 pt-4 pb-1">
              <div className="relative pl-6 pb-5">
                <div className="absolute left-[7px] top-[10px] bottom-0 w-px border-l border-dashed border-[#d4ccc0]" />
                <div className="absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 border-[#d4a860] bg-[#f5f0ea]" />

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7c5e] font-medium">Walk out the door</p>
                    <p className="text-[11px] text-[#b0a490]">{result.moments[0]?.timeRange || "7–9am"}</p>
                  </div>
                  {result.moments[0] && (
                    <div className="text-right">
                      <span className="font-[var(--font-serif)] text-[28px] leading-none text-[#3a3530]">{result.moments[0].sunFeel}°</span>
                      <p className="text-[10px] text-[#b0a490]">{result.moments[0].shadeFeel}° shade</p>
                    </div>
                  )}
                </div>

                <p className="text-[12px] text-[#a09080] italic mb-3">{result.outfit.walkOut.summary}</p>

                <div className="space-y-2">
                  <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#b0a490] mb-0.5">Top</p><ShopLink text={result.outfit.walkOut.top} /></div>
                  {result.outfit.walkOut.layer && (
                    <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#b0a490] mb-0.5">Layer</p><ShopLink text={result.outfit.walkOut.layer} /></div>
                  )}
                  <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#b0a490] mb-0.5">Bottom</p><ShopLink text={result.outfit.walkOut.bottom} /></div>
                  <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#b0a490] mb-0.5">Shoes</p><ShopLink text={result.outfit.walkOut.shoes} /></div>
                </div>

                {result.outfit.walkOut.accessories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {result.outfit.walkOut.accessories.map((a, j) => (
                      <span key={j} className="text-[10px] text-[#6b7c5e] bg-[#6b7c5e]/8 px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Carry / Midday ── */}
              <div className="relative pl-6 pb-5">
                <div className="absolute left-[7px] top-[10px] bottom-0 w-px border-l border-dashed border-[#d4ccc0]" />
                <div className="absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 border-[#c4a882] bg-[#f5f0ea]" />

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7c5e] font-medium">Midday shift</p>
                    <p className="text-[11px] text-[#b0a490]">{result.moments[1]?.timeRange || "11am–3pm"}</p>
                  </div>
                  {result.moments[1] && (
                    <div className="text-right">
                      <span className="font-[var(--font-serif)] text-[28px] leading-none text-[#3a3530]">{result.moments[1].sunFeel}°</span>
                      <p className="text-[10px] text-[#b0a490]">{result.moments[1].shadeFeel}° shade</p>
                    </div>
                  )}
                </div>

                <p className="text-[12px] text-[#a09080] italic mb-3">{result.outfit.carry.summary}</p>

                {result.outfit.carry.remove.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[9px] uppercase tracking-[0.15em] text-[#c09070] mb-1">Take off</p>
                    {result.outfit.carry.remove.map((item, j) => (
                      <p key={j} className="text-[13px] text-[#5a5248]">{item}</p>
                    ))}
                  </div>
                )}

                {result.outfit.carry.add.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[9px] uppercase tracking-[0.15em] text-[#6b7c5e] mb-1">Put on</p>
                    {result.outfit.carry.add.map((item, j) => (
                      <p key={j} className="text-[13px] text-[#5a5248]">{item}</p>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-[#b0a490]">{result.outfit.carry.note}</p>
              </div>

              {/* ── Evening ── */}
              <div className="relative pl-6 pb-4">
                <div className="absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 border-[#8890a0] bg-[#f5f0ea]" />

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7c5e] font-medium">By evening</p>
                    <p className="text-[11px] text-[#b0a490]">{result.moments[2]?.timeRange || "6–10pm"}</p>
                  </div>
                  {result.moments[2] && (
                    <div className="text-right">
                      <span className="font-[var(--font-serif)] text-[28px] leading-none text-[#3a3530]">{result.moments[2].shadeFeel}°</span>
                      {result.moments[2].windSpeed > 5 && <p className="text-[10px] text-[#b0a490]">wind chill</p>}
                    </div>
                  )}
                </div>

                <p className="text-[12px] text-[#a09080] italic mb-3">{result.outfit.evening.summary}</p>

                {result.outfit.evening.add.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[9px] uppercase tracking-[0.15em] text-[#6b7c5e] mb-1">Put back on</p>
                    {result.outfit.evening.add.map((item, j) => (
                      <p key={j} className="text-[13px] text-[#5a5248]">{item}</p>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-[#b0a490]">{result.outfit.evening.note}</p>
              </div>
            </div>

            {/* Bag essentials */}
            {result.outfit.bagEssentials.length > 0 && (
              <>
                <div className="mx-5 border-t border-dashed border-[#d4ccc0]" />
                <div className="px-5 py-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#a09080] mb-2">In your bag</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.outfit.bagEssentials.map((item, i) => (
                      <span key={i} className="text-[11px] text-[#5a5248] bg-[#ece6dc] px-2.5 py-1 rounded-full">{item}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && !result && (
        <div className="text-center mt-20">
          <p className="font-[var(--font-serif)] text-[32px] text-[#e0d8cc]">?</p>
          <p className="text-[13px] text-[#c0b8a8] mt-2">What city are you dressing for?</p>
        </div>
      )}
    </main>
  );
}
