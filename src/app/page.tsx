"use client";

import { useState, useCallback } from "react";
import { PulseOrb } from "@/components/loaders";

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
  layeringTip: string | null;
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
    current: {
      temperature: number;
      windSpeed: number;
      humidity: number;
      uvIndex: number;
      cloudCover: number;
      weatherCode: number;
      isDay: boolean;
    };
  };
  selectedDay: number;
  periods: {
    period: string;
    label: string;
    timeRange: string;
    avgTemp: number;
    feelsLike: { sunFeel: number; shadeFeel: number; label: string; description: string };
    uvIndex: number;
    windSpeed: number;
    humidity: number;
    precipChance: number;
    cloudCover: number;
  }[];
  outfit: {
    headline: string;
    vibe: string;
    periods: OutfitPeriod[];
    allDayEssentials: string[];
  };
}

interface PackingCategory {
  name: string;
  items: string[];
}

interface TripResult {
  location: string;
  days: { dayName: string; date: string; tempRange: string; precipChance: number }[];
  packingList: {
    headline: string;
    weatherSummary: string;
    categories: PackingCategory[];
    skipList: string[];
    proTip: string;
  };
}

type Mode = "today" | "trip";

const periodGradients: Record<string, string> = {
  daytime: "from-[#fce4d6]/60 via-[#fdeef0]/40 to-[#fdf6e3]/30",
  night: "from-[#e0daf5]/50 via-[#dde8f0]/40 to-[#e8e0f0]/30",
};

// ── Component ────────────────────────────────────────────────────────

