"use client";

import { useEffect, useRef, useState } from "react";
import type { TodayResult } from "@/lib/types";
import { shopUrl } from "@/lib/shop";
import { useOutfitImage } from "@/hooks/use-outfit-image";
import { BreatheBar } from "./breathe-bar";
import { MomentSection } from "./moment-section";

function OutfitRow({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1.5">{label}</p>
      <a
        href={shopUrl(text)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[14px] text-foreground leading-snug hover:text-clay transition-colors"
      >
        {text} <span className="text-[10px] text-ink-whisper">↗</span>
      </a>
    </div>
  );
}

function walkOutPieces(result: TodayResult): Array<{ label: string; text: string }> {
  const rows =
    result.outfit.walkOut.base.kind === "dress"
      ? [{ label: "Dress", text: result.outfit.walkOut.base.dress }]
      : [
          { label: "Top", text: result.outfit.walkOut.base.top },
          { label: "Bottom", text: result.outfit.walkOut.base.bottom },
        ];

  if (result.outfit.walkOut.layer) {
    rows.splice(1, 0, { label: "Layer", text: result.outfit.walkOut.layer });
  }

  rows.push({ label: "Shoes", text: result.outfit.walkOut.shoes });
  return rows;
}

function shareWalkOutLine(result: TodayResult): string {
  const pieces = walkOutPieces(result).map((piece) => piece.text);
  return pieces.join(", ");
}

export function DayCard({ result }: { result: TodayResult }) {
  const { image: outfitImage, loading: imageLoading } = useOutfitImage(result);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  const handleShare = async () => {
    const text =
      `${result.outfit.headline}\n\n` +
      `Walk out: ${shareWalkOutLine(result)}\n\n` +
      `${result.location} — via Well Suited`;
    if (navigator.share) {
      try {
        const shareData: ShareData = { title: "Well Suited", text };
        if (outfitImage) {
          const blob = await fetch(outfitImage).then((r) => r.blob());
          const file = new File([blob], "outfit.png", { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) shareData.files = [file];
        }
        await navigator.share(shareData);
      } catch {
        /* user cancelled or share failed */
      }
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="md:grid md:grid-cols-[1fr_minmax(0,460px)] md:gap-10 lg:gap-14">
      {/* LEFT — text content */}
      <div className="order-2 md:order-1">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-soft mb-3">{result.location}</p>
          <h2 className="font-[var(--font-serif)] text-[32px] md:text-[44px] text-foreground leading-[1.05] tracking-[-0.02em] mb-5">
            {result.outfit.headline}
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
            {result.day.precipitationProbability > 20 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">Rain</p>
                <p className="font-[var(--font-serif)] text-[20px] text-foreground leading-none">{result.day.precipitationProbability}%</p>
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
          summary={result.outfit.walkOut.summary}
        >
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {walkOutPieces(result).map((piece) => (
              <OutfitRow key={`${piece.label}:${piece.text}`} label={piece.label} text={piece.text} />
            ))}
          </div>
          {result.outfit.walkOut.accessories.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-2">Accessories</p>
              <p className="text-[13px] text-ink-subtle">{result.outfit.walkOut.accessories.join(" · ")}</p>
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
          summary={result.outfit.carry.summary}
        >
          {result.outfit.carry.remove.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-clay-warm mb-2">Take off</p>
              {result.outfit.carry.remove.map((item, j) => (
                <p key={j} className="text-[14px] text-foreground">{item}</p>
              ))}
            </div>
          )}
          {result.outfit.carry.add.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-olive mb-2">Put on</p>
              {result.outfit.carry.add.map((item, j) => (
                <p key={j} className="text-[14px] text-foreground">{item}</p>
              ))}
            </div>
          )}
          {result.outfit.carry.note && <p className="text-[12px] text-ink-faint italic">{result.outfit.carry.note}</p>}
        </MomentSection>

        <div className="border-t border-border" />

        {/* Evening */}
        <MomentSection
          label="Evening"
          timeRange={result.moments[2]?.timeRange || "6–10pm"}
          temp={result.moments[2] ? `${result.moments[2].shadeFeel}°` : undefined}
          tempSub={result.moments[2]?.windSpeed && result.moments[2].windSpeed > 5 ? "with wind chill" : undefined}
          summary={result.outfit.evening.summary}
        >
          {result.outfit.evening.add.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-olive mb-2">Put back on</p>
              {result.outfit.evening.add.map((item, j) => (
                <p key={j} className="text-[14px] text-foreground">{item}</p>
              ))}
            </div>
          )}
          {result.outfit.evening.note && <p className="text-[12px] text-ink-faint italic">{result.outfit.evening.note}</p>}
        </MomentSection>

        {/* Bag */}
        {result.outfit.bagEssentials.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="py-6">
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink-soft mb-3">In your bag</p>
              <p className="text-[14px] text-foreground">{result.outfit.bagEssentials.join(" · ")}</p>
            </div>
          </>
        )}

        {/* Share */}
        <div className="relative inline-block w-full md:w-auto mt-2">
          <button
            onClick={handleShare}
            className="w-full md:w-auto md:px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-[14px] font-medium tracking-wide hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Share this look →
          </button>
          {copied && (
            <span
              role="status"
              aria-live="polite"
              className="absolute left-1/2 -translate-x-1/2 -bottom-8 text-[12px] text-olive bg-olive/10 px-3 py-1 rounded-full whitespace-nowrap"
            >
              Copied to clipboard
            </span>
          )}
        </div>
      </div>

      {/* RIGHT — outfit image (top on mobile, sticky on desktop) */}
      <div className="order-1 md:order-2 mb-6 md:mb-0">
        <div className="md:sticky md:top-5">
          {imageLoading && (
            <div className="rounded-3xl bg-muted aspect-[3/4] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <BreatheBar maxWidth={120} />
                <p className="text-[10px] text-ink-faint uppercase tracking-[0.2em]">Styling your look</p>
              </div>
            </div>
          )}
          {outfitImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={outfitImage} alt="Outfit visualization" className="w-full rounded-3xl object-cover aspect-[3/4]" />
          )}
          {!imageLoading && !outfitImage && (
            <div className="rounded-3xl bg-muted aspect-[3/4] flex items-center justify-center">
              <p className="text-[11px] text-ink-faint uppercase tracking-[0.2em]">Couldn&apos;t generate image</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
