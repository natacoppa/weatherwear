import Anthropic from "@anthropic-ai/sdk";
import { DayForecast, TimeOfDayWeather, WeatherData } from "./weather";

// The API route passes a single day's forecast instead of the full array
type WeatherWithDay = Omit<WeatherData, "daily"> & { daily: DayForecast };

export interface OutfitRecommendation {
  period: string;
  timeRange: string;
  sunFeel: number;
  shadeFeel: number;
  summary: string;
  top: string;
  outerwear: string | null;
  bottom: string;
  shoes: string;
  accessories: string[];
  materialNote: string;
  layeringTip: string | null;
}

export interface OutfitResponse {
  headline: string;
  vibe: string;
  periods: OutfitRecommendation[];
  allDayEssentials: string[];
}

export async function generateOutfitRecommendations(
  weather: WeatherWithDay,
  periods: TimeOfDayWeather[],
  locationName: string
): Promise<OutfitResponse> {
  try {
    const result = await generateWithAI(weather, periods, locationName);
    return result;
  } catch (e) {
    console.log("AI generation failed, using rule-based fallback:", (e as Error).message);
    return generateRuleBased(weather, periods, locationName);
  }
}

async function generateWithAI(
  weather: WeatherWithDay,
  periods: TimeOfDayWeather[],
  locationName: string
): Promise<OutfitResponse> {
  const weatherContext = periods
    .map(
      (p) => `
${p.label} (${p.timeRange}):
  - Air temp: ${p.avgTemp}°F
  - In the sun it feels like: ${p.feelsLike.sunFeel}°F
  - In the shade it feels like: ${p.feelsLike.shadeFeel}°F
  - Sun/shade note: ${p.feelsLike.description}
  - UV index: ${p.uvIndex}
  - Wind: ${p.windSpeed} mph
  - Humidity: ${p.humidity}%
  - Cloud cover: ${p.cloudCover}%
  - Precipitation chance: ${p.precipChance}%`
    )
    .join("\n");

  const prompt = `You're a stylist who knows how weather actually feels on your body. Be specific about garments and materials but KEEP IT SHORT. No explanations, no justifications — just the recommendation.

Location: ${locationName} (elevation ${weather.elevation}m)
Range: ${weather.daily.tempMin}°F – ${weather.daily.tempMax}°F | UV max: ${weather.daily.uvIndexMax} | Rain: ${weather.daily.precipitationProbability}%

${weatherContext}

Rules:
- Name exact garments + materials (e.g., "Merino crewneck" not "A warm sweater")
- Big sun/shade split = recommend easy layers
- No suede in rain. No cashmere in humid heat. No cotton in cold + wet.
- Wind amplifies cold significantly

CRITICAL FORMATTING RULES:
- "top", "outerwear", "bottom", "shoes": MAX 8 words each. Just the garment + material. e.g., "Linen camp-collar shirt" or "Cashmere quarter-zip sweater"
- "summary": 1 short sentence, max 12 words
- "accessories": max 4 words per item, e.g., "Polarized sunglasses", "Wool scarf"
- "materialNote": 1 sentence, max 15 words
- "layeringTip": 1 sentence, max 15 words, or null
- "headline": max 10 words
- "allDayEssentials": max 3 words per item, e.g., "SPF 30+", "Compact umbrella"

JSON format:
{
  "headline": "Short punchy line, max 10 words",
  "vibe": "2-3 words",
  "periods": [
    {
      "period": "Daytime|Night",
      "timeRange": "7am – 5pm",
      "sunFeel": 72,
      "shadeFeel": 58,
      "summary": "Short sentence about how it feels",
      "top": "Garment + material, max 8 words",
      "outerwear": "Garment or null",
      "bottom": "Garment + material",
      "shoes": "Shoe type + material",
      "accessories": ["Short item name"],
      "materialNote": "Why these materials, one sentence",
      "layeringTip": "Short tip or null"
    }
  ],
  "allDayEssentials": ["Short item names"]
}

Return ONLY valid JSON, no markdown.`;

  const client = new Anthropic({ apiKey: process.env.WW_ANTHROPIC_API_KEY! });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const cleaned = text.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned) as OutfitResponse;
}

// ── Rule-based fallback ──────────────────────────────────────────────

interface Conditions {
  sunFeel: number;
  shadeFeel: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  precipChance: number;
  cloudCover: number;
}

