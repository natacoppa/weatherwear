import type Anthropic from "@anthropic-ai/sdk";
import type {
  OutfitSignalBrief,
  PromptDaySummary,
  PromptMomentWeather,
  TransitionAssessment,
} from "@/lib/outfit-signals";
export type {
  OutfitSignalBrief,
  PromptDaySummary,
  PromptMomentWeather,
  TransitionAssessment,
  TransitionIntensity,
} from "@/lib/outfit-signals";

export interface CreatorBenchmarkCandidateImage {
  mediaType: "image/png" | "image/jpeg" | "image/webp";
  data: string;
}

export interface CreatorBenchmarkCandidate {
  title: string;
  brand: string;
  category: string;
  price: number | null;
  image?: CreatorBenchmarkCandidateImage | null;
}

export const DAY_COLOR_DIRECTIONS = [
  "dark and sharp: black, charcoal, navy, oxblood",
  "earthy and rich: olive, burgundy, rust, dark brown, forest green",
  "cool minimalist: slate grey, black, navy, white, ice blue",
  "warm contrast: terracotta, navy, cream, dark olive",
  "all black with one accent color",
  "coastal clean: navy, white, slate blue, sand",
  "jewel tones: deep emerald, burgundy, sapphire, plum",
  "muted naturals: sage, stone, charcoal, mushroom",
] as const;

export const CREATOR_STYLE_DIRECTIONS = [
  "polished minimalist — clean lines, muted tones, understated",
  "relaxed effortless — lived-in textures, easy silhouettes",
  "one bold statement piece anchoring a neutral outfit",
  "tonal — shades of one color family",
  "smart-casual — structured enough for lunch, relaxed for walking",
] as const;

function cityName(locationName: string): string {
  return locationName.split(",")[0]?.trim() || locationName;
}

export function buildCityVibeInstruction(locationName: string): string {
  const city = cityName(locationName);
  return `How do people in ${city} actually dress? Let the local style culture — the pace, the vibe, what's normal on the street — shape this outfit as much as the temperature does.`;
}

export function buildAnchorPieceInstruction(mode: "day" | "creator"): string {
  const anchor = mode === "creator"
    ? "Style the outfit around ONE anchor piece from the visible candidate set — the most visually interesting or distinctive item."
    : "Style the outfit around ONE anchor piece — the most visually interesting or distinctive garment in the look.";
  return `${anchor} Everything else should support the anchor with a complementary palette, balanced volume, and intentional proportions. If the anchor is relaxed or oversized, the supporting pieces should be cleaner or more fitted, and vice versa. The outfit should feel like it has a point of view, not like a checklist of weather-appropriate items.`;
}

export function classifyTransitionIntensity(moments: PromptMomentWeather[]): TransitionAssessment {
  if (moments.length < 2) {
    return {
      intensity: "stable",
      summary: "single-moment day",
      promptGuidance: "Conditions do not shift enough to justify transition choreography. Keep carry and evening minimal, and if nothing materially changes, say \"Outfit holds all day\" with empty add/remove lists.",
    };
  }

  let maxThermalShift = 0;
  let maxPrecipShift = 0;
  let maxWindShift = 0;

  for (let index = 1; index < moments.length; index += 1) {
    const prev = moments[index - 1];
    const next = moments[index];
    maxThermalShift = Math.max(
      maxThermalShift,
      Math.abs(next.temp - prev.temp),
      Math.abs(next.sunFeel - prev.sunFeel),
      Math.abs(next.shadeFeel - prev.shadeFeel),
    );
    maxPrecipShift = Math.max(maxPrecipShift, Math.abs(next.precipChance - prev.precipChance));
    maxWindShift = Math.max(maxWindShift, Math.abs(next.windSpeed - prev.windSpeed));
  }

  if (maxThermalShift > 10 || maxPrecipShift >= 30 || maxWindShift >= 8) {
    return {
      intensity: "significant",
      summary: "meaningful shift across the day",
      promptGuidance: "The weather shifts enough to matter. Describe only the carry and evening changes that genuinely improve comfort or polish, and keep them specific.",
    };
  }

  if (maxThermalShift > 6 || maxPrecipShift >= 15 || maxWindShift >= 5) {
    return {
      intensity: "moderate",
      summary: "noticeable but manageable shift",
      promptGuidance: "The day changes a bit, but do not overreact. Mention adjustments only if they genuinely improve comfort, and keep carry/evening concise.",
    };
  }

  return {
    intensity: "stable",
    summary: "stable day",
    promptGuidance: "Conditions stay fairly steady. Keep carry and evening minimal, and if no real change is needed, say \"Outfit holds all day\" with empty add/remove lists.",
  };
}

