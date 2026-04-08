import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  fetchWeather,
  geocode,
  calculateFeelsLike,
  HourlyForecast,
} from "@/lib/weather";

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

    // Three moments
    const walkOut = dayHours.filter((h) => { const hr = new Date(h.time).getHours(); return hr >= 7 && hr <= 9; });
    const midday = dayHours.filter((h) => { const hr = new Date(h.time).getHours(); return hr >= 11 && hr <= 15; });
    const evening = dayHours.filter((h) => { const hr = new Date(h.time).getHours(); return hr >= 18 && hr <= 22; });

    const moments = [
      walkOut.length > 0 ? analyzeMoment(walkOut, weather.elevation, "Walk out the door", "7–9am") : null,
      midday.length > 0 ? analyzeMoment(midday, weather.elevation, "Midday peak", "11am–3pm") : null,
      evening.length > 0 ? analyzeMoment(evening, weather.elevation, "By evening", "6–10pm") : null,
    ].filter(Boolean) as MomentWeather[];

    const weatherContext = moments.map((m) =>
      `${m.label} (${m.timeRange}): ${m.temp}°F air, sun feel ${m.sunFeel}°, shade feel ${m.shadeFeel}°, wind ${m.windSpeed}mph, humidity ${m.humidity}%, UV ${m.uvIndex}, ${m.precipChance}% rain`
    ).join("\n");

    const prompt = `You're a stylist helping someone in ${locationName} who leaves at 8am and won't be home until 10pm. They need ONE outfit that works all day.

Weather across the day:
${weatherContext}

Range: ${Math.round(dayData.tempMin)}°–${Math.round(dayData.tempMax)}°F

Think in three moments:
1. WALK OUT — what they put on at 8am when it's coldest/most exposed
2. CARRY — what to stash in a bag for the midday shift (remove a layer? add sunglasses? grab an umbrella?)
3. BY EVENING — what to add back or adjust for the nighttime drop

This is ONE outfit that adapts, not three outfits.

Rules:
- Specific garments + materials, max 8 words per item
- Practical wardrobe — things normal people own
- The "carry" section is about what to ADD or REMOVE, not a second outfit
- Keep everything SHORT
- BE REALISTIC ABOUT TEMPERATURE. Under 40°F = real winter coat (parka, down jacket, heavy wool coat), NOT a blazer or cardigan. Under 50°F = substantial jacket minimum. A blazer is NOT outerwear in cold weather. Match the weight of clothing to the actual temperature.
- Under 25°F = heavy parka, thermal layers, insulated boots, gloves, hat — no exceptions
- 25-40°F = proper winter coat, warm layers, closed boots
- 40-55°F = medium jacket or heavy sweater, layers
- 55-70°F = light jacket or layer, flexible
- Over 70°F = light clothing, maybe a light layer for AC

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
