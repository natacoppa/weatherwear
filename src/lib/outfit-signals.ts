export interface PromptMomentWeather {
  label: string;
  timeRange: string;
  temp: number;
  sunFeel: number;
  shadeFeel: number;
  windSpeed: number;
  uvIndex: number;
  precipChance: number;
  humidity?: number;
}

export interface PromptDaySummary {
  tempMin: number;
  tempMax: number;
}

export type TransitionIntensity = "stable" | "moderate" | "significant";
export type PeakHeatLevel = "mild" | "warm" | "hot" | "extreme";
export type ColdFloorLevel = "warm" | "cool" | "cold" | "severe";
export type HumidityBurden = "low" | "medium" | "high";
export type SunExposure = "soft" | "strong" | "brutal";
export type WalkingLoad = "low" | "medium" | "high";
export type CarryTolerance = "low" | "medium" | "high";
export type StyleContext = "polished_urban" | "relaxed_coastal" | "fashion_forward_city" | "low_key_practical";

export interface TransitionAssessment {
  intensity: TransitionIntensity;
  summary: string;
  promptGuidance: string;
}

export interface OutfitSignalBrief {
  peakHeat: PeakHeatLevel;
  coldFloor: ColdFloorLevel;
  humidityBurden: HumidityBurden;
  sunExposure: SunExposure;
  walkingLoad: WalkingLoad;
  carryTolerance: CarryTolerance;
  styleContext: StyleContext;
  transition: TransitionAssessment;
  overrides: {
    extremeHeat: boolean;
    extremeCold: boolean;
    footwear: boolean;
  };
}

function cityName(locationName: string): string {
  return locationName.split(",")[0]?.trim() || locationName;
}

function resolvePeakHeat(moments: PromptMomentWeather[]): PeakHeatLevel {
  const peak = Math.max(...moments.map((moment) => Math.max(moment.sunFeel, moment.shadeFeel)));
  if (peak >= 95) return "extreme";
  if (peak >= 85) return "hot";
  if (peak >= 72) return "warm";
  return "mild";
}

function resolveColdFloor(moments: PromptMomentWeather[]): ColdFloorLevel {
  const floor = Math.min(...moments.map((moment) => moment.shadeFeel));
  if (floor < 35) return "severe";
  if (floor < 50) return "cold";
  if (floor < 65) return "cool";
  return "warm";
}

function resolveHumidityBurden(moments: PromptMomentWeather[]): HumidityBurden {
  const high = moments.some((moment) =>
    ((moment.humidity ?? 0) >= 60 && moment.temp >= 80) || moment.shadeFeel >= 85,
  );
  if (high) return "high";
  const medium = moments.some((moment) => (moment.humidity ?? 0) >= 50);
  return medium ? "medium" : "low";
}

function resolveSunExposure(moments: PromptMomentWeather[]): SunExposure {
  const peakUv = Math.max(...moments.map((moment) => moment.uvIndex));
  if (peakUv >= 8) return "brutal";
  if (peakUv >= 5) return "strong";
  return "soft";
}

function resolveWalkingLoad(locationName: string): WalkingLoad {
  const city = cityName(locationName).toLowerCase();
  const highWalkCities = new Set([
    "new york",
    "paris",
    "london",
    "tokyo",
    "chicago",
  ]);

  return highWalkCities.has(city) ? "high" : "medium";
}

function resolveStyleContext(locationName: string): StyleContext {
  const city = cityName(locationName).toLowerCase();
  if (city === "new york" || city === "paris" || city === "london") return "polished_urban";
  if (city === "tokyo") return "fashion_forward_city";
  if (city === "los angeles" || city === "miami" || city === "san francisco") return "relaxed_coastal";
  return "low_key_practical";
}

function resolveCarryTolerance(input: {
  walkingLoad: WalkingLoad;
  peakHeat: PeakHeatLevel;
  humidityBurden: HumidityBurden;
  transition: TransitionAssessment;
}): CarryTolerance {
  if (input.walkingLoad === "high" && (input.peakHeat === "hot" || input.peakHeat === "extreme")) {
    return "low";
  }
  if (input.humidityBurden === "low" && input.transition.intensity !== "stable") {
    return "high";
  }
  return "medium";
}

export function buildOutfitSignalBrief(input: {
  locationName: string;
  moments: PromptMomentWeather[];
  transition: TransitionAssessment;
}): OutfitSignalBrief {
  const peakHeat = resolvePeakHeat(input.moments);
  const coldFloor = resolveColdFloor(input.moments);
  const humidityBurden = resolveHumidityBurden(input.moments);
  const sunExposure = resolveSunExposure(input.moments);
  const walkingLoad = resolveWalkingLoad(input.locationName);
  const styleContext = resolveStyleContext(input.locationName);
  const carryTolerance = resolveCarryTolerance({
    walkingLoad,
    peakHeat,
    humidityBurden,
    transition: input.transition,
  });

  return {
    peakHeat,
    coldFloor,
    humidityBurden,
    sunExposure,
    walkingLoad,
    carryTolerance,
    styleContext,
    transition: input.transition,
    overrides: {
      extremeHeat: peakHeat === "extreme",
      extremeCold: coldFloor === "severe",
      footwear: walkingLoad === "high",
    },
  };
}