export function selectPromptDirection<T extends readonly string[]>(
  directions: T,
  options: { random?: () => number; index?: number } = {},
): T[number] {
  if (options.index !== undefined) {
    const normalized = ((options.index % directions.length) + directions.length) % directions.length;
    return directions[normalized];
  }
  const random = options.random || Math.random;
  return directions[Math.floor(random() * directions.length)];
}

export function formatDayWeatherContext(moments: PromptMomentWeather[]): string {
  return moments
    .map((moment) =>
      `${moment.label} (${moment.timeRange}): ${moment.temp}°F air, sun feel ${moment.sunFeel}°, shade feel ${moment.shadeFeel}°, wind ${moment.windSpeed}mph, humidity ${moment.humidity ?? "?"}%, UV ${moment.uvIndex}, ${moment.precipChance}% rain`,
    )
    .join("\n");
}

export function formatCreatorWeatherContext(moments: PromptMomentWeather[]): string {
  return moments
    .map((moment) =>
      `${moment.label} (${moment.timeRange}): ${moment.temp}°F air, sun feel ${moment.sunFeel}°, shade feel ${moment.shadeFeel}°, wind ${moment.windSpeed}mph, UV ${moment.uvIndex}, ${moment.precipChance}% rain`,
    )
    .join("\n");
}

function formatSignalBrief(signalBrief: OutfitSignalBrief): string {
  return [
    `- Peak heat: ${signalBrief.peakHeat}`,
    `- Cold floor: ${signalBrief.coldFloor}`,
    `- Transition intensity: ${signalBrief.transition.intensity}`,
    `- Humidity burden: ${signalBrief.humidityBurden}`,
    `- Sun exposure: ${signalBrief.sunExposure}`,
    `- Walking load: ${signalBrief.walkingLoad}`,
    `- Carry tolerance: ${signalBrief.carryTolerance}`,
    `- Style context: ${signalBrief.styleContext}`,
  ].join("\n");
}

function formatGuardrails(signalBrief: OutfitSignalBrief): string {
  const guardrails: string[] = [];

  if (signalBrief.overrides.extremeHeat) {
    guardrails.push("Build for peak heat, not the morning.");
    guardrails.push("Do not use jackets, scarves, sweaters, knits, wool, cashmere, coats, or other unnecessary layers.");
    guardrails.push("Midday changes should be sun-management or heat-relief only, not layering drama.");
  }

  if (signalBrief.overrides.extremeCold) {
    guardrails.push("Warmth beats styling cleverness. Every exposed item must earn its place in severe cold.");
  }

  if (signalBrief.overrides.footwear) {
    guardrails.push("Keep footwear genuinely walkable for a movement-heavy day.");
  }

  return guardrails.length > 0 ? guardrails.map((rule) => `- ${rule}`).join("\n") : "- No special overrides.";
}

