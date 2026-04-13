import Image from "next/image";

// Fashion color swatches are content (outfit data), not design tokens —
// intentionally kept as hex literals per review.
interface OutfitItem {
  color: string;
  label: string;
}

interface PaletteColor {
  hex: string;
  label: string;
  light?: boolean; // renders with a border so cream/oatmeal are visible on dune bg
}

interface MockVariant {
  image: string;
  city: string;
  headline: [string, string];
  palette: PaletteColor[];
  morning: { temp: string; summary: string; items: OutfitItem[] };
  midday: { temp: string; summary: string; action: { sign: "+" | "−"; text: string } };
  evening: { temp: string; summary: string; action: { sign: "+" | "−"; text: string } };
  bag: string[];
}

const VARIANTS: Record<"classic" | "funky", MockVariant> = {
  classic: {
    image: "/lifestyle/nyc/nyc-morning.jpg",
    city: "New York, NY",
    headline: ["Manhattan minimal,", "black on cream stone"],
    palette: [
      { hex: "#1a1814", label: "Black" },
      { hex: "#1a2238", label: "Indigo" },
      { hex: "#ece4d2", label: "Cream", light: true },
      { hex: "#5a4a38", label: "Tortoise" },
    ],
    morning: {
      temp: "48°",
      summary: "Crisp Tribeca morning, light reflecting off limestone",
      items: [
        { color: "#1a1814", label: "Cashmere turtleneck" },
        { color: "#1a1814", label: "Tailored wool coat" },
        { color: "#1a2238", label: "Straight dark denim" },
        { color: "#1a1814", label: "Chelsea boots" },
      ],
    },
    midday: { temp: "61°", summary: "Park Ave sun, coat off", action: { sign: "−", text: "Drape the wool coat" } },
    evening: { temp: "51°", summary: "Wind off the East River, coat back on", action: { sign: "+", text: "Wool coat, gold hoops" } },
    bag: ["Tortoise sunnies", "Gold hoops", "Metro card"],
  },
  funky: {
    image: "/lifestyle/nyc-funky/nyc-morning.jpg",
    city: "New York, NY",
    headline: ["Butter yellow & cognac,", "SoHo sidewalks in sun"],
    palette: [
      { hex: "#f5d97a", label: "Butter yellow" },
      { hex: "#8a4a2b", label: "Cognac" },
      { hex: "#3d2818", label: "Chocolate" },
      { hex: "#5a1a1e", label: "Oxblood" },
    ],
    morning: {
      temp: "48°",
      summary: "Crisp SoHo morning, long shadows downtown",
      items: [
        { color: "#f5d97a", label: "Butter cashmere" },
        { color: "#8a4a2b", label: "Cognac leather trench" },
        { color: "#3d2818", label: "Pinstripe trousers" },
        { color: "#1a1814", label: "Platform loafers" },
      ],
    },
    midday: { temp: "61°", summary: "Sun hits hard on Broadway, trench optional", action: { sign: "−", text: "Drape the leather trench" } },
    evening: { temp: "51°", summary: "Wind picks up after sunset, layer up", action: { sign: "+", text: "Trench on, add printed silk scarf" } },
    bag: ["Silk scarf", "Tortoise sunnies", "Metro card"],
  },
};

export function MockOutfitCard({ variant }: { variant: "classic" | "funky" }) {
  const v = VARIANTS[variant];
  return (
    <div className="bg-card w-full">
      {/* Hero image with city label */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image src={v.image} alt={`${v.city} morning`} width={600} height={338} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <div className="absolute top-3 left-4">
          <p className="text-[9px] uppercase tracking-[0.22em] text-white drop-shadow-md font-medium">{v.city}</p>
        </div>
      </div>

      <div className="p-5 pt-3">
        <h3 className="font-[var(--font-serif)] text-[22px] text-foreground leading-[1.1] tracking-[-0.01em] mb-3">
          {v.headline[0]}
          <br />
          {v.headline[1]}
        </h3>

        {/* Palette swatches */}
        <div className="flex items-center gap-1.5 mb-4 pb-4 border-b border-input">
          {v.palette.map((c) => (
            <span
              key={c.label}
              className={`w-6 h-6 rounded-full shadow-sm ${c.light ? "border border-input" : ""}`}
              style={{ backgroundColor: c.hex }}
              title={c.label}
            />
          ))}
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
            <span className="font-[var(--font-serif)] text-[22px] text-foreground leading-none">{v.morning.temp}</span>
          </div>
          <p className="text-[11px] text-muted-foreground italic mb-2.5">{v.morning.summary}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {v.morning.items.map((it) => (
              <div key={it.label} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: it.color }} />
                <p className="text-[12px] text-foreground">{it.label}</p>
              </div>
            ))}
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
            <span className="font-[var(--font-serif)] text-[22px] text-foreground leading-none">{v.midday.temp}</span>
          </div>
          <p className="text-[11px] text-muted-foreground italic mb-2">{v.midday.summary}</p>
          <span className="inline-flex items-center gap-1.5 bg-clay-warm/15 px-2.5 py-1 rounded-full">
            <span className="text-[10px] text-clay-warm font-medium">{v.midday.action.sign}</span>
            <span className="text-[11px] text-foreground">{v.midday.action.text}</span>
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
            <span className="font-[var(--font-serif)] text-[22px] text-foreground leading-none">{v.evening.temp}</span>
          </div>
          <p className="text-[11px] text-muted-foreground italic mb-2">{v.evening.summary}</p>
          <span className="inline-flex items-center gap-1.5 bg-olive/15 px-2.5 py-1 rounded-full">
            <span className="text-[10px] text-olive font-medium">{v.evening.action.sign}</span>
            <span className="text-[11px] text-foreground">{v.evening.action.text}</span>
          </span>
        </div>

        <div className="border-t border-input" />

        {/* Bag */}
        <div className="pt-4 pb-1">
          <p className="text-[9px] uppercase tracking-[0.22em] text-ink-soft mb-2">In your bag</p>
          <div className="flex flex-wrap gap-1.5">
            {v.bag.map((b) => (
              <span key={b} className="text-[11px] text-foreground bg-popover border border-input px-2.5 py-1 rounded-full">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
