import { safeHref } from "@/lib/safe-href";
import type { CreatorOutfit, CreatorOutfitItem } from "@/lib/types";
import { OutfitCollage } from "./outfit-collage";
import { Scallop } from "./scallop";

function CreatorProductLink({ item, label }: { item: CreatorOutfitItem | null; label: string }) {
  if (!item) return null;
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.15em] text-ink-faint mb-0.5">{label}</p>
      <a
        href={safeHref(item.url)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[13px] text-ink-subtle leading-relaxed underline decoration-rule-dashed underline-offset-2 hover:decoration-olive transition-colors"
      >
        {item.title}{" "}
        <span className="text-[11px] text-ink-faint no-underline">
          — {item.brand}
          {item.price ? ` $${item.price}` : ""}
        </span>{" "}
        <span className="text-[10px] text-ink-whisper no-underline">↗</span>
      </a>
    </div>
  );
}

// Timeline-dot moment block — only used inside CreatorCard.
function CreatorMoment({
  kicker,
  timeRange,
  temp,
  tempSub,
  summary,
  dotColor,
  showConnector = true,
  children,
}: {
  kicker: string;
  timeRange: string;
  temp?: React.ReactNode;
  tempSub?: React.ReactNode;
  summary: string;
  dotColor: "gold" | "oat" | "slate";
  showConnector?: boolean;
  children: React.ReactNode;
}) {
  const dotClass = { gold: "border-gold", oat: "border-oat", slate: "border-slate" }[dotColor];
  return (
    <div className="relative pl-6 pb-5">
      {showConnector && <div className="absolute left-[7px] top-[10px] bottom-0 w-px border-l border-dashed border-rule-dashed" />}
      <div className={`absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full border-2 ${dotClass} bg-card`} />
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-olive font-medium">{kicker}</p>
          <p className="text-[11px] text-ink-faint">{timeRange}</p>
        </div>
        {temp && (
          <div className="text-right">
            {temp}
            {tempSub}
          </div>
        )}
      </div>
      <p className="text-[12px] text-ink-soft italic mb-3">{summary}</p>
      {children}
    </div>
  );
}

