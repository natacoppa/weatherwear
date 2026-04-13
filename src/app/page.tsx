import Image from "next/image";
import Link from "next/link";

import { ApiExample } from "@/components/api-example";
import { MockOutfitCard } from "@/components/mock-outfit-card";
import { MockPackingList } from "@/components/mock-packing-list";
import { Nav } from "@/components/nav";
import { RotatingWord } from "@/components/rotating-word";
import { Ticker } from "@/components/ticker";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Nav showCta wide />

      {/* ═══ HERO ═══ */}
      <section className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-8 md:pt-20 pb-16 md:pb-24">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12 lg:gap-8">
          {/* Left — headline + copy */}
          <div className="max-w-[520px] lg:pt-8 shrink-0">
            <h1 className="font-[var(--font-serif)] text-[52px] md:text-[64px] lg:text-[76px] text-foreground leading-[1.0] tracking-[-0.03em] mb-6">
              Never<br />
              <span className="text-clay"><RotatingWord /></span>.
            </h1>
            <p className="text-[17px] md:text-[19px] text-muted-foreground leading-[1.65] max-w-[420px] mb-8">
              AI reads the hourly forecast and tells you exactly what to wear — morning, midday, and evening.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/app"
                className="inline-flex items-center gap-2 text-[15px] font-medium text-primary-foreground bg-primary px-7 py-3.5 rounded-full hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                Try it free
                <span className="text-primary-foreground/40">→</span>
              </Link>
              <Link href="/docs"
                className="inline-flex items-center gap-2 text-[15px] font-medium text-foreground bg-primary/[0.06] px-7 py-3.5 rounded-full hover:bg-primary/[0.1] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                View the API
              </Link>
            </div>
          </div>

          {/* Right — bento collage: NYC outfit across a day */}
          <div className="hidden lg:grid grid-cols-4 grid-rows-3 gap-3 max-w-[780px] w-full" style={{ height: "580px" }}>
            <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden bg-muted">
              <Image src="/lifestyle/nyc/nyc-morning.jpg" alt="7am — coat, turtleneck, boots" width={400} height={600} className="w-full h-full object-cover" />
            </div>
            <div className="col-span-2 row-span-1 rounded-2xl overflow-hidden bg-muted">
              <Image src="/lifestyle/nyc/nyc-midday.jpg" alt="1pm — coat draped, sunny" width={600} height={300} className="w-full h-full object-cover object-center" />
            </div>
            <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden bg-muted">
              <Image src="/lifestyle/nyc/nyc-flatlay.jpg" alt="The full outfit" width={300} height={300} className="w-full h-full object-cover" />
            </div>
            <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden border border-border bg-card relative">
              <div className="w-full h-full overflow-hidden">
                <div className="animate-[mockScroll_18s_ease-in-out_infinite]">
                  <MockOutfitCard variant="classic" />
                </div>
              </div>
              <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-card to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            </div>
            <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden bg-muted">
              <Image src="/lifestyle/nyc/nyc-evening.jpg" alt="7pm — coat back on, scarf added" width={400} height={600} className="w-full h-full object-cover" />
            </div>
            <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden bg-muted">
              <Image src="/lifestyle/nyc/nyc-detail.jpg" alt="Detail — scarf, gloves, coffee" width={300} height={300} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Mobile — single card */}
          <div className="lg:hidden flex justify-center">
            <div className="relative w-full max-w-[340px] h-[460px] rounded-3xl overflow-hidden border border-border shadow-[0_8px_40px_-12px_rgba(58,53,48,0.15)]">
              <div className="absolute inset-0 overflow-y-auto scrollbar-hide animate-[slowScroll_12s_ease-in-out_infinite]">
                <MockOutfitCard variant="classic" />
              </div>
              <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-card to-transparent pointer-events-none rounded-t-3xl" />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none rounded-b-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TICKER STRIP ═══ */}
      <div className="w-full py-6 border-y border-border bg-card/50 space-y-3 overflow-hidden">
        <Ticker />
        <Ticker reverse />
      </div>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3]">
            <Image src="/lifestyle/howitworks-la.jpg" alt="Golden hour in Los Angeles" width={800} height={600} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-4 text-primary-foreground/80 text-[13px]">
                <span className="bg-primary-foreground/20 backdrop-blur-sm px-3 py-1 rounded-full">Los Angeles</span>
                <span className="bg-primary-foreground/20 backdrop-blur-sm px-3 py-1 rounded-full">76°</span>
                <span className="bg-primary-foreground/20 backdrop-blur-sm px-3 py-1 rounded-full">Golden hour</span>
              </div>
            </div>
          </div>
          <div>
            <div className="space-y-10">
              {[
                { num: "01", label: "Enter your city", desc: "We pull the real hourly forecast — sun feel, shade feel, wind chill, UV, and rain chance." },
                { num: "02", label: "Get your outfit", desc: "AI builds a full outfit for morning, midday, and evening. Specific garments, colors, and fabrics." },
                { num: "03", label: "Walk out the door", desc: "Know exactly what to wear, what to stash in your bag, and when to layer up or shed." },
              ].map((step) => (
                <div key={step.num} className="flex gap-5">
                  <span className="font-[var(--font-serif)] text-[32px] text-border leading-none shrink-0 w-12">{step.num}</span>
                  <div>
                    <h3 className="font-[var(--font-serif)] text-[22px] text-foreground mb-2">{step.label}</h3>
                    <p className="text-[15px] text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MODES ═══ */}
      <section className="w-full bg-card border-y border-border">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="mb-12 md:mb-16 max-w-[640px]">
            <p className="text-[11px] uppercase tracking-[0.22em] text-clay font-medium mb-4">Two ways in</p>
            <h2 className="font-[var(--font-serif)] text-[40px] md:text-[56px] text-foreground leading-[1.0] tracking-[-0.02em]">
              Dress for a day.<br />Or pack for a week.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="rounded-3xl overflow-hidden border border-border bg-card">
              <MockOutfitCard variant="funky" />
            </div>
            <div className="rounded-3xl overflow-hidden border border-border bg-card">
              <MockPackingList />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CREATOR ═══ */}
      <section className="w-full border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-12 lg:gap-20 items-center">
            <div className="rounded-3xl overflow-hidden aspect-[3/2]">
              <Image src="/lifestyle/creator-grid.jpg" alt="Creator-curated outfits" width={1200} height={800}
                className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-clay font-medium mb-4">Creator mode</p>
              <h2 className="font-[var(--font-serif)] text-[40px] md:text-[56px] text-foreground leading-[1.0] tracking-[-0.02em] mb-6">
                Styled by the<br />creators you follow.
              </h2>
              <p className="text-[16px] md:text-[17px] text-muted-foreground leading-[1.65] mb-6 max-w-[480px]">
                Pick a favorite creator. We read their curated LTK and ShopMy collections, match pieces to the forecast,
                and build a full outfit you can actually shop.
              </p>
              <p className="text-[16px] md:text-[17px] text-muted-foreground leading-[1.65] mb-8 max-w-[480px]">
                Same weather intelligence — dressed in <em className="text-foreground not-italic font-medium">their</em> taste.
              </p>
              <Link href="/app"
                className="inline-flex items-center gap-2 text-[15px] font-medium text-primary-foreground bg-primary px-7 py-3.5 rounded-full hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                Try a creator outfit
                <span className="text-primary-foreground/40">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ API ═══ */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="max-w-[640px]">
          <p className="text-[11px] uppercase tracking-[0.2em] text-clay font-medium mb-4">For developers</p>
          <h2 className="font-[var(--font-serif)] text-[36px] md:text-[48px] text-foreground leading-[1.05] tracking-[-0.02em] mb-4">
            Build on it.
          </h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-8">
            Outfit intelligence as a REST API. Structured recommendations and packing lists for any city in the world.
          </p>
          <ApiExample />
          <Link href="/docs"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-clay mt-5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            Full API documentation →
          </Link>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="w-full bg-primary relative overflow-hidden">
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 font-[var(--font-serif)] text-[200px] md:text-[300px] text-primary-foreground/[0.03] leading-none tracking-[-0.05em] select-none pointer-events-none">
          72°
        </div>
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28 relative">
          <h2 className="font-[var(--font-serif)] text-[36px] md:text-[56px] text-background leading-[1.05] tracking-[-0.03em] mb-4 max-w-[500px]">
            Stop guessing.<br />Start dressing.
          </h2>
          <p className="text-[16px] text-background/50 mb-8 max-w-[360px]">
            No account needed. Enter a city and see what to wear today.
          </p>
          <Link href="/app"
            className="inline-flex items-center gap-2 text-[15px] font-medium text-foreground bg-background px-8 py-3.5 rounded-full hover:bg-popover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
            Open Well Suited
            <span className="text-foreground/40">→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-[var(--font-serif)] text-[15px] text-ink-faint">Well Suited</span>
        <div className="flex items-center gap-6">
          <Link href="/app" className="text-[13px] text-ink-faint hover:text-foreground transition-colors">App</Link>
          <Link href="/docs" className="text-[13px] text-ink-faint hover:text-foreground transition-colors">API</Link>
        </div>
      </footer>
    </main>
  );
}
