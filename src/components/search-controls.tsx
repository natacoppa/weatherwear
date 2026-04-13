"use client";

import type { CreatorInfo, Mode } from "@/lib/types";

const TODAY_ISO = () => new Date().toISOString().split("T")[0];

function CollapsedSummary({
  query,
  mode,
  location,
  dateRange,
  creatorName,
  onEdit,
}: {
  query: string;
  mode: Mode;
  location?: string;
  dateRange?: string;
  creatorName?: string;
  onEdit: () => void;
}) {
  return (
    <div className="mb-6 md:mb-10 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-baseline gap-2 flex-wrap text-[14px] text-foreground">
        <span className="font-medium">{query || (location || "").split(",")[0]}</span>
        {dateRange && (
          <>
            <span className="text-rule-dashed">·</span>
            <span className="text-muted-foreground">{dateRange}</span>
          </>
        )}
        <span className="text-rule-dashed">·</span>
        <span className="text-muted-foreground">
          {mode === "today" ? "Today" : "Trip"}
          {creatorName && <span> · styled by {creatorName}</span>}
        </span>
      </div>
      <button
        onClick={onEdit}
        className="text-[13px] text-foreground bg-primary/[0.06] hover:bg-primary/[0.1] px-4 py-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Edit
      </button>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="flex gap-1 p-1 rounded-full bg-muted w-fit" role="tablist" aria-label="Search mode">
      {(["today", "trip"] as Mode[]).map((m) => (
        <button
          key={m}
          role="tab"
          aria-selected={mode === m}
          onClick={() => onChange(m)}
          className={`px-5 py-1.5 rounded-full text-[12px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            mode === m ? "bg-primary text-primary-foreground shadow-sm" : "text-ink-soft hover:text-ink-subtle"
          }`}
        >
          {m === "today" ? "Today" : "Trip"}
        </button>
      ))}
    </div>
  );
}

function CreatorPicker({
  creators,
  selected,
  onChange,
}: {
  creators: CreatorInfo[];
  selected: string;
  onChange: (username: string) => void;
}) {
  const selectedName = creators.find((c) => c.username === selected)?.name;
  const label = selectedName ? `Styled by ${selectedName}` : "Styled by anyone";
  return (
    <div className="relative inline-flex items-center">
      <div
        className={`flex items-center gap-1.5 h-9 px-4 rounded-full pointer-events-none transition-colors ${
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        }`}
      >
        <span className="text-[12px] font-medium">{label}</span>
        <span className={`text-[10px] ${selected ? "text-primary-foreground/60" : "text-ink-soft"}`} aria-hidden="true">
          ▾
        </span>
      </div>
      <label className="absolute inset-0 cursor-pointer">
        <span className="sr-only">Style by creator</span>
        <select
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Style by creator"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        >
          <option value="">Anyone</option>
          {creators.map((c) => (
            <option key={c.username} value={c.username}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function SearchControls({
  collapsed,
  mode,
  query,
  selectedCreator,
  creators,
  loading,
  tripStart,
  tripEnd,
  resultLocation,
  tripDateRange,
  onModeChange,
  onQueryChange,
  onCreatorChange,
  onTripStartChange,
  onTripEndChange,
  onSubmit,
  onEdit,
}: {
  collapsed: boolean;
  mode: Mode;
  query: string;
  selectedCreator: string;
  creators: CreatorInfo[];
  loading: boolean;
  tripStart: string;
  tripEnd: string;
  resultLocation?: string;
  tripDateRange?: string;
  onModeChange: (m: Mode) => void;
  onQueryChange: (q: string) => void;
  onCreatorChange: (u: string) => void;
  onTripStartChange: (d: string) => void;
  onTripEndChange: (d: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onEdit: () => void;
}) {
  const selectedName = creators.find((c) => c.username === selectedCreator)?.name;

  if (collapsed) {
    return (
      <CollapsedSummary
        query={query}
        mode={mode}
        location={resultLocation}
        dateRange={mode === "trip" ? tripDateRange : undefined}
        creatorName={selectedName}
        onEdit={onEdit}
      />
    );
  }

  const placeholder = selectedCreator
    ? `City to style with ${selectedName || ""}...`
    : mode === "today"
      ? "Enter a city..."
      : "Where are you going?";

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <ModeToggle mode={mode} onChange={onModeChange} />
        <CreatorPicker creators={creators} selected={selectedCreator} onChange={onCreatorChange} />
      </div>

      <form onSubmit={onSubmit} className="mb-3">
        <div className="flex items-center gap-2">
          <label className="flex-1 min-w-0">
            <span className="sr-only">City</span>
            <input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-full h-12 px-5 rounded-full bg-popover border border-input text-[15px] text-foreground placeholder:text-ink-whisper outline-none focus:border-clay focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            />
          </label>
          {mode === "trip" && (
            <div className="hidden md:flex items-center gap-1 h-12 px-4 rounded-full bg-popover border border-input text-[13px] text-foreground">
              <input
                type="date"
                aria-label="Trip start date"
                value={tripStart}
                onChange={(e) => {
                  onTripStartChange(e.target.value);
                  if (e.target.value > tripEnd) onTripEndChange(e.target.value);
                }}
                min={TODAY_ISO()}
                className="bg-transparent outline-none border-0 text-[13px] text-foreground cursor-pointer"
              />
              <span className="text-rule-dashed">—</span>
              <input
                type="date"
                aria-label="Trip end date"
                value={tripEnd}
                onChange={(e) => onTripEndChange(e.target.value)}
                min={tripStart}
                className="bg-transparent outline-none border-0 text-[13px] text-foreground cursor-pointer"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="h-12 px-6 rounded-full bg-primary text-primary-foreground text-[14px] font-medium disabled:opacity-30 hover:bg-primary-hover transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {mode === "today" ? "Go" : "Pack"}
          </button>
        </div>
      </form>

      {mode === "trip" && (
        <div className="md:hidden flex items-center gap-2 mb-3 px-1">
          <input
            type="date"
            aria-label="Trip start date"
            value={tripStart}
            onChange={(e) => {
              onTripStartChange(e.target.value);
              if (e.target.value > tripEnd) onTripEndChange(e.target.value);
            }}
            min={TODAY_ISO()}
            className="flex-1 min-w-0 h-10 px-3 rounded-full bg-popover border border-input text-[13px] text-foreground outline-none"
          />
          <span className="text-rule-dashed text-[13px]">—</span>
          <input
            type="date"
            aria-label="Trip end date"
            value={tripEnd}
            onChange={(e) => onTripEndChange(e.target.value)}
            min={tripStart}
            className="flex-1 min-w-0 h-10 px-3 rounded-full bg-popover border border-input text-[13px] text-foreground outline-none"
          />
        </div>
      )}

      <div className="mb-4" />
    </>
  );
}
