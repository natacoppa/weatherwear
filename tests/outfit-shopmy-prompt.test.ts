import { expect, test } from "@playwright/test";
import {
  buildCreatorBenchmarkBlocks,
  buildCreatorOutfitPrompt,
  classifyTransitionIntensity,
  CREATOR_STYLE_DIRECTIONS,
  formatCreatorWeatherContext,
  selectPromptDirection,
  type CreatorBenchmarkCandidate,
  type PromptMomentWeather,
} from "../src/lib/outfit-prompt";
import { buildOutfitSignalBrief } from "../src/lib/outfit-signals";

const moments: PromptMomentWeather[] = [
  {
    label: "Walk out the door",
    timeRange: "7-9am",
    temp: 45,
    sunFeel: 47,
    shadeFeel: 41,
    windSpeed: 10,
    uvIndex: 1.3,
    precipChance: 10,
  },
  {
    label: "Midday peak",
    timeRange: "11am-3pm",
    temp: 58,
    sunFeel: 63,
    shadeFeel: 53,
    windSpeed: 7,
    uvIndex: 4.9,
    precipChance: 10,
  },
];

const candidates: CreatorBenchmarkCandidate[] = [
  {
    title: "Black wool blazer",
    brand: "Toteme",
    category: "Blazers",
    price: 720,
    image: {
      mediaType: "image/png",
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2Z0uoAAAAASUVORK5CYII=",
    },
  },
  {
    title: "Dark rinse straight jean",
    brand: "Citizens of Humanity",
    category: "Jeans",
    price: 238,
  },
];

test.describe("creator outfit prompt composition", () => {
  test("includes destination-city guidance, anchor-piece language, and temperature guardrails", () => {
    const prompt = buildCreatorOutfitPrompt({
      locationName: "New York, NY, United States",
      day: { tempMin: 44, tempMax: 58 },
      weatherContext: formatCreatorWeatherContext(moments),
      styleDirection: selectPromptDirection(CREATOR_STYLE_DIRECTIONS, { index: 0 }),
      transition: classifyTransitionIntensity(moments),
      signalBrief: buildOutfitSignalBrief({
        locationName: "New York, NY, United States",
        moments,
        transition: classifyTransitionIntensity(moments),
      }),
    });

    expect(prompt).toContain("How do people in New York actually dress?");
    expect(prompt).toContain("Style the outfit around ONE anchor piece from the visible candidate set");
    expect(prompt).toContain("CRITICAL — match clothing weight to ACTUAL temperature");
  });

  test("creator prompt includes the same extreme-heat guardrails", () => {
    const hotMoments: PromptMomentWeather[] = [
      { label: "Walk out the door", timeRange: "7-9am", temp: 71, sunFeel: 71, shadeFeel: 67, windSpeed: 4, uvIndex: 2.2, precipChance: 5, humidity: 78 },
      { label: "Midday peak", timeRange: "11am-3pm", temp: 100, sunFeel: 101, shadeFeel: 84, windSpeed: 5, uvIndex: 9.8, precipChance: 0, humidity: 46 },
      { label: "By evening", timeRange: "6-10pm", temp: 80, sunFeel: 82, shadeFeel: 80, windSpeed: 6, uvIndex: 0.4, precipChance: 0, humidity: 52 },
    ];
    const transition = classifyTransitionIntensity(hotMoments);
    const prompt = buildCreatorOutfitPrompt({
      locationName: "New York, NY, United States",
      day: { tempMin: 71, tempMax: 100 },
      weatherContext: formatCreatorWeatherContext(hotMoments),
      styleDirection: selectPromptDirection(CREATOR_STYLE_DIRECTIONS, { index: 1 }),
      transition,
      signalBrief: buildOutfitSignalBrief({
        locationName: "New York, NY, United States",
        moments: hotMoments,
        transition,
      }),
    });

    expect(prompt).toContain("Build for peak heat, not the morning.");
    expect(prompt).toContain("Hot-weather silhouette preference:");
    expect(prompt).toContain("Rank skirts, shorts, sandals, sleeveless tops, and airy separates ahead of trousers.");
    expect(prompt).toContain("Trousers are a fallback, not the default.");
    expect(prompt).not.toContain("dresses, skirts, shorts, sandals");
  });

  test("creator benchmark blocks preserve image-aware content shape", () => {
    const blocks = buildCreatorBenchmarkBlocks({
      candidates,
      promptText: "Prompt text",
    });

    expect(blocks.some((block) => block.type === "image")).toBe(true);
    expect(blocks[blocks.length - 1]).toMatchObject({ type: "text", text: "Prompt text" });
  });
});
