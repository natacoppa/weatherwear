// Shared types for outfit / trip / creator responses.
// Mirror the API route shapes in src/app/api/*.

import type { CreatorCoverage, CreatorSource } from "@/lib/creator-catalog";

export interface DayOutfit {
  headline: string;
  walkOut: {
    summary: string;
    top: string;
    layer: string | null;
    bottom: string;
    shoes: string;
    accessories: string[];
  };
  carry: { summary: string; add: string[]; remove: string[]; note: string };
  evening: { summary: string; add: string[]; note: string };
  bagEssentials: string[];
}

export interface Moment {
  label: string;
  timeRange: string;
  temp: number;
  sunFeel: number;
  shadeFeel: number;
  windSpeed: number;
  uvIndex: number;
  precipChance: number;
}

export interface DaySummary {
  date: string;
  tempMax: number;
  tempMin: number;
  uvIndexMax: number;
  precipitationProbability: number;
}

export interface TodayResult {
  location: string;
  day: DaySummary;
  dayIndex: number;
  totalDays: number;
  moments: Moment[];
  outfit: DayOutfit;
}

export interface TripDay {
  dayName: string;
  date: string;
  tempRange: string;
  precipChance: number;
}

export interface TripResult {
  location: string;
  isHistorical?: boolean;
  days: TripDay[];
  packingList: {
    headline: string;
    weatherSummary: string;
    categories: { name: string; items: string[] }[];
    skipList: string[];
    proTip: string;
  };
}

export interface CreatorInfo {
  username: string;
  name: string;
  image: string | null;
  productCount: number;
  topBrands: string[];
  sources?: CreatorSource[];
  incomplete?: boolean;
  coverage?: CreatorCoverage;
}

export interface CreatorOutfitItem {
  index: number;
  title: string;
  image: string;
  url: string | null;
  price: number | null;
  brand: string;
  category?: string;
  canonicalCategory?: string;
}

export interface CreatorOutfit {
  location: string;
  creator: string;
  catalogSize: number;
  incompleteCatalog?: boolean;
  coverage?: CreatorCoverage;
  catalogUpdatedAt?: string;
  day: DaySummary;
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

export type Mode = "today" | "trip";
