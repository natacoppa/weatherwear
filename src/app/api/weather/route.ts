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
      // Reverse geocode for display name
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

    const weather = await fetchWeather(latitude, longitude);
    weather.location = locationName;

    const periods = analyzeByTimeOfDay(weather.hourly, weather.elevation);
    const outfit = await generateOutfitRecommendations(
      weather,
      periods,
      locationName
    );

    return NextResponse.json({
      weather,
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