export default function Home() {
  const [mode, setMode] = useState<Mode>("today");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  // Today mode state
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [expandedPeriod, setExpandedPeriod] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [lastSearchParams, setLastSearchParams] = useState("");

  // Trip mode state
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [tripStart, setTripStart] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [tripEnd, setTripEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });

  const fetchToday = useCallback(async (params: string, dayIndex?: number) => {
    setLoading(true);
    setError(null);
    const dayParam = dayIndex !== undefined ? `&day=${dayIndex}` : "";
    try {
      const res = await fetch(`/api/weather?${params}${dayParam}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to fetch");
      const data = await res.json();
      setResult(data);
      setExpandedPeriod(0);
      setSelectedDay(data.selectedDay || 0);
      if (!dayParam) setLastSearchParams(params);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrip = useCallback(async (params: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trip?${params}&startDate=${tripStart}&endDate=${tripEnd}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to fetch");
      const data = await res.json();
      setTripResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [tripStart, tripEnd]);

  const handleDaySelect = (dayIndex: number) => {
    if (!lastSearchParams || dayIndex === selectedDay) return;
    setSelectedDay(dayIndex);
    fetchToday(lastSearchParams, dayIndex);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (mode === "today") {
      setSelectedDay(0);
      fetchToday(`q=${encodeURIComponent(query.trim())}`);
    } else {
      fetchTrip(`q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const params = `lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`;
        if (mode === "today") fetchToday(params);
        else fetchTrip(params);
      },
      () => { setLocating(false); setError("Couldn't get your location"); }
    );
  };

  return (
    <main className="flex-1 w-full max-w-[440px] mx-auto px-4 pt-10 pb-16 overflow-x-hidden">
      {/* Header */}
      <h1 className="font-[var(--font-serif)] text-[28px] text-[#1a1a1a] tracking-tight">
        WeatherWear
      </h1>
      <p className="text-[13px] text-[#999] mt-1 mb-5">
        What to wear, based on how it actually feels.
      </p>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-2xl bg-[#f0ece8] mb-4 w-fit">
        <button
          onClick={() => setMode("today")}
          className={`px-4 py-1.5 rounded-xl text-[12px] font-medium tracking-wide transition-all ${
            mode === "today"
              ? "bg-white text-[#1a1a1a] shadow-sm"
              : "text-[#999] hover:text-[#666]"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setMode("trip")}
          className={`px-4 py-1.5 rounded-xl text-[12px] font-medium tracking-wide transition-all ${
            mode === "trip"
              ? "bg-white text-[#1a1a1a] shadow-sm"
              : "text-[#999] hover:text-[#666]"
          }`}
        >
          Trip
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-1">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={mode === "today" ? "Search a city..." : "Where are you going?"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-11 pl-4 pr-10 rounded-2xl bg-white border border-[#e8e4e0] text-[14px] text-[#1a1a1a] placeholder:text-[#bbb] outline-none focus:border-[#ccc] transition-colors"
            />
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={locating || loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ccc] hover:text-[#888] transition-colors disabled:opacity-40"
              title="Use my location"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="h-11 px-4 rounded-2xl bg-[#1a1a1a] text-white text-[13px] font-medium tracking-wide disabled:opacity-30 transition-opacity shrink-0"
          >
            Go
          </button>
        </div>
      </form>

      {/* Trip date picker */}
      {mode === "trip" && (
        <div className="flex items-center gap-2 mt-2 mb-4">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#aaa] mb-1">From</p>
            <input
              type="date"
              value={tripStart}
              onChange={(e) => {
                setTripStart(e.target.value);
                if (e.target.value > tripEnd) setTripEnd(e.target.value);
              }}
              min={new Date().toISOString().split("T")[0]}
              max={(() => { const d = new Date(); d.setDate(d.getDate() + 6); return d.toISOString().split("T")[0]; })()}
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#e8e4e0] text-[13px] text-[#1a1a1a] outline-none focus:border-[#ccc]"
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#aaa] mb-1">To</p>
            <input
              type="date"
              value={tripEnd}
              onChange={(e) => setTripEnd(e.target.value)}
              min={tripStart}
              max={(() => { const d = new Date(); d.setDate(d.getDate() + 6); return d.toISOString().split("T")[0]; })()}
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#e8e4e0] text-[13px] text-[#1a1a1a] outline-none focus:border-[#ccc]"
            />
          </div>
        </div>
      )}

      {mode === "today" && <div className="mb-3" />}

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-[#fff0f0] text-[#c44] text-[13px] p-4 mb-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <PulseOrb />}

      {/* ── Today Mode Results ──────────────────────────────────── */}
      {mode === "today" && result && !loading && (() => {
        const dayData = result.weather.daily[selectedDay] || result.weather.daily[0];
        return (
        <div className="space-y-4">
          {/* Day nav */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              {selectedDay > 0 && (
                <button onClick={() => handleDaySelect(selectedDay - 1)} className="text-[#bbb] hover:text-[#888] transition-colors text-[13px]">←</button>
              )}
              <p className="text-[13px] text-[#666] font-medium">
                {selectedDay === 0 ? "Today" : selectedDay === 1 ? "Tomorrow" : new Date(dayData.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
              {selectedDay < result.weather.daily.length - 1 && (
                <button onClick={() => handleDaySelect(selectedDay + 1)} className="text-[#bbb] hover:text-[#888] transition-colors text-[13px]">→</button>
              )}
            </div>
          </div>

          {/* Hero */}
          <div className="rounded-3xl bg-gradient-to-br from-[#fce4d6]/50 via-[#fdeef0]/40 to-[#e8dff5]/30 p-5 backdrop-blur-sm border border-white/60">
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-[11px] uppercase tracking-[0.15em] text-[#999] truncate min-w-0">{result.weather.location}</p>
              <span className="text-[11px] tracking-[0.12em] uppercase text-[#888] bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap">{result.outfit.vibe}</span>
            </div>
            <p className="font-[var(--font-serif)] text-[22px] text-[#1a1a1a] leading-snug">{result.outfit.headline}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <StatPill label="Range" value={`${Math.round(dayData.tempMin)}–${Math.round(dayData.tempMax)}°`} />
            <StatPill label="UV" value={`${dayData.uvIndexMax}`} />
            <StatPill label="Wind" value={`${Math.round(result.weather.current.windSpeed)}mph`} />
            <StatPill label="Rain" value={`${dayData.precipitationProbability}%`} />
          </div>

          {/* Period cards */}
          {result.outfit.periods.map((period, i) => {
            const weatherPeriod = result.periods[i];
            const isExpanded = expandedPeriod === i;
            const gradient = periodGradients[period.period.toLowerCase()] || periodGradients.daytime;
            return (
              <div key={period.period} className={`rounded-3xl border border-white/60 overflow-hidden transition-all duration-300 ${isExpanded ? "bg-white/80" : "bg-white/50"} backdrop-blur-sm`}>
                <button onClick={() => setExpandedPeriod(isExpanded ? -1 : i)} className="w-full text-left">
                  <div className={`bg-gradient-to-br ${gradient} p-4 transition-all`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.15em] text-[#999] mb-0.5">{period.period}</p>
                        <p className="text-[12px] text-[#aaa]">{period.timeRange}</p>
                      </div>
                      <div className="text-right">
                        {period.period.toLowerCase() === "night" ? (
                          <>
                            <span className="font-[var(--font-serif)] text-[36px] leading-none text-[#1a1a1a]">{period.shadeFeel}°</span>
                            {weatherPeriod && weatherPeriod.windSpeed > 5 && <p className="text-[11px] text-[#aaa] mt-1">with wind chill</p>}
                          </>
                        ) : (
                          <>
                            <span className="font-[var(--font-serif)] text-[36px] leading-none text-[#1a1a1a]">{period.sunFeel}°</span>
                            <p className="text-[11px] text-[#aaa] mt-1">{period.shadeFeel}° in shade</p>
                          </>
                        )}
                      </div>
                    </div>
                    {weatherPeriod && weatherPeriod.precipChance > 30 && (
                      <p className="text-[11px] text-[#b08888] mt-2">{weatherPeriod.precipChance}% chance of rain</p>
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-3 space-y-3">
                    <p className="text-[13px] text-[#888] italic leading-relaxed">{period.summary}</p>
                    <div className="space-y-2.5">
                      <OutfitItem label="Top" value={period.top} />
                      {period.outerwear && <OutfitItem label="Layer" value={period.outerwear} />}
                      <OutfitItem label="Bottom" value={period.bottom} />
                      <OutfitItem label="Shoes" value={period.shoes} />
                    </div>
                    {period.accessories.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[#aaa] mb-1.5">Accessories</p>
                        <div className="flex flex-wrap gap-1.5">
                          {period.accessories.map((acc, j) => (
                            <span key={j} className="text-[11px] text-[#777] bg-[#f5f2ef] px-2.5 py-1 rounded-full">{acc}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="rounded-2xl bg-[#f8f6f3] p-3">
                      <p className="text-[11px] text-[#999] leading-relaxed">{period.materialNote}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Essentials */}
          {result.outfit.allDayEssentials.length > 0 && (
            <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-[#eae6e2] p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#aaa] mb-2">Carry all day</p>
              <div className="flex flex-wrap gap-1.5">
                {result.outfit.allDayEssentials.map((item, i) => (
                  <span key={i} className="text-[12px] text-[#666] bg-[#f5f2ef] px-3 py-1.5 rounded-full">{item}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* ── Trip Mode Results ──────────────────────────────────── */}
      {mode === "trip" && tripResult && !loading && (
        <div className="space-y-4">
          {/* Hero */}
          <div className="rounded-3xl bg-gradient-to-br from-[#e0daf5]/40 via-[#dde8f0]/30 to-[#fce4d6]/30 p-5 backdrop-blur-sm border border-white/60">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-[11px] uppercase tracking-[0.15em] text-[#999] truncate min-w-0">{tripResult.location}</p>
              <span className="text-[11px] tracking-[0.12em] uppercase text-[#888] bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full shrink-0">{tripResult.days.length} days</span>
            </div>
            <p className="font-[var(--font-serif)] text-[22px] text-[#1a1a1a] leading-snug mb-3">{tripResult.packingList.headline}</p>
            <p className="text-[13px] text-[#888] leading-relaxed">{tripResult.packingList.weatherSummary}</p>
          </div>

          {/* Weather overview pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {tripResult.days.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-0.5 min-w-[56px] py-2 px-2 rounded-2xl bg-white/60 border border-[#eae6e2]">
                <span className="text-[10px] text-[#aaa]">{day.dayName.slice(0, 3)}</span>
                <span className="text-[12px] font-medium text-[#1a1a1a]">{day.tempRange}</span>
                {day.precipChance > 30 && <span className="text-[9px] text-[#b08888]">{day.precipChance}%</span>}
              </div>
            ))}
          </div>

          {/* Packing categories */}
          {tripResult.packingList.categories.map((cat) => (
            <div key={cat.name} className="rounded-2xl bg-white/70 backdrop-blur-sm border border-[#eae6e2] p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#aaa] mb-2.5">{cat.name}</p>
              <div className="space-y-1.5">
                {cat.items.map((item, j) => (
                  <p key={j} className="text-[13px] text-[#444] leading-relaxed">{item}</p>
                ))}
              </div>
            </div>
          ))}

          {/* Skip list */}
          {tripResult.packingList.skipList.length > 0 && (
            <div className="rounded-2xl bg-[#fff8f6] border border-[#f0e0d8] p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#c4a088] mb-2.5">Leave at home</p>
              <div className="space-y-1.5">
                {tripResult.packingList.skipList.map((item, j) => (
                  <p key={j} className="text-[13px] text-[#888] leading-relaxed">{item}</p>
                ))}
              </div>
            </div>
          )}

          {/* Pro tip */}
          {tripResult.packingList.proTip && (
            <div className="rounded-2xl bg-[#f8f6f3] p-4">
              <p className="text-[11px] text-[#999] leading-relaxed">{tripResult.packingList.proTip}</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && ((mode === "today" && !result) || (mode === "trip" && !tripResult)) && (
        <div className="text-center mt-20">
          <p className="font-[var(--font-serif)] text-[36px] text-[#e0dcd8]">
            {mode === "today" ? "?" : "..."}
          </p>
          <p className="text-[13px] text-[#bbb] mt-2">
            {mode === "today" ? "Search a city to see what to wear" : "Where are you headed?"}
          </p>
        </div>
      )}
    </main>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2.5 rounded-2xl bg-white/60 backdrop-blur-sm border border-[#eae6e2] min-w-0 overflow-hidden">
      <span className="text-[13px] font-medium text-[#1a1a1a] truncate">{value}</span>
      <span className="text-[8px] uppercase tracking-[0.12em] text-[#bbb]">{label}</span>
    </div>
  );
}

function OutfitItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-[#bbb] mb-0.5">{label}</p>
      <p className="text-[13px] text-[#444] leading-relaxed">{value}</p>
    </div>
  );
}
