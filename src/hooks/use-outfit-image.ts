"use client";

import { useEffect, useReducer, useState } from "react";
import type { TodayResult } from "@/lib/types";

// Session-scoped cache — survives DayCard prop changes so navigating
// forward/back through days doesn't refetch. Keyed on
// `location|date|headline` so edits to the same day's outfit invalidate.
const cache = new Map<string, string>();

function cacheKey(r: TodayResult) {
  return `${r.location}|${r.day.date}|${r.outfit.headline}`;
}

interface State {
  image: string | null;
  loading: boolean;
}

export function useOutfitImage(result: TodayResult): State {
  const key = cacheKey(result);

  // setState-in-render pattern: reset loading when the target key changes,
  // before committing any effect. Avoids an extra render + the
  // set-state-in-effect lint warning.
  const [lastKey, setLastKey] = useState(key);
  const [loading, setLoading] = useState(() => !cache.has(key));
  // `version` is bumped after a successful fetch so subscribers re-render
  // and pick up the new cache entry.
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);

  if (lastKey !== key) {
    setLastKey(key);
    setLoading(!cache.has(key));
  }

  useEffect(() => {
    if (cache.has(key)) return;
    const ctrl = new AbortController();
    fetch("/api/outfit-image", {
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
        if (image) cache.set(key, image);
        setLoading(false);
        forceUpdate();
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (process.env.NODE_ENV === "development") {
          console.warn("outfit-image fetch failed", e);
        }
        setLoading(false);
      });
    return () => ctrl.abort();
    // result fields are read synchronously in the body above; key is the
    // stable discriminant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { image: cache.get(key) ?? null, loading };
}
