import { shopUrl } from "@/lib/shop";

// Inline clickable item text with a small ↗ marker. Used inside DayCard.
export function ShopLink({ text }: { text: string }) {
  return (
    <a
      href={shopUrl(text)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[14px] text-foreground leading-snug hover:text-clay transition-colors"
    >
      {text} <span className="text-[10px] text-ink-whisper">↗</span>
    </a>
  );
}
