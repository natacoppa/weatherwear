"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// ── Rotating words ──────────────────────────────────────────────────

const ROTATE_WORDS = ["overdress", "underdress", "guess", "overthink", "sweat it"];

function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ROTATE_WORDS.length);
        setVisible(true);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`inline-block transition-all duration-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
      {ROTATE_WORDS[index]}
    </span>
  );
}

// ── Ticker ──────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  "Los Angeles 72° — Rust cotton tee, linen trousers",
  "Tokyo 58° — Navy wool coat, cream turtleneck",
  "Paris 64° — Camel trench, black ankle boots",
  "New York 45° — Charcoal peacoat, burgundy scarf",
  "London 52° — Olive rain jacket, dark denim",
  "Sydney 80° — White linen shirt, tan shorts",
  "Mexico City 68° — Terracotta blouse, wide-leg pants",
  "Copenhagen 40° — Black puffer, wool beanie",
  "Marrakech 88° — Loose cotton caftan, sandals",
  "Seoul 55° — Layered knit, pleated midi skirt",
];

function Ticker({ reverse = false }: { reverse?: boolean }) {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <div className={`inline-flex gap-8 ${reverse ? "animate-[tickerReverse_60s_linear_infinite]" : "animate-[ticker_60s_linear_infinite]"}`}>
        {items.map((item, i) => (
          <span key={i} className="text-[13px] text-ink-whisper tracking-wide">{item}</span>
        ))}
      </div>
    </div>
  );
}

// ── Mock outfit card ───────────────────────────────────────────────

function MockOutfitCard() {
  return (
    <div className="bg-card w-full">
      {/* Hero image with city label */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image src="/lifestyle/nyc-funky/nyc-morning.jpg" alt="NYC morning" width={600} height={338} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <div className="absolute top-3 left-4">
          <p className="text-[9px] uppercase tracking-[0.22em] text-white drop-shadow-md font-medium">New York, NY</p>
        </div>
      </div>

      <div className="p-5 pt-3">
        <h3 className="font-[var(--font-serif)] text-[22px] text-foreground leading-[1.1] tracking-[-0.01em] mb-3">
          Butter yellow & cognac,<br />SoHo sidewalks in sun
        </h3>

        {/* Palette swatches */}
        <div className="flex items-center gap-1.5 mb-4 pb-4 border-b border-input">
          <span className="w-6 h-6 rounded-full bg-[#f5d97a] shadow-sm" title="Butter yellow" />
          <span className="w-6 h-6 rounded-full bg-[#8a4a2b] shadow-sm" title="Cognac" />
          <span className="w-6 h-6 rounded-full bg-[#3d2818] shadow-sm" title="Chocolate" />
          <span className="w-6 h-6 rounded-full bg-[#5a1a1e] shadow-sm" title="Oxblood" />
          <div className="ml-auto flex gap-4">
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[0.2em] text-ink-soft">Range</p>
              <p className="font-[var(--font-serif)] text-[14px] text-foreground leading-none">46–62°</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[0.2em] text-ink-soft">Wind</p>
              <p className="font-[var(--font-serif)] text-[14px] text-foreground leading-none">12mph</p>
            </div>
          </div>
        </div>

        {/* Morning */}
        <div className="pb-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="flex items-baseline gap-2">
              <h4 className="font-[var(--font-serif)] text-[16px] text-foreground leading-none">Morning</h4>
              <span className="text-[9px] uppercase tracking-[0.18em] text-ink-soft">7–9am</span>
            </div>
            <span className="font-[var(--font-serif)] text-[22px] text-foreground leading-none">48°</span>
          </div>
          <p className="text-[11px] text-muted-foreground italic mb-2.5">Crisp SoHo morning, long shadows downtown</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f5d97a] shrink-0" />
              <p className="text-[12px] text-foreground">Butter cashmere</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8a4a2b] shrink-0" />
              <p className="text-[12px] text-foreground">Cognac leather trench</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3d2818] shrink-0" />
              <p className="text-[12px] text-foreground">Pinstripe trousers</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a1814] shrink-0" />
              <p className="text-[12px] text-foreground">Platform loafers</p>
            </div>
          </div>
        </div>

        <div className="border-t border-input" />

        {/* Midday */}
        <div className="py-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="flex items-baseline gap-2">
              <h4 className="font-[var(--font-serif)] text-[16px] text-foreground leading-none">Midday</h4>
              <span className="text-[9px] uppercase tracking-[0.18em] text-ink-soft">12–3pm</span>
            </div>
            <span className="font-[var(--font-serif)] text-[22px] text-foreground leading-none">61°</span>
          </div>
          <p className="text-[11px] text-muted-foreground italic mb-2">Sun hits hard on Broadway, trench optional</p>
          <span className="inline-flex items-center gap-1.5 bg-clay-warm/15 px-2.5 py-1 rounded-full">
            <span className="text-[10px] text-clay-warm font-medium">−</span>
            <span className="text-[11px] text-foreground">Drape the leather trench</span>
          </span>
        </div>

        <div className="border-t border-input" />

        {/* Evening */}
        <div className="py-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="flex items-baseline gap-2">
              <h4 className="font-[var(--font-serif)] text-[16px] text-foreground leading-none">Evening</h4>
              <span className="text-[9px] uppercase tracking-[0.18em] text-ink-soft">6–10pm</span>
            </div>
            <span className="font-[var(--font-serif)] text-[22px] text-foreground leading-none">51°</span>
          </div>
          <p className="text-[11px] text-muted-foreground italic mb-2">Wind picks up after sunset, layer up</p>
          <span className="inline-flex items-center gap-1.5 bg-olive/15 px-2.5 py-1 rounded-full">
            <span className="text-[10px] text-olive font-medium">+</span>
            <span className="text-[11px] text-foreground">Trench on, add printed silk scarf</span>
          </span>
        </div>

        <div className="border-t border-input" />

        {/* Bag */}
        <div className="pt-4 pb-1">
          <p className="text-[9px] uppercase tracking-[0.22em] text-ink-soft mb-2">In your bag</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] text-foreground bg-white border border-input px-2.5 py-1 rounded-full">Silk scarf</span>
            <span className="text-[11px] text-foreground bg-white border border-input px-2.5 py-1 rounded-full">Tortoise sunnies</span>
            <span className="text-[11px] text-foreground bg-white border border-input px-2.5 py-1 rounded-full">Metro card</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mock outfit card — Classic NY (used in hero bento) ────────────

function MockOutfitCardClassic() {
  return (
    <div className="bg-card w-full">
      {/* Hero image with city label */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image src="/lifestyle/nyc/nyc-morning.jpg" alt="NYC morning" width={600} height={338} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <div className="absolute top-3 left-4">
          <p className="text-[9px] uppercase tracking-[0.22em] text-white drop-shadow-md font-medium">New York, NY</p>
        </div>
      </div>

      <div className="p-5 pt-3">
        <h3 className="font-[var(--font-serif)] text-[22px] text-foreground leading-[1.1] tracking-[-0.01em] mb-3">
          Manhattan minimal,<br />black on cream stone
        </h3>

        {/* Palette swatches */}
        <div className="flex items-center gap-1.5 mb-4 pb-4 border-b border-input">
          <span className="w-6 h-6 rounded-full bg-[#1a1814] shadow-sm" title="Black" />
          <span className="w-6 h-6 rounded-full bg-[#1a2238] shadow-sm" title="Indigo" />
          <span className="w-6 h-6 rounded-full bg-[#ece4d2] border border-input shadow-sm" title="Cream" />
          <span className="w-6 h-6 rounded-full bg-[#5a4a38] shadow-sm" title="Tortoise" />
          <div className="ml-auto flex gap-4">
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[0.2em] text-ink-soft">Range</p>
              <p className="font-[var(--font-serif)] text-[14px] text-foreground leading-none">46–62°</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[0.2em] text-ink-soft">Wind</p>
              <p className="font-[var(--font-serif)] text-[14px] text-foreground leading-none">12mph</p>
            </div>
          </div>
        </div>

        {/* Morning */}
        <div className="pb-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="flex items-baseline gap-2">
              <h4 className="font-[var(--font-serif)] text-[16px] text-foreground leading-none">Morning</h4>
              <span className="text-[9px] uppercase tracking-[0.18em] text-ink-soft">7–9am</span>
            </div>
            <span className="font-[var(--font-serif)] text-[22px] text-foreground leading-none">48°</span>
          </div>
          <p className="text-[11px] text-muted-foreground italic mb-2.5">Crisp Tribeca morning, light reflecting off limestone</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a1814] shrink-0" />
              <p className="text-[12px] text-foreground">Cashmere turtleneck</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a1814] shrink-0" />
              <p className="text-[12px] text-foreground">Tailored wool coat</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a2238] shrink-0" />
              <p className="text-[12px] text-foreground">Straight dark denim</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a1814] shrink-0" />
              <p className="text-[12px] text-foreground">Chelsea boots</p>
            </div>
          </div>
        </div>

        <div className="border-t border-input" />

        {/* Midday */}
        <div className="py-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="flex items-baseline gap-2">
              <h4 className="font-[var(--font-serif)] text-[16px] text-foreground leading-none">Midday</h4>
              <span className="text-[9px] uppercase tracking-[0.18em] text-ink-soft">12–3pm</span>
            </div>
            <span className="font-[var(--font-serif)] text-[22px] text-foreground leading-none">61°</span>
          </div>
          <p className="text-[11px] text-muted-foreground italic mb-2">Park Ave sun, coat off</p>
          <span className="inline-flex items-center gap-1.5 bg-clay-warm/15 px-2.5 py-1 rounded-full">
            <span className="text-[10px] text-clay-warm font-medium">−</span>
            <span className="text-[11px] text-foreground">Drape the wool coat</span>
          </span>
        </div>

        <div className="border-t border-input" />

        {/* Evening */}
        <div className="py-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="flex items-baseline gap-2">
              <h4 className="font-[var(--font-serif)] text-[16px] text-foreground leading-none">Evening</h4>
              <span className="text-[9px] uppercase tracking-[0.18em] text-ink-soft">6–10pm</span>
            </div>
            <span className="font-[var(--font-serif)] text-[22px] text-foreground leading-none">51°</span>
          </div>
          <p className="text-[11px] text-muted-foreground italic mb-2">Wind off the East River, coat back on</p>
          <span className="inline-flex items-center gap-1.5 bg-olive/15 px-2.5 py-1 rounded-full">
            <span className="text-[10px] text-olive font-medium">+</span>
            <span className="text-[11px] text-foreground">Wool coat, gold hoops</span>
          </span>
        </div>

        <div className="border-t border-input" />

        {/* Bag */}
        <div className="pt-4 pb-1">
          <p className="text-[9px] uppercase tracking-[0.22em] text-ink-soft mb-2">In your bag</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] text-foreground bg-white border border-input px-2.5 py-1 rounded-full">Tortoise sunnies</span>
            <span className="text-[11px] text-foreground bg-white border border-input px-2.5 py-1 rounded-full">Gold hoops</span>
            <span className="text-[11px] text-foreground bg-white border border-input px-2.5 py-1 rounded-full">Metro card</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mock packing list ──────────────────────────────────────────────

function MockPackingList() {
  return (
    <div className="bg-card w-full">
      {/* Hero with destination */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image src="/lifestyle/tokyo-trip.jpg" alt="Tokyo trip" width={600} height={338} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        <div className="absolute top-3 left-4 right-4 flex items-start justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.22em] text-white drop-shadow-md font-medium">Packing for</p>
            <p className="font-[var(--font-serif)] text-[24px] text-white drop-shadow-md leading-none mt-0.5">Tokyo</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="text-[10px] text-foreground font-medium">5 days</span>
          </div>
        </div>
      </div>

      <div className="p-5 pt-4">
        {/* Day strip */}
        <div className="mb-4 pb-4 border-b border-input">
          <p className="text-[8px] uppercase tracking-[0.22em] text-ink-soft mb-2">Day by day</p>
          <div className="flex gap-1.5">
            {[
              { day: "Sat", temp: "60°" },
              { day: "Sun", temp: "68°" },
              { day: "Mon", temp: "72°", active: true },
              { day: "Tue", temp: "65°", rain: true },
              { day: "Wed", temp: "58°" },
            ].map((d, i) => (
              <div key={i} className={`flex-1 flex flex-col items-center py-2 rounded-xl border shrink-0 ${d.active ? "bg-primary border-primary text-white" : "bg-white border-input"}`}>
                <span className={`text-[8px] uppercase tracking-[0.15em] ${d.active ? "text-white/70" : "text-ink-soft"}`}>{d.day}</span>
                <span className={`font-[var(--font-serif)] text-[14px] leading-none mt-0.5 ${d.active ? "text-white" : "text-foreground"}`}>{d.temp}</span>
                {d.rain && <span className="text-[8px] text-clay-warm mt-0.5">30%</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Headline */}
        <h4 className="font-[var(--font-serif)] text-[20px] text-foreground leading-[1.15] tracking-[-0.01em] mb-2">
          Quiet luxury in cashmere
        </h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-4 pb-4 border-b border-input">
          Cool mornings, mild afternoons. Neutral layering, architectural tailoring.
        </p>

        {/* Palette */}
        <div className="flex items-center gap-1.5 mb-4 pb-4 border-b border-input">
          <span className="text-[8px] uppercase tracking-[0.2em] text-ink-soft mr-1">Palette</span>
          <span className="w-5 h-5 rounded-full bg-[#ece4d2] border border-input shadow-sm" title="Cream" />
          <span className="w-5 h-5 rounded-full bg-[#d4c4a0] shadow-sm" title="Oatmeal" />
          <span className="w-5 h-5 rounded-full bg-[#a8896a] shadow-sm" title="Camel" />
          <span className="w-5 h-5 rounded-full bg-[#6b5338] shadow-sm" title="Tobacco" />
          <span className="w-5 h-5 rounded-full bg-[#3a2c1e] shadow-sm" title="Chocolate" />
        </div>

        {/* Categories with item counts */}
        <p className="text-[9px] uppercase tracking-[0.22em] text-ink-soft mb-3">The list</p>
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-input">
            <div>
              <p className="font-[var(--font-serif)] text-[14px] text-foreground leading-none mb-1">Knits</p>
              <p className="text-[11px] text-muted-foreground leading-snug">Cashmere crew, silk mock-neck, fine merino</p>
            </div>
            <span className="text-[11px] font-medium text-foreground bg-white border border-input rounded-full px-2 py-0.5 shrink-0">4</span>
          </div>
          <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-input">
            <div>
              <p className="font-[var(--font-serif)] text-[14px] text-foreground leading-none mb-1">Tailoring</p>
              <p className="text-[11px] text-muted-foreground leading-snug">Wool trousers, pleated skirt, silk slip</p>
            </div>
            <span className="text-[11px] font-medium text-foreground bg-white border border-input rounded-full px-2 py-0.5 shrink-0">3</span>
          </div>
          <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-input">
            <div>
              <p className="font-[var(--font-serif)] text-[14px] text-foreground leading-none mb-1">Outerwear</p>
              <p className="text-[11px] text-muted-foreground leading-snug">Oatmeal double-breasted coat, cashmere wrap</p>
            </div>
            <span className="text-[11px] font-medium text-foreground bg-white border border-input rounded-full px-2 py-0.5 shrink-0">2</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-[var(--font-serif)] text-[14px] text-foreground leading-none mb-1">Shoes</p>
              <p className="text-[11px] text-muted-foreground leading-snug">Leather loafers, suede mules</p>
            </div>
            <span className="text-[11px] font-medium text-foreground bg-white border border-input rounded-full px-2 py-0.5 shrink-0">2</span>
          </div>
        </div>

        {/* Pro tip */}
        <div className="mt-4 p-3 rounded-xl bg-olive/8">
          <div className="flex items-start gap-2">
            <span className="text-[12px]">💡</span>
            <div>
              <p className="text-[9px] uppercase tracking-[0.22em] text-olive font-medium mb-0.5">Pro tip</p>
              <p className="text-[11px] text-foreground italic leading-snug">Stick to one color family — travel photos look curated.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── API Example ─────────────────────────────────────────────────────

function ApiExample() {
  return (
    <pre className="text-[13px] md:text-[14px] leading-relaxed text-ink-subtle bg-card rounded-2xl p-5 overflow-x-auto border border-border">
      <code>{`GET /api/outfit-day?q=Los Angeles&day=0

