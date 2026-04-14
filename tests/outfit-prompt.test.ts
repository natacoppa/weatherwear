import { expect, test } from "@playwright/test";
import {
  buildAnchorPieceInstruction,
  buildCityVibeInstruction,
  classifyTransitionIntensity,
  selectPromptDirection,
  DAY_COLOR_DIRECTIONS,
  type PromptMomentWeather,
} from "../src/lib/outfit-prompt";
import { buildOutfitSignalBrief } from "../src/lib/outfit-signals";

const stableMoments: PromptMomentWeather[] = [
  {
    label: "Walk out the door",
    timeRange: "7-9am",
    temp: 60,
    sunFeel: 62,
    shadeFeel: 58,
    windSpeed: 6,
    uvIndex: 2.1,
    precipChance: 5,
  },
  {
    label: "Midday peak",
    timeRange: "11am-3pm",
    temp: 64,
    sunFeel: 66,
    shadeFeel: 61,
    windSpeed: 7,
    uvIndex: 5.4,
    precipChance: 10,
  },
];

test.describe("outfit prompt helpers", () => {
  test("city vibe instruction uses reflective destination-city language", () => {
    const instruction = buildCityVibeInstruction("New York, NY, United States");
    expect(instruction).toContain("How do people in New York actually dress?");
    expect(instruction).toContain("shape this outfit as much as the temperature does");
  });

  test("anchor-piece instruction emphasizes support pieces and proportion balance", () => {
    const instruction = buildAnchorPieceInstruction("creator");
    expect(instruction).toContain("ONE anchor piece");
    expect(instruction).toContain("Everything else should support the anchor");
    expect(instruction).toContain("balanced volume");
  });

  test("stable transition guidance tells the model not to invent changes", () => {
    const transition = classifyTransitionIntensity(stableMoments);
    expect(transition.intensity).toBe("stable");
    expect(transition.promptGuidance).toContain("Outfit holds all day");
  });

  test("signal brief treats New York as polished and walking-heavy", () => {
    const signalBrief = buildOutfitSignalBrief({
      locationName: "New York, NY, United States",
      moments: stableMoments,
      transition: classifyTransitionIntensity(stableMoments),
    });

    expect(signalBrief.walkingLoad).toBe("high");
    expect(signalBrief.styleContext).toBe("polished_urban");
  });

  test("prompt direction selection can be deterministic for benchmark mode", () => {
    const direction = selectPromptDirection(DAY_COLOR_DIRECTIONS, { index: 3 });
    expect(direction).toBe(DAY_COLOR_DIRECTIONS[3]);
  });
});
