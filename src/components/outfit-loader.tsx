import { StylistVoice } from "./stylist-voice";

const PHRASES = {
  today: [
    "Pulling the hourly forecast…",
    "It's cool now, warmer by noon, breezy after sunset…",
    "Reaching for something soft, tonal, layered…",
    "Pairing wool with denim, cream with charcoal…",
    "Adding a piece you can shed, then put back on…",
    "Almost dressed.",
  ],
  trip: [
    "Reading the week ahead…",
    "Mostly mild, with a Tuesday rain spell…",
    "Layering for shoulder-season weather…",
    "Choosing pieces that mix and travel well…",
    "Editing for one consolidated bag…",
    "Almost packed.",
  ],
};

const EYEBROW = {
  today: "Reading your day",
  trip: "Building your list",
};

export function OutfitLoader({ variant }: { variant: "today" | "trip" }) {
  return (
    <div className="flex flex-col items-center gap-6 py-16 md:py-24 max-w-[560px] mx-auto px-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-ink-whisper">{EYEBROW[variant]}</p>
      <StylistVoice phrases={PHRASES[variant]} />
    </div>
  );
}
