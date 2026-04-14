"use client";

import {
  appendRecentFamily,
  buildAnonymousVariationId,
  parseRecentFamilies,
  RECENT_FAMILIES_HEADER,
  serializeRecentFamilies,
  VARIATION_ID_HEADER,
  type DayOutfitFamily,
} from "@/lib/outfit-family";

const VARIATION_ID_STORAGE_KEY = "ww_day_variation_id";
const RECENT_FAMILIES_STORAGE_KEY = "ww_day_recent_families";

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures; requests can still proceed without persistence.
  }
}

export function getDayVariationId(): string {
  const stored = readStorage(VARIATION_ID_STORAGE_KEY)?.trim();
  if (stored) return stored;

  const generated = buildAnonymousVariationId();
  writeStorage(VARIATION_ID_STORAGE_KEY, generated);
  return generated;
}

export function getRecentDayFamilies(): DayOutfitFamily[] {
  return parseRecentFamilies(readStorage(RECENT_FAMILIES_STORAGE_KEY));
}

export function buildDayVariationHeaders(): Record<string, string> {
  const recentFamilies = getRecentDayFamilies();
  const headers: Record<string, string> = {
    [VARIATION_ID_HEADER]: getDayVariationId(),
  };

  if (recentFamilies.length > 0) {
    headers[RECENT_FAMILIES_HEADER] = serializeRecentFamilies(recentFamilies);
  }

  return headers;
}

export function rememberDayOutfitFamily(family: DayOutfitFamily) {
  const next = appendRecentFamily(getRecentDayFamilies(), family);
  writeStorage(RECENT_FAMILIES_STORAGE_KEY, serializeRecentFamilies(next));
}