export function CreatorCard({ result }: { result: CreatorOutfit }) {
  const o = result.outfit;
  const feelsLow =
    result.moments.length > 0 ? Math.min(...result.moments.map((m) => m.shadeFeel)) : Math.round(result.day.tempMin);
  const feelsHigh =
    result.moments.length > 0 ? Math.max(...result.moments.map((m) => m.sunFeel)) : Math.round(result.day.tempMax);

  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-card border border-border overflow-hidden">
        <div className="p-5 pb-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink-soft mb-1">Styled by @{result.creator}</p>
          <p className="text-[10px] text-ink-faint mb-3">{result.location}</p>
          <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-snug">{o.headline}</p>
          <div className="flex gap-5 mt-4">
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-ink-soft">Feels like</p>
              <p className="text-[13px] font-medium text-foreground">{feelsLow}–{feelsHigh}°</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-ink-soft">UV</p>
              <p className="text-[13px] font-medium text-foreground">{result.day.uvIndexMax}</p>
            </div>
            {result.day.precipitationProbability > 20 && (
              <div>
                <p className="text-[9px] uppercase tracking-[0.15em] text-ink-soft">Rain</p>
                <p className="text-[13px] font-medium text-foreground">{result.day.precipitationProbability}%</p>
              </div>
            )}
          </div>
        </div>

        <Scallop />

        <div className="px-5 pt-4 pb-2">
          {/* Walk out */}
          <CreatorMoment
            kicker="Walk out the door"
            timeRange={result.moments[0]?.timeRange || "7–9am"}
            summary={o.walkOut.summary}
            dotColor="gold"
            temp={
              result.moments[0] && (
                <span className="font-[var(--font-serif)] text-[28px] leading-none text-foreground">
                  {result.moments[0].sunFeel}°
                </span>
              )
            }
            tempSub={result.moments[0] && <p className="text-[10px] text-ink-faint">{result.moments[0].shadeFeel}° shade</p>}
          >
            <div className="space-y-2">
              <CreatorProductLink item={o.walkOut.top} label="Top" />
              {o.walkOut.layer && <CreatorProductLink item={o.walkOut.layer} label="Layer" />}
              <CreatorProductLink item={o.walkOut.bottom} label="Bottom" />
              <CreatorProductLink item={o.walkOut.shoes} label="Shoes" />
            </div>
            {o.walkOut.accessories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {o.walkOut.accessories.map((a, j) => (
                  <a
                    key={j}
                    href={safeHref(a.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-olive bg-olive/10 px-2 py-0.5 rounded-full hover:bg-olive/20 transition-colors"
                  >
                    {a.title} ↗
                  </a>
                ))}
              </div>
            )}
          </CreatorMoment>

          {/* Midday */}
          <CreatorMoment
            kicker="Midday shift"
            timeRange={result.moments[1]?.timeRange || "11am–3pm"}
            summary={o.carry.summary}
            dotColor="oat"
            temp={
              result.moments[1] && (
                <span className="font-[var(--font-serif)] text-[28px] leading-none text-foreground">
                  {result.moments[1].sunFeel}°
                </span>
              )
            }
            tempSub={result.moments[1] && <p className="text-[10px] text-ink-faint">{result.moments[1].shadeFeel}° shade</p>}
          >
            {o.carry.remove.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] uppercase tracking-[0.15em] text-clay-warm mb-1">Take off</p>
                {o.carry.remove.map((item, j) => (
                  <p key={j} className="text-[13px] text-ink-subtle">{item}</p>
                ))}
              </div>
            )}
            {o.carry.add.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] uppercase tracking-[0.15em] text-olive mb-1">Put on</p>
                {o.carry.add.map((item, j) => (
                  <p key={j} className="text-[13px] text-ink-subtle">{item}</p>
                ))}
              </div>
            )}
            <p className="text-[11px] text-ink-faint">{o.carry.note}</p>
          </CreatorMoment>

          {/* Evening */}
          <CreatorMoment
            kicker="By evening"
            timeRange={result.moments[2]?.timeRange || "6–10pm"}
            summary={o.evening.summary}
            dotColor="slate"
            showConnector={false}
            temp={
              result.moments[2] && (
                <span className="font-[var(--font-serif)] text-[28px] leading-none text-foreground">
                  {result.moments[2].shadeFeel}°
                </span>
              )
            }
            tempSub={
              result.moments[2] && result.moments[2].windSpeed > 5 && (
                <p className="text-[10px] text-ink-faint">wind chill</p>
              )
            }
          >
            {o.evening.add.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] uppercase tracking-[0.15em] text-olive mb-1">Put back on</p>
                {o.evening.add.map((item, j) => (
                  <p key={j} className="text-[13px] text-ink-subtle">{item}</p>
                ))}
              </div>
            )}
            <p className="text-[11px] text-ink-faint">{o.evening.note}</p>
          </CreatorMoment>
        </div>

        {/* Bag */}
        {o.bagEssentials.length > 0 && (
          <>
            <div className="mx-5 border-t border-dashed border-rule-dashed" />
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-ink-soft mb-2">In your bag</p>
              <div className="flex flex-wrap gap-1.5">
                {o.bagEssentials.map((item, i) => (
                  <span key={i} className="text-[11px] text-ink-subtle bg-muted px-2.5 py-1 rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Outfit collage */}
        <div className="mx-5 border-t border-dashed border-rule-dashed" />
        <div className="p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink-soft mb-3">The look</p>
          <OutfitCollage items={[o.walkOut.top, o.walkOut.layer, o.walkOut.bottom, o.walkOut.shoes, ...o.walkOut.accessories]} />
        </div>
      </div>
    </div>
  );
}
