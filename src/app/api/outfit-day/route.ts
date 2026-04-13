import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  fetchWeather,
  geocode,
  calculateFeelsLike,
  HourlyForecast,
} from "@/lib/weather";
import { rateLimit, corsHeaders } from "@/lib/rate-limit";

interface MomentWeather {
  label: string;
  timeRange: string;
  temp: number;
  feelsLike: number;
  sunFeel: number;
  shadeFeel: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  precipChance: number;
  cloudCover: number;
}

function analyzeMoment(
  hours: HourlyForecast[],
  elevation: number,
  label: string,
  timeRange: string
): MomentWeather {
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const t = Math.round(avg(hours.map((h) => h.temperature)));
  const hum = Math.round(avg(hours.map((h) => h.humidity)));
  const wind = Math.round(avg(hours.map((h) => h.windSpeed)));
  const uv = Math.round(avg(hours.map((h) => h.uvIndex)) * 10) / 10;
  const cloud = Math.round(avg(hours.map((h) => h.cloudCover)));
  const solar = avg(hours.map((h) => h.solarRadiation));
  const precip = Math.max(...hours.map((h) => h.precipitationProbability));
  const fl = calculateFeelsLike(t, hum, wind, uv, solar, cloud, elevation);

  return {
    label,
    timeRange,
    temp: t,
    feelsLike: Math.round(avg(hours.map((h) => h.feelsLike))),
    sunFeel: fl.sunFeel,
    shadeFeel: fl.shadeFeel,
    humidity: hum,
    windSpeed: wind,
    uvIndex: uv,
    precipChance: precip,
    cloudCover: cloud,
  };
}

export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const day = parseInt(searchParams.get("day") || "0", 10);

  try {
    if (!query) {
      return NextResponse.json({ error: "Provide q" }, { status: 400 });
    }

    const geo = await geocode(query);
    if (!geo) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const locationName = [geo.name, geo.admin1, geo.country].filter(Boolean).join(", ");
    const weather = await fetchWeather(geo.lat, geo.lon, 7);
    weather.location = locationName;

    const dayIndex = Math.max(0, Math.min(day, weather.daily.length - 1));
    const targetDate = weather.daily[dayIndex].date;
    const dayData = weather.daily[dayIndex];

    // Filter hourly to target day
    const dayHours = weather.hourly.filter((h) => h.time.startsWith(targetDate));

    // Three moments. Open-Meteo `timezone: "auto"` returns bare local-time
    // strings like "2026-04-13T08:00" with no offset. `new Date(...)` parses
    // these in the server's local timezone (wrong for cities far from the
    // server), so read the hour straight out of the string.
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
      `${m.label} (${m.timeRange}): ${m.temp}°F air, sun feel ${m.sunFeel}°, shade feel ${m.shadeFeel}°, wind ${m.windSpeed}mph, humidity ${m.humidity}%, UV ${m.uvIndex}, ${m.precipChance}% rain`
    ).join("\n");

    // Pick a random color direction so outfits vary across requests
    const colorDirections = [
      "dark and sharp: black, charcoal, navy, oxblood",
      "earthy and rich: olive, burgundy, rust, dark brown, forest green",
      "cool minimalist: slate grey, black, navy, white, ice blue",
      "warm contrast: terracotta, navy, cream, dark olive",
      "all black with one accent color",
      "coastal clean: navy, white, slate blue, sand",
      "jewel tones: deep emerald, burgundy, sapphire, plum",
      "muted naturals: sage, stone, charcoal, mushroom",
    ];
    const colorDirection = colorDirections[Math.floor(Math.random() * colorDirections.length)];

    const prompt = `You're a high-end stylist. You're helping someone in ${locationName} who leaves at 8am and won't be home until 10pm. They need ONE outfit that works all day.

Weather across the day:
${weatherContext}

Range: ${Math.round(dayData.tempMin)}°–${Math.round(dayData.tempMax)}°F

Think in three moments:
1. WALK OUT — what they put on at 8am when it's coldest/most exposed
2. CARRY — what to stash in a bag for the midday shift (remove a layer? add sunglasses? grab an umbrella?)
3. BY EVENING — what to add back or adjust for the nighttime drop

This is ONE outfit that adapts, not three outfits.

Today's color direction: ${colorDirection}. Every garment MUST include its color.

Rules:
- Specific garments + materials WITH COLOR, max 8 words per item (e.g., "Black merino crewneck" not "Merino crewneck")
- Quality materials — cashmere, merino, silk, leather, wool, linen, cotton — but in VARIED colors, not always neutrals
- BANNED as dominant palette: camel, cream, ivory, beige, taupe, oatmeal. Max ONE of these per outfit.
- The "carry" section is about what to ADD or REMOVE, not a second outfit
- Keep everything SHORT
- MATCH CLOTHING WEIGHT TO ACTUAL TEMPERATURE — this is critical:
  - Over 75°F = lightweight breathable fabrics only (linen, cotton, light silk). NO wool, NO cashmere, NO coats, NO heavy layers. Think t-shirts, sundresses, linen pants, sandals.
  - 65-75°F = light layers, cotton or light knits, maybe a light jacket for evening
  - 55-65°F = medium layers, light sweater + jacket
  - 45-55°F = substantial jacket, warm layers
  - 35-45°F = proper winter coat, warm layers, closed boots
  - Under 35°F = heavy parka, thermal layers, insulated boots, gloves, hat

JSON format:
{
  "headline": "Max 10 words — the day's vibe",
  "walkOut": {
    "summary": "How 8am feels in one sentence, max 12 words",
    "top": "What you wear on top leaving the house",
    "layer": "Outerwear/jacket or null",
    "bottom": "Pants/skirt",
    "shoes": "Shoe recommendation",
    "accessories": ["Short item names"]
  },
  "carry": {
    "summary": "What shifts by midday, max 12 words",
    "add": ["Things to pull out of bag or put on"],
    "remove": ["Things to take off or stash"],
    "note": "One practical tip, max 12 words"
  },
  "evening": {
    "summary": "How evening feels, max 12 words",
    "add": ["Things to put back on or add"],
    "note": "One tip for the night portion, max 12 words"
  },
  "bagEssentials": ["What to have in your bag all day — short names"]
}

Return ONLY valid JSON.`;

    const client = new Anthropic({ apiKey: process.env.WW_ANTHROPIC_API_KEY! });
    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
    const outfit = JSON.parse(cleaned);

    return NextResponse.json({
      location: locationName,
      day: dayData,
      dayIndex,
      totalDays: weather.daily.length,
      moments,
      outfit,
    });
  } catch (error) {
    console.error("Outfit day API error:", error);
    return NextResponse.json({ error: "Failed to generate outfit" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
