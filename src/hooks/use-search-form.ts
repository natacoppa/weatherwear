"use client";

import { useCallback, useState } from "react";
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
   * the configured onSubmit. Used by recents / sample-city pills.
   */
  submitWith: (query: string) => void;
}

interface Options {
  // Called after a valid submit with the current state. AppPage uses this
  // to dispatch the right fetch (today / trip / creator) and record a recent.
  onSubmit: (state: SearchFormState) => void;
  // Called when the user changes mode. AppPage uses this to abort in-flight
  // primary fetches and clear opposite-mode result state.
  onModeChange?: (next: Mode) => void;
  // Called when the creator selection changes. AppPage uses this to abort
  // primary fetches and drop stale creator result.
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

  const onModeChange = useCallback(
    (m: Mode) => {
      setMode(m);
      opts.onModeChange?.(m);
    },
    [opts],
  );

  const onCreatorChange = useCallback(
    (u: string) => {
      setSelectedCreator(u);
      opts.onCreatorChange?.(u);
    },
    [opts],
  );

  const onTripStartChange = useCallback((d: string) => {
    setTripStart(d);
    // If the new start is after the end, push end forward so the range stays valid.
    setTripEnd((prev) => (d > prev ? d : prev));
  }, []);

  const dispatchSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      opts.onSubmit({
        mode,
        query: trimmed,
        selectedCreator,
        tripStart,
        tripEnd,
        editingSearch,
      });
      setEditingSearch(false);
    },
    [editingSearch, mode, opts, selectedCreator, tripEnd, tripStart],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      dispatchSearch(query);
    },
    [dispatchSearch, query],
  );

  const submitWith = useCallback(
    (q: string) => {
      setQuery(q);
      dispatchSearch(q);
    },
    [dispatchSearch],
  );

  return {
    state: { mode, query, selectedCreator, tripStart, tripEnd, editingSearch },
    handlers: {
      onModeChange,
      onQueryChange: setQuery,
      onCreatorChange,
      onTripStartChange,
      onTripEndChange: setTripEnd,
      onEdit: () => setEditingSearch(true),
      onSubmit,
      submitWith,
    },
  };
}
