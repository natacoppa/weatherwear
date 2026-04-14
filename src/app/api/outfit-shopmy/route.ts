import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { AIShapeError, assertCreatorOutfitRaw } from "@/lib/ai-shapes";
import { AIParseError, parseAiJson } from "@/lib/parse-ai-json";
import { fetchWeather, geocode, calculateFeelsLike, HourlyForecast } from "@/lib/weather";
import { rateLimit, corsHeaders } from "@/lib/rate-limit";
import { requireApiKey } from "@/lib/api-auth";
import fs from "fs";
import path from "path";

// ── Image URL rewriting (S3 → static.shopmy.us) ────────────────────

function rewriteImageUrl(url: string): string {
  const uploadsMatch = url.match(/production-shopmyshelf-uploads\.s3[^/]*\.amazonaws\.com\/(.+)/);
  if (uploadsMatch) return `https://static.shopmy.us/uploads/${uploadsMatch[1]}`;
  const pinsMatch = url.match(/production-shopmyshelf-pins\.s3[^/]*\.amazonaws\.com\/(.+)/);
  if (pinsMatch) return `https://static.shopmy.us/pins/${pinsMatch[1]}`;
  return url;
}

// ── Load pre-scraped catalog from JSON ──────────────────────────────

interface CatalogProduct {
  id: string | number;
  title: string;
  image: string;
  url: string | null;
  price: number | null;
  brand: string;
  category: string;
  department: string;
}

type CreatorSource = "shopmy" | "ltk";

interface CreatorData {
  products: CatalogProduct[];
  curatorId: number | null; // ShopMy only
  source: CreatorSource;
}

// Usernames are lowercase alphanumerics plus hyphen / underscore / dot.
// Anything outside this is rejected before touching the filesystem to
// prevent path traversal (e.g. `?creator=../../.env`).
const VALID_USERNAME = /^[a-zA-Z0-9_.-]{1,64}$/;

function loadCreatorData(username: string): CreatorData | null {
  if (!VALID_USERNAME.test(username)) return null;
  const filePath = path.join(process.cwd(), "data/creators", `${username}.json`);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    // Detect source: LTK data files have a profileId field; ShopMy has curatorId.
    const source: CreatorSource = data.profileId ? "ltk" : "shopmy";
    return {
      products: data.products || [],
      curatorId: data.curatorId || null,
      source,
    };
  } catch {
    return null;
  }
}

// ── Weather analysis ────────────────────────────────────────────────

interface MomentWeather {
  label: string; timeRange: string; temp: number; sunFeel: number; shadeFeel: number; windSpeed: number; uvIndex: number; precipChance: number;
}

function analyzeMoment(hours: HourlyForecast[], elevation: number, label: string, timeRange: string): MomentWeather {
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const t = Math.round(avg(hours.map((h) => h.temperature)));
  const hum = Math.round(avg(hours.map((h) => h.humidity)));
  const wind = Math.round(avg(hours.map((h) => h.windSpeed)));
  const uv = Math.round(avg(hours.map((h) => h.uvIndex)) * 10) / 10;
  const cloud = Math.round(avg(hours.map((h) => h.cloudCover)));
  const solar = avg(hours.map((h) => h.solarRadiation));
  const precip = Math.max(...hours.map((h) => h.precipitationProbability));
  const fl = calculateFeelsLike(t, hum, wind, uv, solar, cloud, elevation);
  return { label, timeRange, temp: t, sunFeel: fl.sunFeel, shadeFeel: fl.shadeFeel, windSpeed: wind, uvIndex: uv, precipChance: precip };
}

