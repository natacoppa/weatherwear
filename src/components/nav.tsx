import Link from "next/link";

// Shared site nav. Server component — no interactivity.
// `showCta` defaults to false so /app uses just the wordmark + API link,
// while the landing page opts in to the "Get dressed" CTA.
export function Nav({ showCta = false, wide = false }: { showCta?: boolean; wide?: boolean }) {
  return (
    <nav className={`w-full ${wide ? "max-w-[1400px]" : "max-w-[1200px]"} mx-auto px-6 md:px-10 py-5 flex items-center justify-between`}>
      <Link href="/" className="font-[var(--font-serif)] text-[20px] md:text-[22px] text-foreground tracking-[-0.01em]">
        Well Suited
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/docs" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          API
        </Link>
        {showCta && (
          <Link
            href="/app"
            className="text-[13px] font-medium text-primary-foreground bg-primary px-5 py-2 rounded-full hover:bg-primary-hover transition-colors"
          >
            Get dressed
          </Link>
        )}
      </div>
    </nav>
  );
}