{
  "location": "Los Angeles, California",
  "outfit": {
    "headline": "Linen layers, terracotta tones",
    "walkOut": {
      "top": "Rust cotton tee",
      "bottom": "Wide-leg linen trousers",
      "shoes": "Tan suede loafers"
    }
  }
}`}</code>
    </pre>
  );
}

// ── Page ────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
        <Link href="/" className="font-[var(--font-serif)] text-[22px] text-foreground tracking-[-0.01em]">
          Well Suited
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/docs" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            API
          </Link>
          <Link href="/app"
            className="text-[13px] font-medium text-white bg-primary px-5 py-2 rounded-full hover:bg-primary-hover transition-colors">
            Get dressed
          </Link>
        </div>
      </nav>

      {/* ═══ HERO — LTK-inspired: headline left, photo collage right ═══ */}
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
                className="inline-flex items-center gap-2 text-[15px] font-medium text-white bg-primary px-7 py-3.5 rounded-full hover:bg-primary-hover transition-colors">
                Try it free
                <span className="text-white/40">→</span>
              </Link>
              <Link href="/docs"
                className="inline-flex items-center gap-2 text-[15px] font-medium text-foreground bg-primary/[0.06] px-7 py-3.5 rounded-full hover:bg-primary/[0.1] transition-colors">
                View the API
              </Link>
            </div>
          </div>

          {/* Right — bento collage: NYC outfit across a day */}
          <div className="hidden lg:grid grid-cols-4 grid-rows-3 gap-3 max-w-[780px] w-full" style={{ height: '580px' }}>
            {/* Morning — tall left (all layers on) */}
            <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden bg-muted">
              <Image src="/lifestyle/nyc/nyc-morning.jpg" alt="7am — coat, turtleneck, boots" width={400} height={600} className="w-full h-full object-cover" />
            </div>
            {/* Midday — wide top center (coat off) */}
            <div className="col-span-2 row-span-1 rounded-2xl overflow-hidden bg-muted">
              <Image src="/lifestyle/nyc/nyc-midday.jpg" alt="1pm — coat draped, sunny" width={600} height={300} className="w-full h-full object-cover object-center" />
            </div>
            {/* Flat lay — top right (all pieces) */}
            <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden bg-muted">
              <Image src="/lifestyle/nyc/nyc-flatlay.jpg" alt="The full outfit" width={300} height={300} className="w-full h-full object-cover" />
            </div>
            {/* Outfit card — center, auto-scrolling */}
            <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden border border-border bg-card relative">
              <div className="w-full h-full overflow-hidden">
                <div className="animate-[mockScroll_18s_ease-in-out_infinite]">
                  <MockOutfitCardClassic />
                </div>
              </div>
              {/* Fade top/bottom for visual polish */}
              <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-card to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            </div>
            {/* Evening — tall right (coat + scarf) */}
            <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden bg-muted">
              <Image src="/lifestyle/nyc/nyc-evening.jpg" alt="7pm — coat back on, scarf added" width={400} height={600} className="w-full h-full object-cover" />
            </div>
            {/* Detail — bottom left (gloves, scarf, coffee) */}
            <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden bg-muted">
              <Image src="/lifestyle/nyc/nyc-detail.jpg" alt="Detail — scarf, gloves, coffee" width={300} height={300} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Mobile — single card */}
          <div className="lg:hidden flex justify-center">
            <div className="relative w-full max-w-[340px] h-[460px] rounded-3xl overflow-hidden border border-border shadow-[0_8px_40px_-12px_rgba(58,53,48,0.15)]">
              <div className="absolute inset-0 overflow-y-auto scrollbar-hide animate-[slowScroll_12s_ease-in-out_infinite]">
                <MockOutfitCardClassic />
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

      {/* ═══ HOW IT WORKS — photo left, text right ═══ */}
      <section className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3]">
            <Image src="/lifestyle/howitworks-la.jpg" alt="Golden hour in Los Angeles" width={800} height={600} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-4 text-white/80 text-[13px]">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">Los Angeles</span>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">76°</span>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">Golden hour</span>
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

      {/* ═══ MODES — Today + Trip paired ═══ */}
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
              <MockOutfitCard />
            </div>
            <div className="rounded-3xl overflow-hidden border border-border bg-card">
              <MockPackingList />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CREATOR — own full-bleed editorial section ═══ */}
      <section className="w-full border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-12 lg:gap-20 items-center">
            {/* Image — shop-the-look style grid */}
            <div className="rounded-3xl overflow-hidden aspect-[3/2]">
              <Image src="/lifestyle/creator-grid.jpg" alt="Creator-curated outfits" width={1200} height={800}
                className="w-full h-full object-cover" />
            </div>
            {/* Copy */}
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
                className="inline-flex items-center gap-2 text-[15px] font-medium text-white bg-primary px-7 py-3.5 rounded-full hover:bg-primary-hover transition-colors">
                Try a creator outfit
                <span className="text-white/40">→</span>
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
            className="inline-flex items-center gap-2 text-[14px] font-medium text-clay mt-5 hover:underline">
            Full API documentation →
          </Link>
        </div>
      </section>

      {/* ═══ CTA — full bleed dark ═══ */}
      <section className="w-full bg-primary relative overflow-hidden">
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 font-[var(--font-serif)] text-[200px] md:text-[300px] text-white/[0.03] leading-none tracking-[-0.05em] select-none pointer-events-none">
          72°
        </div>
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28 relative">
          <h2 className="font-[var(--font-serif)] text-[36px] md:text-[56px] text-primary-foreground leading-[1.05] tracking-[-0.03em] mb-4 max-w-[500px]">
            Stop guessing.<br />Start dressing.
          </h2>
          <p className="text-[16px] text-primary-foreground/50 mb-8 max-w-[360px]">
            No account needed. Enter a city and see what to wear today.
          </p>
          <Link href="/app"
            className="inline-flex items-center gap-2 text-[15px] font-medium text-foreground bg-background px-8 py-3.5 rounded-full hover:bg-white transition-colors">
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
