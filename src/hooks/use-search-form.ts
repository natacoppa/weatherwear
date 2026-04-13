"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Mode } from "@/lib/types";

export interface SearchFormState {
  mode: Mode;
  query: string;
  selectedCreator: string;
  tripStart: string;
  tripEnd: string;
  editingSearch: boolean;
}

export interface SearchFormHandlers {
  onModeChange: (m: Mode) => void;
  onQueryChange: (q: string) => void;
  onCreatorChange: (u: string) => void;
  onTripStartChange: (d: string) => void;
  onTripEndChange: (d: string) => void;
  onEdit: () => void;
  onSubmit: (e: React.FormEvent) => void;
  /**
   * Programmatically submit a search — updates the query field then fires
   * the configured onSubmit. Passes `q` directly to the submit payload,
   * so callers don't need to wait for setQuery to commit.
   */
  submitWith: (query: string) => void;
}

interface Options {
  onSubmit: (state: SearchFormState) => void;
  onModeChange?: (next: Mode) => void;
  onCreatorChange?: (next: string) => void;
}

const todayIso = () => new Date().toISOString().split("T")[0];
const defaultEndIso = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split("T")[0];
};

export function useSearchForm(opts: Options): {
  state: SearchFormState;
  handlers: SearchFormHandlers;
} {
  const [mode, setMode] = useState<Mode>("today");
  const [query, setQuery] = useState("");
  const [selectedCreator, setSelectedCreator] = useState("");
  const [tripStart, setTripStart] = useState(todayIso);
  const [tripEnd, setTripEnd] = useState(defaultEndIso);
  const [editingSearch, setEditingSearch] = useState(false);

  // Stash latest opts in a ref so the returned handlers stay referentially
  // stable (callers typically pass a fresh inline options object every
  // render). Handlers read `optsRef.current.*` instead of closing over opts.
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  });

  // Same treatment for state read inside submitWith / dispatchSearch —
  // keep a ref so we don't need those state values in the callback deps
  // and callbacks remain stable across renders. Sync in an effect so we
  // don't touch refs during render (React's lint rule).
  const stateRef = useRef<SearchFormState>({
    mode,
    query,
    selectedCreator,
    tripStart,
    tripEnd,
    editingSearch,
  });
  useEffect(() => {
    stateRef.current = { mode, query, selectedCreator, tripStart, tripEnd, editingSearch };
  });

  const onModeChange = useCallback((m: Mode) => {
    setMode(m);
    optsRef.current.onModeChange?.(m);
  }, []);

  const onCreatorChange = useCallback((u: string) => {
    setSelectedCreator(u);
    optsRef.current.onCreatorChange?.(u);
  }, []);

  const onTripStartChange = useCallback((d: string) => {
    setTripStart(d);
    // Keep range valid if new start is past current end.
    setTripEnd((prev) => (d > prev ? d : prev));
  }, []);

  const dispatchSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const s = stateRef.current;
    optsRef.current.onSubmit({
      mode: s.mode,
      query: trimmed,
      selectedCreator: s.selectedCreator,
      tripStart: s.tripStart,
      tripEnd: s.tripEnd,
      editingSearch: s.editingSearch,
    });
    setEditingSearch(false);
  }, []);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      dispatchSearch(stateRef.current.query);
    },
    [dispatchSearch],
  );

  const submitWith = useCallback(
    (q: string) => {
      setQuery(q);
      dispatchSearch(q);
    },
    [dispatchSearch],
  );

  const onEdit = useCallback(() => setEditingSearch(true), []);

  return {
    state: { mode, query, selectedCreator, tripStart, tripEnd, editingSearch },
    handlers: {
      onModeChange,
      onQueryChange: setQuery,
      onCreatorChange,
      onTripStartChange,
      onTripEndChange: setTripEnd,
      onEdit,
      onSubmit,
      submitWith,
    },
  };
}