export function buildDayOutfitPrompt(input: {
  locationName: string;
  day: PromptDaySummary;
  weatherContext: string;
  colorDirection: string;
  transition: TransitionAssessment;
  signalBrief: OutfitSignalBrief;
}): string {
  const { locationName, day, weatherContext, colorDirection, transition, signalBrief } = input;
  return `You're a high-end stylist. You're helping someone in ${locationName} who leaves at 8am and won't be home until 10pm. They need ONE outfit that works all day.

Weather across the day:
${weatherContext}

Range: ${Math.round(day.tempMin)}°–${Math.round(day.tempMax)}°F

Think in three moments:
1. WALK OUT — what they put on at 8am when it's coldest/most exposed
2. CARRY — what to stash in a bag for the midday shift only if the weather genuinely changes
3. BY EVENING — what to add back or adjust for the nighttime drop only if it really matters

This is ONE outfit that adapts, not three outfits.

Style for the whole day, not just the first hour. If peak heat or severe cold dominates later, the base outfit must still make sense at that harder moment.

${buildCityVibeInstruction(locationName)}

${buildAnchorPieceInstruction("day")}

Today's palette direction: ${colorDirection}. Every garment MUST include its color.

Styling brief:
${formatSignalBrief(signalBrief)}

Guardrails:
${formatGuardrails(signalBrief)}

Transition read: ${transition.summary}. ${transition.promptGuidance}

Headline guidance: give the headline a little city-specific character if it fits, but keep it under 10 words.

Rules:
- Specific garments + materials WITH COLOR, max 8 words per item (e.g., "Black merino crewneck" not "Merino crewneck")
- Quality materials — cashmere, merino, silk, leather, wool, linen, cotton — but in varied colors, not always neutrals
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
}

export function buildCreatorOutfitPrompt(input: {
  locationName: string;
  day: PromptDaySummary;
  weatherContext: string;
  styleDirection: string;
  transition: TransitionAssessment;
  signalBrief: OutfitSignalBrief;
}): string {
  const { locationName, day, weatherContext, styleDirection, transition, signalBrief } = input;
  return `You are an expert fashion stylist with impeccable taste. Look at the product images above and style a complete, beautiful outfit for ${locationName} today.

Weather: ${Math.round(day.tempMin)}°–${Math.round(day.tempMax)}°F. ${weatherContext}

${buildCityVibeInstruction(locationName)}

${buildAnchorPieceInstruction("creator")}

Style direction: ${styleDirection}

Styling brief:
${formatSignalBrief(signalBrief)}

Guardrails:
${formatGuardrails(signalBrief)}

Transition read: ${transition.summary}. ${transition.promptGuidance}

Headline guidance: give the headline a little city-specific character if it fits, but keep it under 10 words.

CRITICAL — match clothing weight to ACTUAL temperature. A thin t-shirt
under a coat at 48°F is wrong even if it looks good. The base layer
has to earn its place on its own at the coldest moment of the day:

- Over 75°F = lightweight breathable only (thin cotton tees, linen, silk camis). No wool, no cashmere, no coats.
- 65–75°F = light cotton / thin knit base, maybe a light jacket for evening.
- 55–65°F = medium base layer (long-sleeve cotton, fine merino, light knit) + jacket.
- 45–55°F = warm base (merino crew, cashmere sweater, turtleneck, thick knit) + substantial coat. DO NOT pick a thin t-shirt here.
- 35–45°F = cashmere/wool sweater + proper winter coat + closed warm shoes.
- Under 35°F = heavy parka, thermal base, insulated boots.

The morning base layer must still work at midday peak — if midday is
warm enough to shed the coat, the base underneath should be comfortable
at that temp without a layer over it.

Look at the actual product images above. Consider colors, textures, proportions, and how pieces look worn together. Style like a real client — every item earns its place. A perfect 3-piece outfit beats a mediocre 5-piece one. If the catalog has no appropriate warm base at the current temp, set "top" to null rather than forcing an inappropriate thin tee.

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

Return ONLY valid JSON.`;
}

export function buildCreatorBenchmarkBlocks(input: {
  candidates: CreatorBenchmarkCandidate[];
  promptText: string;
}): Anthropic.Messages.ContentBlockParam[] {
  const blocks: Anthropic.Messages.ContentBlockParam[] = [];
  input.candidates.forEach((candidate, index) => {
    blocks.push({
      type: "text",
      text: `[${index}] ${candidate.title} — ${candidate.brand} — ${candidate.category} — $${candidate.price ?? "?"}`,
    });
    if (candidate.image) {
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: candidate.image.mediaType,
          data: candidate.image.data,
        },
      });
    }
  });
  blocks.push({ type: "text", text: input.promptText });
  return blocks;
}
