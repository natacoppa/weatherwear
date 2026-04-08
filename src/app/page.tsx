"use client";

import { useState, useCallback } from "react";
import { PulseOrb } from "@/components/loaders";

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
  sunrise: string;
  sunset: string;
}

interface WeatherResult {
  weather: {
    location: string;
    elevation: number;
    current: {
      temperature: number;
      humidity: number;
      windSpeed: number;
      uvIndex: number;
      cloudCover: number;
      weatherCode: number;
      isDay: boolean;
    };
    daily: DayForecast[];
  };
  selectedDay: number;
  periods: {
    period: string;
    label: string;
    timeRange: string;
    avgTemp: number;
    feelsLike: {
      sunFeel: number;
      shadeFeel: number;
      label: string;
      description: string;
    };
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

const periodGradients: Record<string, string> = {
  daytime: "from-[#fce4d6]/60 via-[#fdeef0]/40 to-[#fdf6e3]/30",
  night: "from-[#e0daf5]/50 via-[#dde8f0]/40 to-[#e8e0f0]/30",
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedPeriod, setExpandedPeriod] = useState<number>(0);
  const [locating, setLocating] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [lastSearchParams, setLastSearchParams] = useState("");

  const fetchData = useCallback(async (params: string, dayIndex?: number) => {
    setLoading(true);
    setError(null);
    const dayParam = dayIndex !== undefined ? `&day=${dayIndex}` : "";
    try {
      const res = await fetch(`/api/weather?${params}${dayParam}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch");
      }
      const data = await res.json();
      setResult(data);
      setExpandedPeriod(0);
      setSelectedDay(data.selectedDay || 0);
      // Save search params for day switching
      if (!dayParam) setLastSearchParams(params);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDaySelect = (dayIndex: number) => {
    if (!lastSearchParams || dayIndex === selectedDay) return;
    setSelectedDay(dayIndex);
    fetchData(lastSearchParams, dayIndex);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSelectedDay(0);
    fetchData(`q=${encodeURIComponent(query.trim())}`);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        fetchData(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location");
      }
    );
  };

  return (
    <main className="flex-1 w-full max-w-[440px] mx-auto px-4 pt-10 pb-16 overflow-x-hidden">
      {/* Header */}
      <h1 className="font-[var(--font-serif)] text-[28px] text-[#1a1a1a] tracking-tight">
        WeatherWear
      </h1>
      <p className="text-[13px] text-[#999] mt-1 mb-8">
        What to wear, based on how it actually feels.
      </p>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search a city..."
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

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-[#fff0f0] text-[#c44] text-[13px] p-4 mb-5">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <PulseOrb />}

      {/* Results */}
      {result && !loading && (() => {
        const dayData = result.weather.daily[selectedDay] || result.weather.daily[0];
        return (
        <div className="space-y-4">
          {/* Day nav */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              {selectedDay > 0 && (
                <button
                  onClick={() => handleDaySelect(selectedDay - 1)}
                  className="text-[#bbb] hover:text-[#888] transition-colors text-[13px]"
                >
                  ←
                </button>
              )}
              <p className="text-[13px] text-[#666] font-medium">
                {(() => {
                  if (selectedDay === 0) return "Today";
                  if (selectedDay === 1) return "Tomorrow";
                  const d = new Date(dayData.date + "T12:00:00");
                  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
                })()}
              </p>
              {selectedDay < result.weather.daily.length - 1 && (
                <button
                  onClick={() => handleDaySelect(selectedDay + 1)}
                  className="text-[#bbb] hover:text-[#888] transition-colors text-[13px]"
                >
                  →
                </button>
              )}
            </div>
          </div>

          {/* Hero */}
          <div className="rounded-3xl bg-gradient-to-br from-[#fce4d6]/50 via-[#fdeef0]/40 to-[#e8dff5]/30 p-5 backdrop-blur-sm border border-white/60">
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-[11px] uppercase tracking-[0.15em] text-[#999] truncate min-w-0">
                {result.weather.location}
              </p>
              <span className="text-[11px] tracking-[0.12em] uppercase text-[#888] bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap">
                {result.outfit.vibe}
              </span>
            </div>
            <p className="font-[var(--font-serif)] text-[22px] text-[#1a1a1a] leading-snug">
              {result.outfit.headline}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            <StatPill
              label="Range"
              value={`${Math.round(dayData.tempMin)}–${Math.round(dayData.tempMax)}°`}
            />
            <StatPill
              label="UV"
              value={`${dayData.uvIndexMax}`}
            />
            <StatPill
              label="Wind"
              value={`${Math.round(result.weather.current.windSpeed)}mph`}
            />
            <StatPill
              label="Rain"
              value={`${dayData.precipitationProbability}%`}
            />
          </div>

          {/* Period cards */}
          {result.outfit.periods.map((period, i) => {
            const weatherPeriod = result.periods[i];
            const isExpanded = expandedPeriod === i;
            const gradient =
              periodGradients[period.period.toLowerCase()] ||
              periodGradients.daytime;

            return (
              <div
                key={period.period}
                className={`rounded-3xl border border-white/60 overflow-hidden transition-all duration-300 ${
                  isExpanded ? "bg-white/80" : "bg-white/50"
                } backdrop-blur-sm`}
              >
                <button
                  onClick={() => setExpandedPeriod(isExpanded ? -1 : i)}
                  className="w-full text-left"
                >
                  <div
                    className={`bg-gradient-to-br ${gradient} p-4 transition-all`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.15em] text-[#999] mb-0.5">
                          {period.period}
                        </p>
                        <p className="text-[12px] text-[#aaa]">
                          {period.timeRange}
                        </p>
                      </div>
                      <div className="text-right">
                        {period.period.toLowerCase() === "night" ? (
                          <>
                            <span className="font-[var(--font-serif)] text-[36px] leading-none text-[#1a1a1a]">
                              {period.shadeFeel}°
                            </span>
                            {weatherPeriod && weatherPeriod.windSpeed > 5 && (
                              <p className="text-[11px] text-[#aaa] mt-1">
                                with wind chill
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="font-[var(--font-serif)] text-[36px] leading-none text-[#1a1a1a]">
                              {period.sunFeel}°
                            </span>
                            <p className="text-[11px] text-[#aaa] mt-1">
                              {period.shadeFeel}° in shade
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    {weatherPeriod && weatherPeriod.precipChance > 30 && (
                      <p className="text-[11px] text-[#b08888] mt-2">
                        {weatherPeriod.precipChance}% chance of rain
                      </p>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-4 space-y-4">
                    <p className="text-[13px] text-[#888] italic leading-relaxed">
                      {period.summary}
                    </p>

                    <div className="space-y-3">
                      <OutfitItem label="Top" value={period.top} />
                      {period.outerwear && (
                        <OutfitItem label="Layer" value={period.outerwear} />
                      )}
                      <OutfitItem label="Bottom" value={period.bottom} />
                      <OutfitItem label="Shoes" value={period.shoes} />
                    </div>

                    {period.accessories.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[#aaa] mb-2">
                          Accessories
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {period.accessories.map((acc, j) => (
                            <span
                              key={j}
                              className="text-[11px] text-[#777] bg-[#f5f2ef] px-2.5 py-1 rounded-full"
                            >
                              {acc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl bg-[#f8f6f3] p-3.5">
                      <p className="text-[11px] text-[#999] leading-relaxed">
                        {period.materialNote}
                      </p>
                    </div>

                  </div>
                )}
              </div>
            );
          })}

          {/* All-day essentials — after outfits */}
          {result.outfit.allDayEssentials.length > 0 && (
            <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-[#eae6e2] p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#aaa] mb-2.5">
                Carry all day
              </p>
              <div className="flex flex-wrap gap-2">
                {result.outfit.allDayEssentials.map((item, i) => (
                  <span
                    key={i}
                    className="text-[12px] text-[#666] bg-[#f5f2ef] px-3 py-1.5 rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="text-center mt-24">
          <p className="font-[var(--font-serif)] text-[40px] text-[#ddd]">
            ?
          </p>
          <p className="text-[13px] text-[#bbb] mt-2">
            Search a city to see what to wear
          </p>
        </div>
      )}
    </main>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2.5 rounded-2xl bg-white/60 backdrop-blur-sm border border-[#eae6e2] min-w-0 overflow-hidden">
      <span className="text-[13px] font-medium text-[#1a1a1a] truncate">{value}</span>
      <span className="text-[8px] uppercase tracking-[0.12em] text-[#bbb]">
        {label}
      </span>
    </div>
  );
}

function OutfitItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-[#bbb] mb-0.5">
        {label}
      </p>
      <p className="text-[13px] text-[#444] leading-relaxed">{value}</p>
    </div>
  );
}
