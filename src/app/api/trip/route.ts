import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  fetchWeather,
  geocode,
  analyzeByTimeOfDay,
} from "@/lib/weather";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    if (!query) {
      return NextResponse.json({ error: "Provide q (location name)" }, { status: 400 });
    }

    const geo = await geocode(query);
    if (!geo) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const locationName = [geo.name, geo.admin1, geo.country].filter(Boolean).join(", ");
    const weather = await fetchWeather(geo.lat, geo.lon, 7);
    weather.location = locationName;

    // Filter days to the selected date range
    const filteredDays = weather.daily.filter((day) => {
      if (startDate && endDate) return day.date >= startDate && day.date <= endDate;
      return true;
    });
    const today = new Date().toISOString().split("T")[0];

    const tripDays = filteredDays.map((day) => {
      const periods = analyzeByTimeOfDay(weather.hourly, weather.elevation, day.date);
      const date = new Date(day.date + "T12:00:00");
      const dayName = day.date === today ? "Today" : date.toLocaleDateString("en-US", { weekday: "long" });

      return {
        dayName,
        date: day.date,
        tempRange: `${Math.round(day.tempMin)}–${Math.round(day.tempMax)}°F`,
        uvMax: day.uvIndexMax,
        precipChance: day.precipitationProbability,
        periods: periods.map((p) => ({
          period: p.label,
          sunFeel: p.feelsLike.sunFeel,
          shadeFeel: p.feelsLike.shadeFeel,
          wind: p.windSpeed,
          humidity: p.humidity,
        })),
      };
    });

    const prompt = `You're a smart packer who understands weather. Someone is traveling to ${locationName} for ${tripDays.length} days. Help them pack.

Here's the weather for each day:
${tripDays.map((d) => `${d.dayName} (${d.date}): ${d.tempRange}, UV ${d.uvMax}, ${d.precipChance}% rain
  ${d.periods.map((p) => `${p.period}: sun ${p.sunFeel}°, shade ${p.shadeFeel}°, wind ${p.wind}mph, humidity ${p.humidity}%`).join("\n  ")}`).join("\n")}

Create a CONSOLIDATED packing list. Not 7 outfits — one list of what to pack.

Rules:
- Name specific garments + materials (merino crewneck, not "warm sweater")
- Consolidate: if they need a warm layer every day, say "1 warm layer" not "7 warm layers"
- Tell them quantities: "3 cotton tees" not just "cotton tees"
- Call out what NOT to bring: "skip suede — 4 days of rain" or "no heavy coat needed"
- Be practical about normal wardrobes — not everyone owns cashmere
- Keep each item SHORT: garment + material + quantity, max 8 words

CRITICAL: Keep it concise. This is a packing list, not an essay.

JSON format:
{
  "headline": "Pack summary in max 8 words",
  "weatherSummary": "1-2 sentences about the weather across the trip",
  "categories": [
    {
      "name": "Tops",
      "items": ["2 long-sleeve merino or cotton tees", "1 lightweight button-down"]
    },
    {
      "name": "Layers",
      "items": ["1 medium-weight jacket or fleece"]
    },
    {
      "name": "Bottoms",
      "items": ["2 jeans or heavy chinos"]
    },
    {
      "name": "Shoes",
      "items": ["1 waterproof boots — rain expected"]
    },
    {
      "name": "Accessories",
      "items": ["Wool scarf", "Gloves"]
    }
  ],
  "skipList": ["Items they should NOT bring and why"],
  "proTip": "One useful tip for this specific trip, max 15 words"
}

Return ONLY valid JSON, no markdown.`;

    const client = new Anthropic({ apiKey: process.env.WW_ANTHROPIC_API_KEY! });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
    const packingList = JSON.parse(cleaned);

    return NextResponse.json({
      location: locationName,
      days: tripDays,
      packingList,
    });
  } catch (error) {
    console.error("Trip API error:", error);
    return NextResponse.json({ error: "Failed to generate packing list" }, { status: 500 });
  }
}