function pickTop(c: Conditions): string {
  const sf = c.sunFeel;
  const shade = c.shadeFeel;
  const humid = c.humidity > 65;

  if (sf >= 85 && humid) return "Lightweight linen camp-collar shirt — breathable and won't cling in humidity";
  if (sf >= 85) return "Cotton-jersey crew-neck tee — lightweight and breathable for the heat";
  if (sf >= 75 && humid) return "Linen-blend short-sleeve button-down — airy weave handles moisture";
  if (sf >= 75) return "Pima cotton t-shirt or lightweight poplin short-sleeve shirt";
  if (sf >= 65 && shade >= 55) return "Long-sleeve cotton Breton stripe or lightweight chambray shirt";
  if (sf >= 65 && shade < 55) return "Merino wool crewneck sweater — warm in shade, breathable in sun";
  if (sf >= 55 && shade >= 45) return "Cotton-cashmere quarter-zip or mid-weight merino crewneck";
  if (sf >= 55 && shade < 45) return "Lambswool turtleneck — seals warmth at the neck for cold shade stretches";
  if (sf >= 45) return "Chunky merino fisherman sweater or heavyweight cotton waffle-knit henley";
  if (sf >= 35) return "Cashmere turtleneck or heavy merino roll-neck — insulation without bulk";
  return "Thermal base layer under a heavy cashmere or lambswool turtleneck";
}

function pickOuterwear(c: Conditions): string | null {
  const sf = c.sunFeel;
  const shade = c.shadeFeel;
  const wet = c.precipChance > 40;
  const windy = c.windSpeed > 12;
  const bigSplit = sf - shade > 12;

  if (sf >= 80 && !wet && !windy) return null;
  if (sf >= 75 && wet) return "Lightweight waterproof shell — packable for sudden showers";
  if (sf >= 75 && windy) return "Unlined cotton windbreaker — blocks gusts without overheating";
  if (sf >= 75) return null;

  if (sf >= 65 && wet) return "Water-resistant trench coat or waxed cotton jacket";
  if (sf >= 65 && bigSplit) return "Lightweight cotton chore jacket — easy to take off in the sun, essential in shade";
  if (sf >= 65 && windy) return "Unstructured cotton blazer or lightweight bomber jacket";
  if (sf >= 65) return "Light cotton or linen overshirt — optional but good for transitions";

  if (sf >= 55 && wet) return "Waxed cotton field jacket or Gore-Tex rain shell";
  if (sf >= 55 && windy) return "Wool-blend harrington jacket or quilted vest over your layers";
  if (sf >= 55 && bigSplit) return "Zip-front merino cardigan or quilted vest — easy on/off for sun-shade transitions";
  if (sf >= 55) return "Cotton canvas barn jacket or unlined wool blazer";

  if (sf >= 45 && wet) return "Waterproof insulated parka or waxed cotton coat with warm liner";
  if (sf >= 45 && windy) return "Wool peacoat — dense weave blocks wind, structured silhouette";
  if (sf >= 45) return "Wool-blend peacoat or quilted field jacket with corduroy collar";

  if (sf >= 35 && wet) return "Waterproof down parka with sealed seams — non-negotiable";
  if (sf >= 35) return "Heavy wool overcoat or insulated down parka";

  if (wet) return "Full-length waterproof down parka with hood";
  return "Heavyweight insulated parka or shearling-lined coat — serious cold protection";
}

function pickBottom(c: Conditions): string {
  const sf = c.sunFeel;
  const humid = c.humidity > 65;
  const wet = c.precipChance > 40;

  if (sf >= 85 && humid) return "Lightweight linen drawstring trousers or cotton-linen blend shorts";
  if (sf >= 80) return "Cotton chino shorts or lightweight linen trousers";
  if (sf >= 70 && humid) return "Relaxed-fit cotton chinos in a lighter color — avoid dark denim in humidity";
  if (sf >= 70) return "Slim cotton chinos or light-wash denim";
  if (sf >= 55 && wet) return "Dark-wash raw denim or water-resistant cotton twill trousers";
  if (sf >= 55) return "Mid-weight cotton chinos or classic straight-leg denim";
  if (sf >= 45) return "Heavyweight denim or wool-blend trousers — holds warmth better than cotton chinos";
  if (sf >= 35) return "Heavy wool trousers or flannel-lined chinos for cold insulation";
  return "Heavyweight wool trousers or insulated pants — thermal underwear underneath in extremes";
}

