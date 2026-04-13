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
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    setRecents(read());
  }, []);

  const add = useCallback((city: string) => {
    const next = [city, ...read().filter((r) => r.toLowerCase() !== city.toLowerCase())].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    setRecents(next);
  }, []);

  return { recents, add };
}
