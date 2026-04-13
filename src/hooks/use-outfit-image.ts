"use client";

import { useEffect, useState } from "react";
import type { TodayResult } from "@/lib/types";
import { apiFetch } from "@/lib/api-fetch";

// Session-scoped cache — survives DayCard prop changes so navigating
// forward/back through days doesn't refetch. Keyed on
// `location|date|headline` so edits to the same day's outfit invalidate.
// Unbounded for session lifetime. Acceptable for this product's action
// volume; if usage patterns change, cap via LRU.
const cache = new Map<string, string | null>();

function cacheKey(r: TodayResult) {
  return `${r.location}|${r.day.date}|${r.outfit.headline}`;
}

/**
 * Returns the generated outfit image for a result, fetching on cache miss.
 * `loading` is derived from "has this key been resolved yet?" — no redundant
 * useState for the flag.
 */
export function useOutfitImage(result: TodayResult): {
  image: string | null;
  loading: boolean;
} {
  const key = cacheKey(result);
  // `tick` is bumped after a fetch resolves so consumers re-render and
  // pick up the new cache entry. Initial value doesn't matter.
  const [, tick] = useState(0);

  useEffect(() => {
    if (cache.has(key)) return;
    const ctrl = new AbortController();
    apiFetch("/api/outfit-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outfit: result.outfit,
        location: result.location,
        temp: (result.day.tempMin + result.day.tempMax) / 2,
      }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { image?: string };
        return data.image ?? null;
      })
      .then((image) => {
        if (ctrl.signal.aborted) return;
        // Store null on "finished but no image" so future renders see
        // `loading=false` instead of refetching forever.
        cache.set(key, image);
        tick((n) => n + 1);
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (process.env.NODE_ENV === "development") {
          console.warn("outfit-image fetch failed", e);
        }
        cache.set(key, null);
        tick((n) => n + 1);
      });
    return () => ctrl.abort();
    // result fields are read synchronously in the body above; key is the
    // stable discriminant of everything that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return {
    image: cache.get(key) ?? null,
    loading: !cache.has(key),
  };
}
