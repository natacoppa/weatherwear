import Link from "next/link";
import { Nav } from "@/components/nav";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="text-[13px] leading-relaxed text-ink-subtle bg-card rounded-2xl p-5 overflow-x-auto border border-border">
      <code>{children}</code>
    </pre>
  );
}

function Endpoint({ method, path, description, children }: {
  method: string; path: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden" id={path.replace(/\//g, "-").slice(1)}>
      <div className="p-5 md:p-6 bg-card">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[11px] font-mono font-semibold text-olive bg-olive/10 px-2.5 py-1 rounded-lg">{method}</span>
          <code className="text-[14px] md:text-[15px] font-mono text-foreground">{path}</code>
        </div>
        <p className="text-[14px] text-muted-foreground">{description}</p>
      </div>
      <div className="p-5 md:p-6 space-y-5">
        {children}
      </div>
    </div>
  );
}

function ParamTable({ params }: { params: { name: string; type: string; required: boolean; description: string }[] }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft font-medium mb-3">Parameters</p>
      <div className="space-y-2">
        {params.map((p) => (
          <div key={p.name} className="flex items-start gap-3 text-[13px]">
            <code className="text-olive font-mono shrink-0">{p.name}</code>
            <span className="text-ink-faint shrink-0">{p.type}</span>
            {p.required && <span className="text-[10px] text-clay-warm bg-clay-warm/10 px-1.5 py-0.5 rounded font-medium shrink-0">required</span>}
            <span className="text-muted-foreground">{p.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Nav showCta />

      <div className="max-w-[860px] mx-auto px-6 pt-12 md:pt-20 pb-20">
        <p className="text-[11px] uppercase tracking-[0.25em] text-olive font-medium mb-4">API Reference</p>
        <h1 className="font-[var(--font-serif)] text-[32px] md:text-[44px] text-foreground leading-tight mb-4">
          WeatherWear API
        </h1>
        <p className="text-[16px] text-muted-foreground leading-relaxed max-w-[560px] mb-6">
          Get AI-powered outfit recommendations and packing lists based on real-time weather data. All endpoints return JSON.
        </p>

        <div className="rounded-xl bg-olive/10 p-4 mb-14">
          <p className="text-[13px] text-olive leading-relaxed">
            <span className="font-medium">Base URL:</span>{" "}
            <code className="font-mono">https://weatherwear-blush.vercel.app/api</code>
          </p>
          <p className="text-[12px] text-olive/70 mt-1">
            Rate limited to 50 requests per hour per IP. No API key required.
          </p>
        </div>

        <div className="space-y-8">
          {/* Outfit Day */}
          <Endpoint method="GET" path="/api/outfit-day" description="Get a full outfit recommendation for a specific day.">
            <ParamTable params={[
              { name: "q", type: "string", required: true, description: "City or location name" },
              { name: "day", type: "number", required: false, description: "Day index (0 = today, 1 = tomorrow, up to 6). Default: 0" },
            ]} />

            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft font-medium mb-3">Example request</p>
              <CodeBlock>{`curl "https://weatherwear-blush.vercel.app/api/outfit-day?q=New+York&day=0"`}</CodeBlock>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft font-medium mb-3">Response</p>
              <CodeBlock>{`{
  "location": "New York, New York, United States",
  "day": {
    "date": "2026-04-10",
    "tempMax": 68,
    "tempMin": 52,
    "uvIndexMax": 5.2,
    "precipitationProbability": 20
  },
  "dayIndex": 0,
  "totalDays": 7,
  "moments": [
    {
      "label": "Walk out the door",
      "timeRange": "7–9am",
      "temp": 54,
      "sunFeel": 62,
      "shadeFeel": 50,
      "windSpeed": 8,
      "uvIndex": 1.2,
      "precipChance": 10
    },
    { "label": "Midday", "timeRange": "11am–3pm", ... },
    { "label": "Evening", "timeRange": "6–10pm", ... }
  ],
  "outfit": {
    "headline": "Olive layers, warm neutrals",
    "walkOut": {
      "summary": "Crisp morning, layer up",
      "top": "Sage green merino crewneck",
      "layer": "Caramel cotton chore jacket",
      "bottom": "Dark wash straight-leg jeans",
      "shoes": "White leather sneakers",
      "accessories": ["Tortoise sunglasses"]
    },
    "carry": {
      "summary": "Warm enough to shed the jacket",
      "add": [],
      "remove": ["Chore jacket"],
      "note": "Stash in bag, you'll want it back by 6pm"
    },
    "evening": {
      "summary": "Pull the jacket back on",
      "add": ["Chore jacket"],
      "note": "Wind picks up after sunset"
    },
    "bagEssentials": ["SPF 30", "Light scarf"]
  }
}`}</CodeBlock>
            </div>
          </Endpoint>

          {/* Trip */}
          <Endpoint method="GET" path="/api/trip" description="Get a consolidated packing list for a multi-day trip.">
            <ParamTable params={[
              { name: "q", type: "string", required: true, description: "Destination city or location" },
              { name: "startDate", type: "string", required: true, description: "Start date in YYYY-MM-DD format" },
              { name: "endDate", type: "string", required: true, description: "End date in YYYY-MM-DD format" },
            ]} />

            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft font-medium mb-3">Example request</p>
              <CodeBlock>{`curl "https://weatherwear-blush.vercel.app/api/trip?q=Paris&startDate=2026-04-15&endDate=2026-04-19"`}</CodeBlock>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft font-medium mb-3">Response</p>
              <CodeBlock>{`{
  "location": "Paris, Ile-de-France, France",
  "isHistorical": false,
  "days": [
    {
      "dayName": "Wednesday",
      "date": "2026-04-15",
      "tempRange": "48–62°F",
      "precipChance": 30
    },
    ...
  ],
  "packingList": {
    "headline": "Layered neutrals, rain-ready",
    "weatherSummary": "Cool mornings, mild afternoons with scattered showers",
    "categories": [
      {
        "name": "Tops",
        "items": [
          "2 long-sleeve cotton shirts",
          "1 lightweight merino sweater"
        ]
      },
      { "name": "Bottoms", "items": [...] },
      { "name": "Outerwear", "items": [...] },
      { "name": "Shoes", "items": [...] },
      { "name": "Accessories", "items": [...] }
    ],
    "skipList": ["Heavy coat", "Shorts"],
    "proTip": "Pack a compact umbrella — afternoon showers likely"
  }
}`}</CodeBlock>
            </div>
          </Endpoint>

          {/* Outfit Image */}
          <Endpoint method="POST" path="/api/outfit-image" description="Generate a fashion editorial image for an outfit. Returns a base64-encoded PNG.">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft font-medium mb-3">Request body</p>
              <CodeBlock>{`{
  "outfit": {
    "headline": "Olive layers, warm neutrals",
    "walkOut": {
      "top": "Sage green merino crewneck",
      "layer": "Caramel cotton chore jacket",
      "bottom": "Dark wash straight-leg jeans",
      "shoes": "White leather sneakers"
    }
  },
  "location": "New York, New York",
  "temp": 60
}`}</CodeBlock>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft font-medium mb-3">Response</p>
              <CodeBlock>{`{
  "image": "data:image/png;base64,iVBOR..."
}`}</CodeBlock>
              <p className="text-[12px] text-ink-faint mt-2">
                Image generation uses more resources. Consider caching results on your end.
              </p>
            </div>
          </Endpoint>
        </div>

        {/* Notes */}
        <div className="mt-14 space-y-6">
          <h2 className="font-[var(--font-serif)] text-[24px] text-foreground">Notes</h2>
          <div className="space-y-4 text-[14px] text-muted-foreground leading-relaxed">
            <p>
              <span className="font-medium text-ink-subtle">Weather data</span> comes from Open-Meteo and covers 7-day forecasts. For trip dates beyond the forecast window, historical averages are used instead.
            </p>
            <p>
              <span className="font-medium text-ink-subtle">Outfit generation</span> uses Claude Sonnet to reason about temperature, UV, wind, and precipitation — then recommends specific garments with colors and fabrics.
            </p>
            <p>
              <span className="font-medium text-ink-subtle">Rate limits</span> are 50 requests per hour per IP address. If you need higher limits for production use, reach out.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-[860px] mx-auto px-6 py-10 border-t border-border flex items-center justify-between">
        <Link href="/" className="font-[var(--font-serif)] text-[14px] text-ink-faint hover:text-foreground transition-colors">
          Well Suited
        </Link>
        <Link href="/app" className="text-[13px] text-ink-faint hover:text-foreground transition-colors">
          Open App
        </Link>
      </footer>
    </main>
  );
}
