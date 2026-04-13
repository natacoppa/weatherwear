import type { CreatorOutfit, CreatorOutfitItem } from "@/lib/types";
import { safeHref } from "@/lib/safe-href";
import { MomentSection } from "./moment-section";
import { OutfitCollage } from "./outfit-collage";

// Row of a labeled creator product. Mirrors DayCard's OutfitRow visually —
// same label + link style — but the link includes brand/price metadata and
// opens the real ShopMy affiliate URL.
function CreatorRow({ label, item }: { label: string; item: CreatorOutfitItem | null }) {
  if (!item) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1.5">{label}</p>
      <a
        href={safeHref(item.url)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[14px] text-foreground leading-snug hover:text-clay transition-colors"
      >
        {item.title}{" "}
        <span className="text-[11px] text-ink-faint">
          — {item.brand}
          {item.price ? ` $${item.price}` : ""}
        </span>{" "}
        <span className="text-[10px] text-ink-whisper">↗</span>
      </a>
    </div>
  );
}

export function CreatorCard({ result }: { result: CreatorOutfit }) {
  const o = result.outfit;
  const rainFallback = result.day.precipitationProbability;
  const showRain = rainFallback > 20;

  return (
    <div className="md:grid md:grid-cols-[1fr_minmax(0,460px)] md:gap-10 lg:gap-14">
      {/* LEFT — text content (mirrors DayCard) */}
      <div className="order-2 md:order-1">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-soft mb-3">
            {result.location} · Styled by @{result.creator}
          </p>
          <h2 className="font-[var(--font-serif)] text-[32px] md:text-[44px] text-foreground leading-[1.05] tracking-[-0.02em] mb-5">
            {o.headline}
          </h2>
          <div className="flex gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">Range</p>
              <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">
                {Math.round(result.day.tempMin)}–{Math.round(result.day.tempMax)}°
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">UV</p>
              <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">{result.day.uvIndexMax}</p>
            </div>
            {showRain && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">Rain</p>
                <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">{rainFallback}%</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Morning */}
        <MomentSection
          label="Morning"
          timeRange={result.moments[0]?.timeRange || "7–9am"}
          temp={result.moments[0] ? `${result.moments[0].sunFeel}°` : undefined}
          tempSub={result.moments[0] ? `${result.moments[0].shadeFeel}° in shade` : undefined}
          summary={o.walkOut.summary}
        >
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <CreatorRow label="Top" item={o.walkOut.top} />
            <CreatorRow label="Layer" item={o.walkOut.layer} />
            <CreatorRow label="Bottom" item={o.walkOut.bottom} />
            <CreatorRow label="Shoes" item={o.walkOut.shoes} />
          </div>
          {o.walkOut.accessories.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-2">Accessories</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {o.walkOut.accessories.map((a) => (
                  <a
                    key={a.index}
                    href={safeHref(a.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-ink-subtle hover:text-clay transition-colors"
                  >
                    {a.title} <span className="text-[10px] text-ink-whisper">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </MomentSection>

        <div className="border-t border-border" />

        {/* Midday */}
        <MomentSection
          label="Midday"
          timeRange={result.moments[1]?.timeRange || "11am–3pm"}
          temp={result.moments[1] ? `${result.moments[1].sunFeel}°` : undefined}
          tempSub={result.moments[1] ? `${result.moments[1].shadeFeel}° in shade` : undefined}
          summary={o.carry.summary}
        >
          {o.carry.remove.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-clay-warm mb-2">Take off</p>
              {o.carry.remove.map((item, j) => (
                <p key={j} className="text-[14px] text-foreground">{item}</p>
              ))}
            </div>
          )}
          {o.carry.add.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-olive mb-2">Put on</p>
              {o.carry.add.map((item, j) => (
                <p key={j} className="text-[14px] text-foreground">{item}</p>
              ))}
            </div>
          )}
          {o.carry.note && <p className="text-[12px] text-ink-faint italic">{o.carry.note}</p>}
        </MomentSection>

        <div className="border-t border-border" />

        {/* Evening */}
        <MomentSection
          label="Evening"
          timeRange={result.moments[2]?.timeRange || "6–10pm"}
          temp={result.moments[2] ? `${result.moments[2].shadeFeel}°` : undefined}
          tempSub={result.moments[2]?.windSpeed && result.moments[2].windSpeed > 5 ? "with wind chill" : undefined}
          summary={o.evening.summary}
        >
          {o.evening.add.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-olive mb-2">Put back on</p>
              {o.evening.add.map((item, j) => (
                <p key={j} className="text-[14px] text-foreground">{item}</p>
              ))}
            </div>
          )}
          {o.evening.note && <p className="text-[12px] text-ink-faint italic">{o.evening.note}</p>}
        </MomentSection>

        {/* Bag */}
        {o.bagEssentials.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="py-6">
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink-soft mb-3">In your bag</p>
              <p className="text-[14px] text-foreground">{o.bagEssentials.join(" · ")}</p>
            </div>
          </>
        )}
      </div>

      {/* RIGHT — shop-the-look collage (top on mobile, sticky on desktop) */}
      <div className="order-1 md:order-2 mb-6 md:mb-0">
        <div className="md:sticky md:top-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-ink-soft mb-3">The look</p>
          <OutfitCollage items={[o.walkOut.top, o.walkOut.layer, o.walkOut.bottom, o.walkOut.shoes, ...o.walkOut.accessories]} />
        </div>
      </div>
    </div>
  );
}
