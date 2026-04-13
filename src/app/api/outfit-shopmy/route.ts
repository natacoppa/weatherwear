import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fetchWeather, geocode, calculateFeelsLike, HourlyForecast } from "@/lib/weather";
import { rateLimit, corsHeaders } from "@/lib/rate-limit";
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

interface ShopMyProduct {
  id: number;
  title: string;
  image: string;
  url: string | null;
  price: number | null;
  brand: string;
  category: string;
  department: string;
}

function loadCreatorData(username: string): { products: ShopMyProduct[]; curatorId: number | null } | null {
  const filePath = path.join(process.cwd(), "data/creators", `${username}.json`);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return { products: data.products || [], curatorId: data.curatorId || null };
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
  const limited = rateLimit(req);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("q");
  const creator = searchParams.get("creator");

  try {
    if (!city || !creator) {
      return NextResponse.json({ error: "Provide q (city) and creator (ShopMy username)" }, { status: 400 });
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

    const walkOut = dayHours.filter((h) => { const hr = new Date(h.time).getHours(); return hr >= 7 && hr <= 9; });
    const midday = dayHours.filter((h) => { const hr = new Date(h.time).getHours(); return hr >= 11 && hr <= 15; });
    const evening = dayHours.filter((h) => { const hr = new Date(h.time).getHours(); return hr >= 18 && hr <= 22; });

    const moments = [
      walkOut.length > 0 ? analyzeMoment(walkOut, weather.elevation, "Walk out the door", "7–9am") : null,
      midday.length > 0 ? analyzeMoment(midday, weather.elevation, "Midday peak", "11am–3pm") : null,
      evening.length > 0 ? analyzeMoment(evening, weather.elevation, "By evening", "6–10pm") : null,
    ].filter(Boolean) as MomentWeather[];

    const weatherContext = moments.map((m) =>
      `${m.label} (${m.timeRange}): ${m.temp}°F air, sun feel ${m.sunFeel}°, shade feel ${m.shadeFeel}°, wind ${m.windSpeed}mph, UV ${m.uvIndex}, ${m.precipChance}% rain`
    ).join("\n");

    // Filter to outfit-relevant categories
    const relevant = catalog.filter((p) => ["Apparel", "Footwear", "Activewear", "Bags & Purses", "Accessories", "Coats & Outerwear"].includes(p.department));

    // Select ~16 items most relevant for an outfit (tops, bottoms, layers, shoes, 1-2 bags)
    // Cardigans go in tops (as potential base layers), NOT in layers. Layers = jackets/coats only.
    const tops = relevant.filter(p => ["Tops", "Sweaters", "Blouses", "Cardigans"].includes(p.category));
    const layers = relevant.filter(p => ["Jackets", "Coats", "Blazers"].includes(p.category));
    const bottoms = relevant.filter(p => ["Pants", "Jeans", "Skirts", "Shorts", "Trousers"].includes(p.category));
    const shoes = relevant.filter(p => p.department === "Footwear");
    const bags = relevant.filter(p => p.department === "Bags & Purses").slice(0, 3);
    const dresses = relevant.filter(p => ["Dresses"].includes(p.category));

    // Combine with guaranteed slots per category, shuffle for variety
    const candidateSet = new Set<number>();
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

    // Fetch images for candidates and build vision prompt
    const imageContents: Anthropic.Messages.ContentBlockParam[] = [];
    for (let i = 0; i < candidates.length; i++) {
      const p = candidates[i];
      try {
        const imgUrl = rewriteImageUrl(p.image);
        const imgRes = await fetch(imgUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const ct = imgRes.headers.get("content-type") || "image/jpeg";
          const mediaType = ct.includes("png") ? "image/png" as const : ct.includes("webp") ? "image/webp" as const : "image/jpeg" as const;
          imageContents.push(
            { type: "text", text: `[${i}] ${p.title} — ${p.brand} — ${p.category} — $${p.price || "?"}` },
            { type: "image", source: { type: "base64", media_type: mediaType, data: buffer.toString("base64") } },
          );
        } else {
          imageContents.push(
            { type: "text", text: `[${i}] ${p.title} — ${p.brand} — ${p.category} — $${p.price || "?"} (no image)` },
          );
        }
      } catch {
        imageContents.push(
          { type: "text", text: `[${i}] ${p.title} — ${p.brand} — ${p.category} — $${p.price || "?"} (no image)` },
        );
      }
    }

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

Look at the actual images. Consider the colors, textures, proportions, and how each piece would look worn together. Style this like you'd style a real client — every item should earn its place in the outfit. If something doesn't work visually, don't include it. A perfect 3-piece outfit beats a mediocre 5-piece one.

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

    const client = new Anthropic({ apiKey: process.env.WW_ANTHROPIC_API_KEY! });
    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      messages: [{ role: "user", content: imageContents }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    let outfit = JSON.parse(jsonMatch[0]);

    // Map candidate indices back to the relevant array
    function resolveIndex(idx: number) {
      return candidates[idx] ? relevant.indexOf(candidates[idx]) : -1;
    }
    // Fix indices from candidate-space to relevant-space
    if (outfit.walkOut) {
      if (outfit.walkOut.top) outfit.walkOut.top.index = resolveIndex(outfit.walkOut.top.index);
      if (outfit.walkOut.layer) outfit.walkOut.layer.index = resolveIndex(outfit.walkOut.layer.index);
      if (outfit.walkOut.bottom) outfit.walkOut.bottom.index = resolveIndex(outfit.walkOut.bottom.index);
      if (outfit.walkOut.shoes) outfit.walkOut.shoes.index = resolveIndex(outfit.walkOut.shoes.index);
      if (outfit.walkOut.accessories) {
        outfit.walkOut.accessories.forEach((a: { index: number }) => { a.index = resolveIndex(a.index); });
      }
    }

    // Enrich outfit items with product data
    function enrichItem(item: { index: number; title: string } | null) {
      if (!item || item.index < 0 || item.index >= relevant.length) return null;
      const product = relevant[item.index];
      const shopMyUrl = curatorId
        ? `https://shopmy.us/shop/product/${product.id}?Curator_id=${curatorId}`
        : product.url;
      return { ...item, image: product.image, url: shopMyUrl, price: product.price, brand: product.brand };
    }

    if (outfit.walkOut) {
      outfit.walkOut.top = enrichItem(outfit.walkOut.top);
      outfit.walkOut.layer = enrichItem(outfit.walkOut.layer);
      outfit.walkOut.bottom = enrichItem(outfit.walkOut.bottom);
      outfit.walkOut.shoes = enrichItem(outfit.walkOut.shoes);
      if (outfit.walkOut.accessories) {
        outfit.walkOut.accessories = outfit.walkOut.accessories.map(enrichItem).filter(Boolean);
      }
    }

    // Resolve any indices the AI put in carry/evening arrays
    function resolveItemName(val: string | number): string {
      if (typeof val === "number") {
        const item = candidates[val];
        return item ? item.title : String(val);
      }
      return String(val);
    }
    if (outfit.carry?.remove) outfit.carry.remove = outfit.carry.remove.map(resolveItemName);
    if (outfit.carry?.add) outfit.carry.add = outfit.carry.add.map(resolveItemName);
    if (outfit.evening?.add) outfit.evening.add = outfit.evening.add.map(resolveItemName);

    return NextResponse.json({
      location: locationName,
      creator,
      catalogSize: relevant.length,
      day: dayData,
      moments,
      outfit,
    });
  } catch (error) {
    console.error("ShopMy outfit error:", error instanceof Error ? error.message : error, error instanceof Error ? error.stack : "");
    return NextResponse.json({ error: "Failed to generate outfit" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
