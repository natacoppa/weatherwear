import { shopUrl } from "@/lib/shop";

// Block-level packing-list entry with dashed underline. Used inside Trip view.
export function PackLink({ text }: { text: string }) {
  return (
    <a
      href={shopUrl(text)}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-[13px] text-ink-subtle leading-relaxed underline decoration-rule-dashed underline-offset-2 hover:decoration-olive transition-colors"
    >
      {text} <span className="text-[10px] text-ink-whisper no-underline">↗</span>
    </a>
  );
}
