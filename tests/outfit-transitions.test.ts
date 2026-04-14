import { expect, test } from "@playwright/test";
import { classifyTransitionIntensity, type PromptMomentWeather } from "../src/lib/outfit-prompt";

function moment(overrides: Partial<PromptMomentWeather>): PromptMomentWeather {
  return {
    label: "Moment",
    timeRange: "time",
    temp: 60,
    sunFeel: 62,
    shadeFeel: 58,
    windSpeed: 6,
    uvIndex: 2,
    precipChance: 5,
    ...overrides,
  };
}

test.describe("outfit transition classification", () => {
  test("classifies small day drift as stable", () => {
    const transition = classifyTransitionIntensity([
      moment({ temp: 60, sunFeel: 62, shadeFeel: 57, precipChance: 5, windSpeed: 6 }),
      moment({ temp: 64, sunFeel: 66, shadeFeel: 60, precipChance: 10, windSpeed: 7 }),
      moment({ temp: 61, sunFeel: 63, shadeFeel: 58, precipChance: 8, windSpeed: 6 }),
    ]);
    expect(transition.intensity).toBe("stable");
  });

  test("classifies large thermal swing as significant", () => {
    const transition = classifyTransitionIntensity([
      moment({ temp: 42, sunFeel: 44, shadeFeel: 38 }),
      moment({ temp: 60, sunFeel: 68, shadeFeel: 55 }),
    ]);
    expect(transition.intensity).toBe("significant");
  });

  test("classifies rain jump as significant even when temperatures stay flat", () => {
    const transition = classifyTransitionIntensity([
      moment({ temp: 58, precipChance: 10 }),
      moment({ temp: 59, precipChance: 65 }),
    ]);
    expect(transition.intensity).toBe("significant");
  });

  test("classifies notable wind increase as moderate when thermal shift is small", () => {
    const transition = classifyTransitionIntensity([
      moment({ windSpeed: 5, precipChance: 5 }),
      moment({ windSpeed: 11, precipChance: 8 }),
    ]);
    expect(transition.intensity).toBe("moderate");
  });
});