// ── Route ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const unauthed = requireApiKey(req);
  if (unauthed) return unauthed;
  const limited = rateLimit(req);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("q");
  const creator = searchParams.get("creator");

  try {
    if (!city || !creator) {
      return NextResponse.json({ error: "Provide q (city) and creator (username)" }, { status: 400 });
    }

    const creatorData = loadCreatorData(creator);
    if (!creatorData || creatorData.products.length === 0) {
      return NextResponse.json({ error: `No catalog found for @${creator}` }, { status: 404 });
    }
    const catalog = creatorData.products;
    const curatorId = creatorData.curatorId;

    const geo = await geocode(city);
    if (!geo) return NextResponse.json({ error: "Location not found" }, { status: 404 });

    const locationName = [geo.name, geo.admin1, geo.country].filter(Boolean).join(", ");
    const weather = await fetchWeather(geo.lat, geo.lon, 7);
    const dayData = weather.daily[0];
    const targetDate = dayData.date;
    const dayHours = weather.hourly.filter((h) => h.time.startsWith(targetDate));

    // See outfit-day/route.ts for why we parse the hour from the string
    // directly — Open-Meteo `timezone: "auto"` returns bare local-time ISO
    // strings that `new Date(...)` misinterprets in the server's TZ.
    const hourOf = (iso: string) => parseInt(iso.split("T")[1].slice(0, 2), 10);
    const walkOut = dayHours.filter((h) => { const hr = hourOf(h.time); return hr >= 7 && hr <= 9; });
    const midday = dayHours.filter((h) => { const hr = hourOf(h.time); return hr >= 11 && hr <= 15; });
    const evening = dayHours.filter((h) => { const hr = hourOf(h.time); return hr >= 18 && hr <= 22; });

    const moments = [
      walkOut.length > 0 ? analyzeMoment(walkOut, weather.elevation, "Walk out the door", "7–9am") : null,
      midday.length > 0 ? analyzeMoment(midday, weather.elevation, "Midday peak", "11am–3pm") : null,
      evening.length > 0 ? analyzeMoment(evening, weather.elevation, "By evening", "6–10pm") : null,
    ].filter(Boolean) as MomentWeather[];

    const weatherContext = moments.map((m) =>
      `${m.label} (${m.timeRange}): ${m.temp}°F air, sun feel ${m.sunFeel}°, shade feel ${m.shadeFeel}°, wind ${m.windSpeed}mph, UV ${m.uvIndex}, ${m.precipChance}% rain`
    ).join("\n");

    // Filter to outfit-relevant departments. Include both ShopMy names
    // (fine-grained: "Footwear", "Coats & Outerwear") and LTK names
    // (keyword-classified: "Shoes", "Apparel" covers outerwear too).
    const relevant = catalog.filter((p) =>
      ["Apparel", "Footwear", "Shoes", "Activewear", "Bags & Purses", "Accessories", "Coats & Outerwear"].includes(p.department)
    );

    // Select ~16 items most relevant for an outfit (tops, bottoms, layers, shoes, 1-2 bags).
    // Category names differ between ShopMy (fine-grained: "Sweaters",
    // "Jackets") and LTK (keyword-classified: "Knits", "Outerwear").
    // Include both so the same filter works for either source.
    const tops = relevant.filter(p => ["Tops", "Sweaters", "Blouses", "Cardigans", "Knits", "T-Shirts"].includes(p.category));
    const layers = relevant.filter(p => ["Jackets", "Coats", "Blazers", "Outerwear", "Vests"].includes(p.category));
    const bottoms = relevant.filter(p => ["Pants", "Jeans", "Skirts", "Shorts", "Trousers", "Bottoms"].includes(p.category));
    const shoes = relevant.filter(p => p.department === "Footwear" || p.department === "Shoes");
    const bags = relevant.filter(p => p.department === "Bags & Purses").slice(0, 3);
    const dresses = relevant.filter(p => ["Dresses"].includes(p.category));

    // Combine with guaranteed slots per category, shuffle for variety
    const candidateSet = new Set<string | number>();
    const candidates: typeof relevant = [];
    function addFromPool(pool: typeof relevant, max: number) {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      let added = 0;
      for (const item of shuffled) {
        if (!candidateSet.has(item.id) && added < max) {
          candidateSet.add(item.id);
          candidates.push(item);
          added++;
        }
      }
    }
    // Guarantee representation from each category
    addFromPool(tops, 3);
    addFromPool(layers, 3);
    addFromPool(bottoms, 2);
    addFromPool(shoes, 2);
    addFromPool(dresses, 1);
    addFromPool(bags, 1);

    // Fetch candidate images in parallel. Previously sequential: 12
    // images × 100-300ms each = 1-4s of serial I/O. Promise.all cuts this
    // to the slowest single fetch. Order is preserved so the Claude
    // prompt's [${i}] indices remain valid.
    //
    // Per-image timeout guards against a single slow CDN response
    // tanking the whole request (Vercel Hobby tier has a 10s total
    // budget).
    const FETCH_TIMEOUT_MS = 3000;
    const textLabel = (i: number, p: CatalogProduct, suffix = "") =>
      `[${i}] ${p.title} — ${p.brand} — ${p.category} — $${p.price || "?"}${suffix}`;

    const blocks = await Promise.all(
      candidates.map(async (p, i): Promise<Anthropic.Messages.ContentBlockParam[]> => {
        try {
          const imgUrl = rewriteImageUrl(p.image);
          const imgRes = await fetch(imgUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          });
          if (!imgRes.ok) {
            return [{ type: "text", text: textLabel(i, p, " (no image)") }];
          }
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const ct = imgRes.headers.get("content-type") || "image/jpeg";
          const mediaType = ct.includes("png")
            ? ("image/png" as const)
            : ct.includes("webp")
              ? ("image/webp" as const)
              : ("image/jpeg" as const);
          return [
            { type: "text", text: textLabel(i, p) },
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: buffer.toString("base64") },
            },
          ];
        } catch {
          return [{ type: "text", text: textLabel(i, p, " (no image)") }];
        }
      }),
    );
    const imageContents: Anthropic.Messages.ContentBlockParam[] = blocks.flat();

    const styleDirections = [
      "polished minimalist — clean lines, muted tones, understated",
      "relaxed effortless — lived-in textures, easy silhouettes",
      "one bold statement piece anchoring a neutral outfit",
      "tonal — shades of one color family",
      "smart-casual — structured enough for lunch, relaxed for walking",
    ];
    const styleDirection = styleDirections[Math.floor(Math.random() * styleDirections.length)];

    imageContents.push({
      type: "text",
      text: `You are an expert fashion stylist with impeccable taste. Look at the product images above and style a complete, beautiful outfit for ${locationName} today.

Weather: ${Math.round(dayData.tempMin)}°–${Math.round(dayData.tempMax)}°F. ${weatherContext}

Style direction: ${styleDirection}

CRITICAL — match clothing weight to ACTUAL temperature. A thin t-shirt
under a coat at 48°F is wrong even if it looks good. The base layer
has to earn its place on its own at the coldest moment of the day:

- Over 75°F = lightweight breathable only (thin cotton tees, linen, silk camis). No wool, no cashmere, no coats.
- 65–75°F = light cotton / thin knit base, maybe a light jacket for evening.
- 55–65°F = medium base layer (long-sleeve cotton, fine merino, light knit) + jacket.
- 45–55°F = warm base (merino crew, cashmere sweater, turtleneck, thick knit) + substantial coat. DO NOT pick a thin t-shirt here.
- 35–45°F = cashmere/wool sweater + proper winter coat + closed warm shoes.
- Under 35°F = heavy parka, thermal base, insulated boots.

The morning base layer must still work at midday peak — if midday is
warm enough to shed the coat, the base underneath should be comfortable
at that temp without a layer over it.

Look at the actual product images above. Consider colors, textures, proportions, and how pieces look worn together. Style like a real client — every item earns its place. A perfect 3-piece outfit beats a mediocre 5-piece one. If the catalog has no appropriate warm base at the current temp, set "top" to null rather than forcing an inappropriate thin tee.

The outfit should adapt through the day: what to wear walking out, what to adjust at midday, what to put back on by evening.

Use [index] numbers. Set any slot to null if nothing good fits.

JSON only:
{
  "headline": "Max 10 words",
  "walkOut": {
    "summary": "Max 12 words",
    "top": { "index": 0, "title": "name" },
    "layer": { "index": 5, "title": "name" } or null,
    "bottom": { "index": 3, "title": "name" } or null,
    "shoes": { "index": 7, "title": "name" } or null,
    "accessories": [{ "index": 12, "title": "name" }]
  },
  "carry": { "summary": "12 words", "remove": ["item name to take off"], "add": ["item name to put on"], "note": "12 words" },
  "evening": { "summary": "12 words", "add": ["item name to put back on"], "note": "12 words" },
  "bagEssentials": []
}

Return ONLY valid JSON.`
    });

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: imageContents }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const raw = assertCreatorOutfitRaw(parseAiJson(text));

    // Map candidate-space indices back to relevant-space. Returns -1 for
    // hallucinated (out-of-range) indices so enrichItem can null them out.
    const resolveIndex = (idx: number): number => {
      if (idx < 0 || idx >= candidates.length) {
        hallucinated.push(idx);
        return -1;
      }
      return relevant.indexOf(candidates[idx]);
    };
    const hallucinated: number[] = [];

    const enrichItem = (slot: { index: number } | null) => {
      if (!slot) return null;
      const mapped = resolveIndex(slot.index);
      if (mapped < 0 || mapped >= relevant.length) return null;
      const product = relevant[mapped];
      // ShopMy: construct affiliate URL from product ID + curatorId.
      // LTK (+ any future source): the affiliate URL is already in product.url.
      const url =
        creatorData.source === "shopmy" && curatorId
          ? `https://shopmy.us/shop/product/${product.id}?Curator_id=${curatorId}`
          : product.url;
      return {
        index: mapped,
        title: product.title,
        image: product.image,
        url,
        price: product.price,
        brand: product.brand,
      };
    };

    const outfit = {
      headline: raw.headline,
      walkOut: {
        summary: raw.walkOut.summary,
        top: enrichItem(raw.walkOut.top),
        layer: enrichItem(raw.walkOut.layer),
        bottom: enrichItem(raw.walkOut.bottom),
        shoes: enrichItem(raw.walkOut.shoes),
        accessories: raw.walkOut.accessories
          .map(enrichItem)
          .filter((x): x is NonNullable<ReturnType<typeof enrichItem>> => x !== null),
      },
      carry: raw.carry,
      evening: raw.evening,
      bagEssentials: raw.bagEssentials,
    };

    return NextResponse.json({
      location: locationName,
      creator,
      catalogSize: relevant.length,
      day: dayData,
      moments,
      outfit,
      // Surface any hallucinated indices so clients can show a "couldn't
      // match every pick" notice instead of silently dropping items.
      ...(hallucinated.length > 0 && { hallucinatedIndices: hallucinated }),
    });
  } catch (error) {
    if (error instanceof AIParseError || error instanceof AIShapeError) {
      console.error("ShopMy AI response error:", error.message);
      return NextResponse.json(
        { error: "The stylist's response was malformed — try again" },
        { status: 502 },
      );
    }
    console.error("ShopMy outfit error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to generate outfit" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
