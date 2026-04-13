export interface WeatherData {
  location: string;
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  current: {
    temperature: number; // °F
    feelsLike: number;
    humidity: number;
    windSpeed: number; // mph
    windGusts: number;
    uvIndex: number;
    cloudCover: number; // %
    precipitation: number; // mm
    weatherCode: number;
    isDay: boolean;
    solarRadiation: number; // W/m²
  };
  hourly: HourlyForecast[];
  daily: DayForecast[];
}

export interface DayForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  uvIndexMax: number;
  precipitationProbability: number;
  sunrise: string;
  sunset: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  cloudCover: number;
  precipitationProbability: number;
  solarRadiation: number;
  weatherCode: number;
}

export interface FeelsLikeAnalysis {
  sunFeel: number;
  shadeFeel: number;
  label: string;
  description: string;
}

// Weather codes from Open-Meteo WMO
const weatherDescriptions: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export function getWeatherDescription(code: number): string {
  return weatherDescriptions[code] || "Unknown";
}

/**
 * Calculate "sun feel" vs "shade feel" temperature.
 *
 * Sun feel factors in solar radiation warming your body — at high UV/solar
 * radiation, it can feel 10-20°F warmer in direct sun than the air temp suggests.
 * Shade feel accounts for wind chill and humidity without solar gain.
 */
export function calculateFeelsLike(
  temp: number,
  humidity: number,
  windSpeed: number,
  uvIndex: number,
  solarRadiation: number,
  cloudCover: number,
  elevation: number
): FeelsLikeAnalysis {
  // Shade feel: wind chill (cold) or heat index (hot), no solar gain
  let shadeFeel: number;

  if (temp <= 50 && windSpeed > 3) {
    // Wind chill formula (NWS)
    shadeFeel =
      35.74 +
      0.6215 * temp -
      35.75 * Math.pow(windSpeed, 0.16) +
      0.4275 * temp * Math.pow(windSpeed, 0.16);
  } else if (temp >= 80 && humidity > 40) {
    // Heat index (simplified Rothfusz)
    shadeFeel =
      -42.379 +
      2.04901523 * temp +
      10.14333127 * humidity -
      0.22475541 * temp * humidity -
      0.00683783 * temp * temp -
      0.05481717 * humidity * humidity +
      0.00122874 * temp * temp * humidity +
      0.00085282 * temp * humidity * humidity -
      0.00000199 * temp * temp * humidity * humidity;
  } else {
    shadeFeel = temp;
  }

  // Sun feel: add solar radiation warming
  // Solar radiation of ~800-1000 W/m² (full sun) can add 10-20°F of perceived warmth
  // Adjusted by cloud cover and UV intensity
  const solarGain = (solarRadiation / 1000) * (1 - cloudCover / 100) * 15;

  // At high elevation, solar radiation is more intense (thinner atmosphere)
  const elevationBoost = elevation > 5000 ? (elevation - 5000) / 5000 * 3 : 0;

  // UV index directly correlates with how "hot" the sun feels on skin
  const uvBoost = Math.min(uvIndex * 0.8, 8);

  const sunFeel = shadeFeel + solarGain + elevationBoost + uvBoost;

  const diff = Math.round(sunFeel - shadeFeel);
  let label: string;
  let description: string;

  if (diff >= 15) {
    label = "Extreme sun/shade split";
    description = `The sun adds ~${diff}°F of warmth. Layer so you can adapt between sun and shade.`;
  } else if (diff >= 8) {
    label = "Notable sun/shade difference";
    description = `About ${diff}°F warmer in the sun. Bring a layer for when you move to shade.`;
  } else {
    label = "Consistent feel";
    description = "Sun and shade feel similar — dress for the air temperature.";
  }

  return {
    sunFeel: Math.round(sunFeel),
    shadeFeel: Math.round(shadeFeel),
    label,
    description,
  };
}

export interface TimeOfDayWeather {
  period: "daytime" | "night";
  label: string;
  timeRange: string;
  avgTemp: number;
  feelsLike: FeelsLikeAnalysis;
  uvIndex: number;
  windSpeed: number;
  humidity: number;
  precipChance: number;
  cloudCover: number;
  weatherCode: number;
}

