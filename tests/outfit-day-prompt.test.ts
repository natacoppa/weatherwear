import { expect, test } from "@playwright/test";
import {
  buildDayOutfitPrompt,
  classifyTransitionIntensity,
  DAY_COLOR_DIRECTIONS,
  formatDayWeatherContext,
  selectPromptDirection,
  type PromptMomentWeather,
} from "../src/lib/outfit-prompt";
import { buildOutfitSignalBrief } from "../src/lib/outfit-signals";

const moments: PromptMomentWeather[] = [
  {
    label: "Walk out the door",
    timeRange: "7-9am",
    temp: 50,
    sunFeel: 52,
    shadeFeel: 46,
    windSpeed: 9,
    uvIndex: 1.1,
    precipChance: 5,
    humidity: 63,
  },
  {
    label: "Midday peak",
    timeRange: "11am-3pm",
    temp: 58,
    sunFeel: 62,
    shadeFeel: 55,
    windSpeed: 8,
    uvIndex: 4.3,
    precipChance: 10,
    humidity: 54,
  },
];

test.describe("day outfit prompt composition", () => {
  test("includes city vibe and anchor-piece guidance", () => {
    const prompt = buildDayOutfitPrompt({
      locationName: "Paris, France",
      day: { tempMin: 49, tempMax: 58 },
      weatherContext: formatDayWeatherContext(moments),
      colorDirection: selectPromptDirection(DAY_COLOR_DIRECTIONS, { index: 1 }),
      transition: classifyTransitionIntensity(moments),
      signalBrief: buildOutfitSignalBrief({
        locationName: "Paris, France",
        moments,
        transition: classifyTransitionIntensity(moments),
      }),
    });

    expect(prompt).toContain("How do people in Paris actually dress?");
    expect(prompt).toContain("Style the outfit around ONE anchor piece");
    expect(prompt).toContain("Today's palette direction:");
  });

  test("stable-day prompt asks for minimal transition changes", () => {
    const prompt = buildDayOutfitPrompt({
      locationName: "Los Angeles, CA, United States",
      day: { tempMin: 64, tempMax: 70 },
      weatherContext: formatDayWeatherContext(moments),
      colorDirection: selectPromptDirection(DAY_COLOR_DIRECTIONS, { index: 2 }),
      transition: { intensity: "stable", summary: "stable day", promptGuidance: "Say \"Outfit holds all day\" if no real change is needed." },
      signalBrief: buildOutfitSignalBrief({
        locationName: "Los Angeles, CA, United States",
        moments,
        transition: { intensity: "stable", summary: "stable day", promptGuidance: "Say \"Outfit holds all day\" if no real change is needed." },
      }),
    });

    expect(prompt).toContain("Transition read: stable day.");
    expect(prompt).toContain("Outfit holds all day");
  });

  test("extreme-heat prompt tells the model to build for peak heat instead of the morning", () => {
    const hotMoments: PromptMomentWeather[] = [
      { label: "Walk out the door", timeRange: "7-9am", temp: 71, sunFeel: 71, shadeFeel: 67, windSpeed: 4, uvIndex: 2.2, precipChance: 5, humidity: 78 },
      { label: "Midday peak", timeRange: "11am-3pm", temp: 100, sunFeel: 101, shadeFeel: 84, windSpeed: 5, uvIndex: 9.8, precipChance: 0, humidity: 46 },
      { label: "By evening", timeRange: "6-10pm", temp: 80, sunFeel: 82, shadeFeel: 80, windSpeed: 6, uvIndex: 0.4, precipChance: 0, humidity: 52 },
    ];
    const transition = classifyTransitionIntensity(hotMoments);
    const prompt = buildDayOutfitPrompt({
      locationName: "New York, NY, United States",
      day: { tempMin: 71, tempMax: 100 },
      weatherContext: formatDayWeatherContext(hotMoments),
      colorDirection: selectPromptDirection(DAY_COLOR_DIRECTIONS, { index: 7 }),
      transition,
      signalBrief: buildOutfitSignalBrief({
        locationName: "New York, NY, United States",
        moments: hotMoments,
        transition,
      }),
    });

    expect(prompt).toContain("Build for peak heat, not the morning.");
    expect(prompt).toContain("Do not use jackets, scarves, sweaters, knits, wool, cashmere, coats, or other unnecessary layers.");
  });
});
