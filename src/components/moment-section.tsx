// Morning / Midday / Evening section inside DayCard.
// Large-type header variant (no timeline dots — those live in CreatorCard).
export function MomentSection({
  label,
  timeRange,
  temp,
  tempSub,
  summary,
  children,
}: {
  label: string;
  timeRange: string;
  temp?: string;
  tempSub?: string;
  summary?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-6 md:py-7">
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-4">
          <h3 className="font-[var(--font-serif)] text-[22px] md:text-[26px] text-foreground leading-none">{label}</h3>
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-soft">{timeRange}</p>
        </div>
        {temp && (
          <div className="text-right">
            <span className="font-[var(--font-serif)] text-[32px] md:text-[38px] leading-none text-foreground">{temp}</span>
            {tempSub && <p className="text-[10px] text-ink-faint mt-1">{tempSub}</p>}
          </div>
        )}
      </div>
      {summary && <p className="text-[14px] text-muted-foreground leading-relaxed mb-5 italic">{summary}</p>}
      {children}
    </div>
  );
}