export function analyzeByTimeOfDay(
  hourly: HourlyForecast[],
  elevation: number,
  targetDate?: string // "YYYY-MM-DD" — if omitted, uses today and filters past periods
): TimeOfDayWeather[] {
  // Capture `now` once to avoid minute-boundary disagreement between the
  // ISO date and hour reads.
  const now = new Date();
  const todayIso = now.toISOString().split("T")[0];
  const isToday = !targetDate || targetDate === todayIso;
  const currentHour = isToday ? now.getHours() : 0;
  const datePrefix = targetDate || todayIso;

  const periods: {
    period: "daytime" | "night";
    label: string;
    timeRange: string;
    startHour: number;
    endHour: number;
  }[] = [
    { period: "daytime", label: "Daytime", timeRange: "9am – 6pm", startHour: 9, endHour: 18 },
    { period: "night", label: "Night", timeRange: "6pm – 11pm", startHour: 18, endHour: 23 },
  ];

  // For today, filter out periods that have passed. For future days, show all.
  const relevantPeriods = periods.filter((p) => p.endHour > currentHour);

  return relevantPeriods.map((p) => {
    const hours = hourly.filter((h) => {
      if (!h.time.startsWith(datePrefix)) return false;
      // Hour parsed from the bare ISO string — see outfit-day/route.ts.
      const hour = parseInt(h.time.split("T")[1].slice(0, 2), 10);
      return hour >= p.startHour && hour < p.endHour;
    });

    if (hours.length === 0) {
      // Fallback to first available hours
      const fallback = hourly.slice(0, 3);
      hours.push(...fallback);
    }

    const avg = (arr: number[]) =>
      arr.reduce((a, b) => a + b, 0) / arr.length;

    const avgTemp = Math.round(avg(hours.map((h) => h.temperature)));
    const avgHumidity = Math.round(avg(hours.map((h) => h.humidity)));
    const avgWind = Math.round(avg(hours.map((h) => h.windSpeed)));
    const avgUV = Math.round(avg(hours.map((h) => h.uvIndex)) * 10) / 10;
    const avgCloud = Math.round(avg(hours.map((h) => h.cloudCover)));
    const avgSolar = avg(hours.map((h) => h.solarRadiation));
    const maxPrecip = Math.max(...hours.map((h) => h.precipitationProbability));
    const modeWeather = hours[Math.floor(hours.length / 2)]?.weatherCode ?? 0;

    const feelsLike = calculateFeelsLike(
      avgTemp,
      avgHumidity,
      avgWind,
      avgUV,
      avgSolar,
      avgCloud,
      elevation
    );

    return {
      period: p.period,
      label: p.label,
      timeRange: p.timeRange,
      avgTemp,
      feelsLike,
      uvIndex: avgUV,
      windSpeed: avgWind,
      humidity: avgHumidity,
      precipChance: maxPrecip,
      cloudCover: avgCloud,
      weatherCode: modeWeather,
    };
  });
}

export async function fetchWeather(
  lat: number,
  lon: number,
  forecastDays: number = 7
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_gusts_10m,uv_index,cloud_cover,precipitation,weather_code,is_day,direct_normal_irradiance",
    hourly:
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,uv_index,cloud_cover,precipitation_probability,direct_normal_irradiance,weather_code",
    daily:
      "temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,sunrise,sunset",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "auto",
    forecast_days: forecastDays.toString(),
  });

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error(`Weather API error: ${res.status}`);
  }

  const data = await res.json();

  // Defensive: Open-Meteo occasionally omits a param (vendor change, outage,
  // unit mismatch). Asserting upfront produces a clear error instead of
  // NaN values silently flowing into feels-like math and AI prompts.
  if (!data?.hourly?.time || !Array.isArray(data.hourly.time)) {
    throw new Error("Weather API returned unexpected shape (missing hourly.time)");
  }
  const h = data.hourly;
  const get = (key: string, i: number): number => {
    const arr = h[key];
    return Array.isArray(arr) && typeof arr[i] === "number" ? arr[i] : 0;
  };

  const hourly: HourlyForecast[] = h.time.map((time: string, i: number) => ({
    time,
    temperature: get("temperature_2m", i),
    feelsLike: get("apparent_temperature", i),
    humidity: get("relative_humidity_2m", i),
    windSpeed: get("wind_speed_10m", i),
    uvIndex: get("uv_index", i),
    cloudCover: get("cloud_cover", i),
    precipitationProbability: get("precipitation_probability", i),
    solarRadiation: get("direct_normal_irradiance", i),
    weatherCode: get("weather_code", i),
  }));

  return {
    location: "",
    latitude: data.latitude,
    longitude: data.longitude,
    elevation: data.elevation,
    timezone: data.timezone,
    current: {
      temperature: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      windGusts: data.current.wind_gusts_10m,
      uvIndex: data.current.uv_index,
      cloudCover: data.current.cloud_cover,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
      solarRadiation: data.current.direct_normal_irradiance,
    },
    hourly,
    daily: data.daily.time.map((date: string, i: number) => ({
      date,
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      uvIndexMax: data.daily.uv_index_max[i],
      precipitationProbability: data.daily.precipitation_probability_max[i],
      sunrise: data.daily.sunrise[i],
      sunset: data.daily.sunset[i],
    })),
  };
}