function pickShoes(c: Conditions): string {
  const sf = c.sunFeel;
  const wet = c.precipChance > 40;
  const humid = c.humidity > 65;

  if (wet && sf < 50) return "Waterproof leather boots (rubber-soled) — no suede in wet cold";
  if (wet) return "Leather Chelsea boots with rubber sole or clean waterproof sneakers — avoid suede entirely";
  if (sf >= 85 && humid) return "Leather slide sandals or breathable canvas sneakers — feet need airflow";
  if (sf >= 80) return "Canvas low-top sneakers or leather espadrilles — keep it light";
  if (sf >= 70 && humid) return "Breathable leather loafers or perforated leather sneakers — avoid tight leather boots in humidity";
  if (sf >= 70) return "White leather sneakers, suede loafers, or canvas slip-ons";
  if (sf >= 55) return "Suede desert boots, leather derbies, or premium leather sneakers";
  if (sf >= 45) return "Leather Chelsea boots or suede chukkas — pair with heavier socks for warmth";
  if (sf >= 35) return "Insulated leather boots or shearling-lined suede boots";
  return "Insulated waterproof leather boots with wool socks — warmth is everything";
}

function pickAccessories(c: Conditions): string[] {
  const acc: string[] = [];

  if (c.uvIndex >= 6) acc.push("Polarized sunglasses — UV protection is essential above index 6");
  else if (c.uvIndex >= 3 && c.cloudCover < 50) acc.push("Sunglasses — helpful even at moderate UV with direct sun");

  if (c.uvIndex >= 8) acc.push("Wide-brim hat or baseball cap — scalp and face protection at high UV");

  if (c.precipChance > 50) acc.push("Compact umbrella — high rain chance, keep one in your bag");
  else if (c.precipChance > 30) acc.push("Packable rain layer or small umbrella — just in case");

  if (c.windSpeed > 15 && c.shadeFeel < 50) acc.push("Merino wool scarf — wind amplifies cold significantly");
  if (c.shadeFeel < 40) acc.push("Leather or wool-blend gloves");
  if (c.shadeFeel < 35) acc.push("Wool beanie or cashmere-lined hat — major heat loss through the head");

  if (c.sunFeel - c.shadeFeel > 15) acc.push("Light packable layer for transitions — you'll feel the sun/shade swing");

  return acc;
}

function pickEssentials(weather: WeatherWithDay, periods: TimeOfDayWeather[]): string[] {
  const essentials: string[] = [];
  const maxPrecip = Math.max(...periods.map((p) => p.precipChance));
  const maxUV = Math.max(...periods.map((p) => p.uvIndex));
  const minShade = Math.min(...periods.map((p) => p.feelsLike.shadeFeel));
  const maxSun = Math.max(...periods.map((p) => p.feelsLike.sunFeel));
  const bigSwing = maxSun - minShade > 20;

  if (maxUV >= 5) essentials.push("SPF 30+ sunscreen");
  if (maxPrecip > 30) essentials.push("Compact umbrella");
  if (bigSwing) essentials.push("Packable layer for the temperature swing");
  if (maxSun > 80) essentials.push("Water bottle — stay hydrated");

  return essentials;
}

function generateHeadline(weather: WeatherWithDay, periods: TimeOfDayWeather[], location: string): string {
  const maxSun = Math.max(...periods.map((p) => p.feelsLike.sunFeel));
  const minShade = Math.min(...periods.map((p) => p.feelsLike.shadeFeel));
  const spread = maxSun - minShade;
  const wet = weather.daily.precipitationProbability > 50;
  const windy = weather.current.windSpeed > 15;

  if (wet && minShade < 45) return "Cold and wet — prioritize waterproofing and warmth over style";
  if (wet && maxSun > 70) return "Warm but rainy — stay light but keep a waterproof layer close";
  if (wet) return "Rain on the menu — waterproof layers and skip the suede";
  if (spread > 25) return "Deceptive day — massive gap between sun and shade, layer strategically";
  if (spread > 15) return "Sun-drenched but deceptive — it'll feel different in the shade, bring layers";
  if (maxSun > 85) return "Legitimately hot — go lightweight, breathable, and minimal";
  if (maxSun > 75 && !windy) return "Beautiful and warm — dress light, enjoy it";
  if (minShade < 35) return "Bundle up — the cold is real, especially out of the sun";
  if (windy && minShade < 50) return "Wind makes it bite — seal up gaps and add a wind-blocking layer";
  if (windy) return "Breezy day — account for wind chill in your layers";
  return "Comfortable conditions — dress for the transitions as the day shifts";
}

