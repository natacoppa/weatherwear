import { NextRequest, NextResponse } from "next/server";
import {
  fetchWeather,
  geocode,
  analyzeByTimeOfDay,
} from "@/lib/weather";
import { generateOutfitRecommendations } from "@/lib/outfit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const day = searchParams.get("day"); // "YYYY-MM-DD" or index "0"-"6"

  try {
    let latitude: number;
    let longitude: number;
    let locationName: string;

    if (query) {
      const geo = await geocode(query);
      if (!geo) {
        return NextResponse.json(
          { error: "Location not found" },
          { status: 404 }
        );
      }
      latitude = geo.lat;
      longitude = geo.lon;
      locationName = [geo.name, geo.admin1, geo.country]
        .filter(Boolean)
        .join(", ");
    } else if (lat && lon) {
      latitude = parseFloat(lat);
      longitude = parseFloat(lon);
      const geo = await geocode(`${lat},${lon}`);
      locationName = geo
        ? [geo.name, geo.admin1].filter(Boolean).join(", ")
        : `${lat}, ${lon}`;
    } else {
      return NextResponse.json(
        { error: "Provide either q (location name) or lat/lon" },
        { status: 400 }
      );
    }

    const weather = await fetchWeather(latitude, longitude, 7);
    weather.location = locationName;

    // Determine which day to analyze
    let dayIndex = 0;
    if (day) {
      if (day.includes("-")) {
        // "YYYY-MM-DD" format
        dayIndex = weather.daily.findIndex((d) => d.date === day);
        if (dayIndex === -1) dayIndex = 0;
      } else {
        dayIndex = parseInt(day, 10) || 0;
      }
    }
    dayIndex = Math.max(0, Math.min(dayIndex, weather.daily.length - 1));

    const targetDate = weather.daily[dayIndex]?.date;
    const selectedDay = weather.daily[dayIndex];

    const periods = analyzeByTimeOfDay(weather.hourly, weather.elevation, targetDate);

    // Build a single-day weather object for the outfit generator
    const dayWeather = { ...weather, daily: selectedDay };

    const outfit = await generateOutfitRecommendations(
      dayWeather,
      periods,
      locationName
    );

    return NextResponse.json({
      weather,
      selectedDay: dayIndex,
      periods,
      outfit,
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
