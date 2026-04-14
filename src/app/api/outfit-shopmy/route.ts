import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { AIShapeError, assertCreatorOutfitRaw } from "@/lib/ai-shapes";
import { AIParseError, parseAiJson } from "@/lib/parse-ai-json";
import { fetchWeather, geocode, calculateFeelsLike, HourlyForecast } from "@/lib/weather";
import { rateLimit, corsHeaders } from "@/lib/rate-limit";
import { requireApiKey } from "@/lib/api-auth";
import {
  buildCreatorOutfitPrompt,
  classifyTransitionIntensity,
  CREATOR_STYLE_DIRECTIONS,
  formatCreatorWeatherContext,
  selectPromptDirection,
  type PromptMomentWeather,
} from "@/lib/outfit-prompt";
import { buildOutfitSignalBrief } from "@/lib/outfit-signals";
import {
  buildGuardrailRetryInstruction,
  findCreatorOutfitGuardrailViolations,
} from "@/lib/outfit-output-guardrails";
import {
  buildCreatorCandidateSet,
  loadCuratedCreatorCatalog,
  type CuratedCreatorCatalog,
  type CuratedCreatorProduct,
  VALID_CREATOR_USERNAME,
} from "@/lib/creator-catalog";

// ── Image URL rewriting (S3 → static.shopmy.us) ────────────────────

function rewriteImageUrl(url: string): string {
  const uploadsMatch = url.match(/production-shopmyshelf-uploads\.s3[^/]*\.amazonaws\.com\/(.+)/);
  if (uploadsMatch) return `https://static.shopmy.us/uploads/${uploadsMatch[1]}`;
  const pinsMatch = url.match(/production-shopmyshelf-pins\.s3[^/]*\.amazonaws\.com\/(.+)/);
  if (pinsMatch) return `https://static.shopmy.us/pins/${pinsMatch[1]}`;
  return url;
}

// ── Load curated catalog from JSON ──────────────────────────────────

function loadCreatorData(username: string): CuratedCreatorCatalog | null {
  if (!VALID_CREATOR_USERNAME.test(username)) return null;
  return loadCuratedCreatorCatalog(username);
}

// ── Weather analysis ────────────────────────────────────────────────

function analyzeMoment(hours: HourlyForecast[], elevation: number, label: string, timeRange: string): PromptMomentWeather {
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const t = Math.round(avg(hours.map((h) => h.temperature)));
  const hum = Math.round(avg(hours.map((h) => h.humidity)));
  const wind = Math.round(avg(hours.map((h) => h.windSpeed)));
  const uv = Math.round(avg(hours.map((h) => h.uvIndex)) * 10) / 10;
  const cloud = Math.round(avg(hours.map((h) => h.cloudCover)));
  const solar = avg(hours.map((h) => h.solarRadiation));
  const precip = Math.max(...hours.map((h) => h.precipitationProbability));
  const fl = calculateFeelsLike(t, hum, wind, uv, solar, cloud, elevation);
  return { label, timeRange, temp: t, sunFeel: fl.sunFeel, shadeFeel: fl.shadeFeel, humidity: hum, windSpeed: wind, uvIndex: uv, precipChance: precip };
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
    ].filter(Boolean) as PromptMomentWeather[];

    const weatherContext = formatCreatorWeatherContext(moments);
    const transition = classifyTransitionIntensity(moments);
    const signalBrief = buildOutfitSignalBrief({
      locationName,
      moments,
      transition,
    });

    const relevant = catalog;
    const candidates = buildCreatorCandidateSet(relevant);

    // Fetch candidate images in parallel. Previously sequential: 12
    // images × 100-300ms each = 1-4s of serial I/O. Promise.all cuts this
    // to the slowest single fetch. Order is preserved so the Claude
    // prompt's [${i}] indices remain valid.
    //
    // Per-image timeout guards against a single slow CDN response
    // tanking the whole request (Vercel Hobby tier has a 10s total
    // budget).
    const FETCH_TIMEOUT_MS = 3000;
    const textLabel = (i: number, p: CuratedCreatorProduct, suffix = "") =>
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
    const baseImageContents: Anthropic.Messages.ContentBlockParam[] = blocks.flat();

    const styleDirection = selectPromptDirection(CREATOR_STYLE_DIRECTIONS);
    const promptText = buildCreatorOutfitPrompt({
      locationName,
      day: { tempMin: dayData.tempMin, tempMax: dayData.tempMax },
      weatherContext,
      styleDirection,
      transition,
      signalBrief,
    });
    const createRawOutfit = async (promptOverride: string) => {
      const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            ...baseImageContents,
            { type: "text", text: promptOverride },
          ],
        }],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "";
      return assertCreatorOutfitRaw(parseAiJson(text));
    };

    let raw = await createRawOutfit(promptText);

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
      return {
        index: mapped,
        title: product.title,
        image: product.image,
        url: product.url,
        price: product.price,
        brand: product.brand,
        category: product.category,
        canonicalCategory: product.canonicalCategory,
      };
    };

    const resolveOutfit = (rawOutfit: typeof raw) => ({
      headline: rawOutfit.headline,
      walkOut: {
        summary: rawOutfit.walkOut.summary,
        top: enrichItem(rawOutfit.walkOut.top),
        layer: enrichItem(rawOutfit.walkOut.layer),
        bottom: enrichItem(rawOutfit.walkOut.bottom),
        shoes: enrichItem(rawOutfit.walkOut.shoes),
        accessories: rawOutfit.walkOut.accessories
          .map(enrichItem)
          .filter((x): x is NonNullable<ReturnType<typeof enrichItem>> => x !== null),
      },
      carry: rawOutfit.carry,
      evening: rawOutfit.evening,
      bagEssentials: rawOutfit.bagEssentials,
    });

    let outfit = resolveOutfit(raw);
    let violations = findCreatorOutfitGuardrailViolations(outfit, signalBrief);

    if (violations.length > 0) {
      hallucinated.length = 0;
      raw = await createRawOutfit(`${promptText}\n\n${buildGuardrailRetryInstruction(violations, signalBrief)}`);
      outfit = resolveOutfit(raw);
      violations = findCreatorOutfitGuardrailViolations(outfit, signalBrief);
      if (violations.length > 0) {
        throw new AIShapeError(`weather guardrail violation: ${violations.join("; ")}`, outfit);
      }
    }

    return NextResponse.json({
      location: locationName,
      creator,
      catalogSize: relevant.length,
      incompleteCatalog: creatorData.incomplete,
      coverage: creatorData.coverage,
      catalogUpdatedAt: creatorData.catalogUpdatedAt,
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