function generateVibe(weather: WeatherWithDay, periods: TimeOfDayWeather[]): string {
  const maxSun = Math.max(...periods.map((p) => p.feelsLike.sunFeel));
  const minShade = Math.min(...periods.map((p) => p.feelsLike.shadeFeel));
  const elevation = weather.elevation;
  const wet = weather.daily.precipitationProbability > 50;

  if (elevation > 1500) return "Alpine crisp";
  if (wet && maxSun < 60) return "Moody layers";
  if (wet) return "Rain-ready";
  if (maxSun > 85) return "Full summer";
  if (maxSun > 75 && minShade > 60) return "Effortless warm";
  if (maxSun > 70 && minShade < 55) return "Sun-shade layers";
  if (minShade < 40) return "Cold-weather polish";
  if (maxSun - minShade > 15) return "Transitional layers";
  return "Easy versatile";
}

function generateRuleBased(
  weather: WeatherWithDay,
  periods: TimeOfDayWeather[],
  locationName: string
): OutfitResponse {
  const outfitPeriods: OutfitRecommendation[] = periods.map((p) => {
    const c: Conditions = {
      sunFeel: p.feelsLike.sunFeel,
      shadeFeel: p.feelsLike.shadeFeel,
      humidity: p.humidity,
      windSpeed: p.windSpeed,
      uvIndex: p.uvIndex,
      precipChance: p.precipChance,
      cloudCover: p.cloudCover,
    };

    const top = pickTop(c);
    const outerwear = pickOuterwear(c);
    const bottom = pickBottom(c);
    const shoes = pickShoes(c);
    const accessories = pickAccessories(c);

    const wet = c.precipChance > 40;
    const humid = c.humidity > 65;
    const cold = c.shadeFeel < 45;
    const bigSplit = c.sunFeel - c.shadeFeel > 12;

    let materialNote: string;
    if (wet && cold) materialNote = "Waterproof and insulating materials are critical — avoid cotton next to skin (holds moisture), skip suede entirely.";
    else if (wet) materialNote = "Water-resistant materials only — no suede, no untreated leather, synthetic or waxed fabrics are your friend.";
    else if (humid && c.sunFeel > 75) materialNote = "Linen and lightweight cotton breathe in humidity — avoid cashmere, heavy knits, and anything that traps moisture.";
    else if (cold) materialNote = "Merino and cashmere insulate without bulk — layer natural fibers for warmth that breathes.";
    else if (bigSplit) materialNote = "Choose layers that are easy to remove — the temperature swing between sun and shade is significant.";
    else materialNote = "Standard materials work well today — cotton, light knits, and leather are all fair game.";

    let layeringTip: string | null = null;
    if (bigSplit) layeringTip = `There's a ${Math.round(c.sunFeel - c.shadeFeel)}° gap between sun and shade — zip-front layers you can quickly open or remove will be your best friend.`;
    else if (c.sunFeel > 70 && c.shadeFeel < 60) layeringTip = "Keep a light layer handy for when you step out of the sun — the drop is noticeable.";

    let summary: string;
    if (c.sunFeel > 80 && c.shadeFeel > 70) summary = "Genuinely warm throughout — dress for heat, not just aesthetics.";
    else if (c.sunFeel > 75 && c.shadeFeel < 60) summary = `The sun is deceptive at ${c.sunFeel}° — step into shade and it drops to ${c.shadeFeel}°.`;
    else if (c.sunFeel > 65 && c.shadeFeel > 55) summary = "Pleasant and mild — comfortable in most layers.";
    else if (c.shadeFeel < 40) summary = `Cold in the shade at ${c.shadeFeel}° — dress for the worst case, not the sunny optimism.`;
    else summary = `Sun at ${c.sunFeel}° and shade at ${c.shadeFeel}° — dress in adaptable layers.`;

    return {
      period: p.label,
      timeRange: p.timeRange,
      sunFeel: p.feelsLike.sunFeel,
      shadeFeel: p.feelsLike.shadeFeel,
      summary,
      top,
      outerwear,
      bottom,
      shoes,
      accessories,
      materialNote,
      layeringTip,
    };
  });

  return {
    headline: generateHeadline(weather, periods, locationName),
    vibe: generateVibe(weather, periods),
    periods: outfitPeriods,
    allDayEssentials: pickEssentials(weather, periods),
  };
}
