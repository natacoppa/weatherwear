"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "ww_recents";
const MAX = 5;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function useRecents() {
  // Start empty to match the server render, then hydrate from localStorage
  // on mount. The initial setRecents in the effect is the documented Next.js
  // pattern for SSR-safe localStorage access.
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    const stored = read();
    // Documented Next.js/React pattern: hydrate client-only state after mount
    // to avoid SSR/client mismatch. The "cascading render" here is intentional
    // and one-shot — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored.length > 0) setRecents(stored);
  }, []);

  const add = useCallback((city: string) => {
    const next = [city, ...read().filter((r) => r.toLowerCase() !== city.toLowerCase())].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    setRecents(next);
  }, []);

  return { recents, add };
}