/**
 * Fetch historical weather for the same dates last year.
 * Used as a proxy when trip dates are beyond the 7-day forecast window.
 */
export async function fetchHistoricalWeather(
  lat: number,
  lon: number,
  startDate: string, // "YYYY-MM-DD" — the actual trip dates
  endDate: string
): Promise<{ daily: DayForecast[]; hourly: HourlyForecast[]; elevation: number; isHistorical: true }> {
  // Shift dates back 1 year
  const lastYearStart = shiftYear(startDate, -1);
  const lastYearEnd = shiftYear(endDate, -1);

  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly:
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,uv_index,cloud_cover,precipitation_probability,direct_normal_irradiance,weather_code",
    daily:
      "temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,sunrise,sunset",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "auto",
    start_date: lastYearStart,
    end_date: lastYearEnd,
  });

  const res = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error(`Historical weather API error: ${res.status}`);
  }

  const data = await res.json();

  const hourly: HourlyForecast[] = data.hourly.time.map(
    (time: string, i: number) => ({
      // Shift the timestamps forward to this year so the rest of the code works
      time: shiftYear(time, 1),
      temperature: data.hourly.temperature_2m[i],
      feelsLike: data.hourly.apparent_temperature[i],
      humidity: data.hourly.relative_humidity_2m[i],
      windSpeed: data.hourly.wind_speed_10m[i],
      uvIndex: data.hourly.uv_index[i],
      cloudCover: data.hourly.cloud_cover[i],
      precipitationProbability: data.hourly.precipitation_probability?.[i] ?? 0,
      solarRadiation: data.hourly.direct_normal_irradiance[i],
      weatherCode: data.hourly.weather_code[i],
    })
  );

  const daily: DayForecast[] = data.daily.time.map(
    (date: string, i: number) => ({
      // Shift dates forward to this year
      date: shiftYear(date, 1),
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      uvIndexMax: data.daily.uv_index_max[i],
      precipitationProbability: data.daily.precipitation_probability_max?.[i] ?? 0,
      sunrise: shiftYear(data.daily.sunrise[i], 1),
      sunset: shiftYear(data.daily.sunset[i], 1),
    })
  );

  return {
    daily,
    hourly,
    elevation: data.elevation,
    isHistorical: true,
  };
}

function shiftYear(dateStr: string, delta: number): string {
  const year = parseInt(dateStr.substring(0, 4), 10) + delta;
  return year.toString() + dateStr.substring(4);
}

export async function geocode(
  query: string
): Promise<{ name: string; lat: number; lon: number; country: string; admin1: string } | null> {
  // Open-Meteo geocoding doesn't handle "city, state/country" well.
  // Try the full query first, then fall back to just the city part.
  const attempts = [query];
  if (query.includes(",")) {
    attempts.push(query.split(",")[0].trim());
  }

  for (const attempt of attempts) {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(attempt)}&count=5&language=en&format=json`
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      // If original query had a qualifier (state/country), try to match it
      const qualifier = query.includes(",")
        ? query.split(",").slice(1).join(",").trim().toLowerCase()
        : null;

      let best = data.results[0];
      if (qualifier) {
        const match = data.results.find(
          (r: Record<string, string>) =>
            (r.admin1 || "").toLowerCase().includes(qualifier) ||
            (r.country || "").toLowerCase().includes(qualifier) ||
            (r.country_code || "").toLowerCase() === qualifier
        );
        if (match) best = match;
      }

      return {
        name: best.name,
        lat: best.latitude,
        lon: best.longitude,
        country: best.country || "",
        admin1: best.admin1 || "",
      };
    }
  }

  return null;
}
