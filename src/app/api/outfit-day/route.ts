import { NextRequest, NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { AIShapeError, assertDayOutfit } from "@/lib/ai-shapes";
import { AIParseError, parseAiJson } from "@/lib/parse-ai-json";
import {
  fetchWeather,
  geocode,
  calculateFeelsLike,
  HourlyForecast,
} from "@/lib/weather";
import { rateLimit, corsHeaders } from "@/lib/rate-limit";
import { requireApiKey } from "@/lib/api-auth";
import {
  buildDayOutfitPrompt,
  classifyTransitionIntensity,
  DAY_COLOR_DIRECTIONS,
  formatDayWeatherContext,
  selectPromptDirection,
  type PromptMomentWeather,
} from "@/lib/outfit-prompt";
import { buildOutfitSignalBrief } from "@/lib/outfit-signals";
import { buildGuardrailRetryInstruction, findDayOutfitGuardrailViolations } from "@/lib/outfit-output-guardrails";

function analyzeMoment(
  hours: HourlyForecast[],
  elevation: number,
  label: string,
  timeRange: string
): PromptMomentWeather {
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
    sunFeel: fl.sunFeel,
    shadeFeel: fl.shadeFeel,
    humidity: hum,
    windSpeed: wind,
    uvIndex: uv,
    precipChance: precip,
  };
}

export async function GET(req: NextRequest) {
  const unauthed = requireApiKey(req);
  if (unauthed) return unauthed;
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
    ].filter(Boolean) as PromptMomentWeather[];

    const weatherContext = formatDayWeatherContext(moments);
    const colorDirection = selectPromptDirection(DAY_COLOR_DIRECTIONS);
    const transition = classifyTransitionIntensity(moments);
    const signalBrief = buildOutfitSignalBrief({
      locationName,
      moments,
      transition,
    });
    const prompt = buildDayOutfitPrompt({
      locationName,
      day: { tempMin: dayData.tempMin, tempMax: dayData.tempMax },
      weatherContext,
      colorDirection,
      transition,
      signalBrief,
    });
    const createOutfit = async (promptText: string) => {
      const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 800,
        messages: [{ role: "user", content: promptText }],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "";
      return assertDayOutfit(parseAiJson(text));
    };

    let outfit = await createOutfit(prompt);
    let violations = findDayOutfitGuardrailViolations(outfit, signalBrief);

    if (violations.length > 0) {
      outfit = await createOutfit(`${prompt}\n\n${buildGuardrailRetryInstruction(violations, signalBrief)}`);
      violations = findDayOutfitGuardrailViolations(outfit, signalBrief);
      if (violations.length > 0) {
        throw new AIShapeError(`weather guardrail violation: ${violations.join("; ")}`, outfit);
      }
    }

    return NextResponse.json({
      location: locationName,
      day: dayData,
      dayIndex,
      totalDays: weather.daily.length,
      moments,
      outfit,
    });
  } catch (error) {
    if (error instanceof AIParseError || error instanceof AIShapeError) {
      console.error("Outfit day AI response error:", error.message);
      return NextResponse.json(
        { error: "The stylist's response was malformed — try again" },
        { status: 502 },
      );
    }
    console.error("Outfit day API error:", error);
    return NextResponse.json({ error: "Failed to generate outfit" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
