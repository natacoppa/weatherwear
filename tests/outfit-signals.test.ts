import { expect, test } from "@playwright/test";
import {
  buildOutfitSignalBrief,
  type OutfitSignalBrief,
  type PromptMomentWeather,
} from "../src/lib/outfit-signals";
import { classifyTransitionIntensity } from "../src/lib/outfit-prompt";

function moment(overrides: Partial<PromptMomentWeather>): PromptMomentWeather {
  return {
    label: "Moment",
    timeRange: "time",
    temp: 70,
    sunFeel: 72,
    shadeFeel: 68,
    windSpeed: 6,
    uvIndex: 4,
    precipChance: 5,
    humidity: 45,
    ...overrides,
  };
}

function brief(
  moments: PromptMomentWeather[],
  locationName = "New York, NY, United States",
): OutfitSignalBrief {
  return buildOutfitSignalBrief({
    locationName,
    moments,
    transition: classifyTransitionIntensity(moments),
  });
}

test.describe("outfit signal brief", () => {
  test("flags the reported hot-day regression as extreme heat with low carry tolerance", () => {
    const moments = [
      moment({
        label: "Walk out the door",
        timeRange: "7-9am",
        temp: 71,
        sunFeel: 71,
        shadeFeel: 67,
        humidity: 78,
        uvIndex: 2.2,
      }),
      moment({
        label: "Midday peak",
        timeRange: "11am-3pm",
        temp: 100,
        sunFeel: 101,
        shadeFeel: 84,
        humidity: 46,
        uvIndex: 9.8,
      }),
      moment({
        label: "By evening",
        timeRange: "6-10pm",
        temp: 80,
        sunFeel: 82,
        shadeFeel: 80,
        humidity: 52,
        uvIndex: 0.4,
      }),
    ];

    const signalBrief = brief(moments);

    expect(signalBrief.peakHeat).toBe("extreme");
    expect(signalBrief.coldFloor).toBe("warm");
    expect(signalBrief.sunExposure).toBe("brutal");
    expect(signalBrief.walkingLoad).toBe("high");
    expect(signalBrief.carryTolerance).toBe("low");
    expect(signalBrief.overrides.extremeHeat).toBe(true);
  });

  test("treats humid hot days as high humidity burden", () => {
    const signalBrief = brief([
      moment({ temp: 84, sunFeel: 90, shadeFeel: 86, humidity: 67, uvIndex: 8.1 }),
      moment({ temp: 88, sunFeel: 94, shadeFeel: 89, humidity: 64, uvIndex: 9.2 }),
    ], "Miami, FL, United States");

    expect(signalBrief.humidityBurden).toBe("high");
  });

  test("uses medium humidity burden when humidity is notable but not swampy", () => {
    const signalBrief = brief([
      moment({ temp: 76, sunFeel: 79, shadeFeel: 74, humidity: 53, uvIndex: 6 }),
      moment({ temp: 79, sunFeel: 82, shadeFeel: 78, humidity: 55, uvIndex: 7 }),
    ]);

    expect(signalBrief.humidityBurden).toBe("medium");
  });

  test("does not trigger extreme heat on cool sunny days", () => {
    const signalBrief = brief([
      moment({ temp: 62, sunFeel: 70, shadeFeel: 59, uvIndex: 8.5 }),
      moment({ temp: 64, sunFeel: 72, shadeFeel: 61, uvIndex: 8.8 }),
    ], "San Francisco, CA, United States");

    expect(signalBrief.peakHeat).toBe("warm");
    expect(signalBrief.overrides.extremeHeat).toBe(false);
  });

  test("returns safe defaults for a single-moment day", () => {
    const moments = [moment({ temp: 58, sunFeel: 60, shadeFeel: 55, humidity: 48, uvIndex: 3.2 })];
    const signalBrief = brief(moments, "Los Angeles, CA, United States");

    expect(signalBrief.transition.intensity).toBe("stable");
    expect(signalBrief.carryTolerance).toBe("medium");
    expect(signalBrief.styleContext).toBe("relaxed_coastal");
  });

  test("reuses the shared transition classifier output", () => {
    const moments = [
      moment({ temp: 52, sunFeel: 54, shadeFeel: 49, precipChance: 10, windSpeed: 5 }),
      moment({ temp: 67, sunFeel: 74, shadeFeel: 63, precipChance: 15, windSpeed: 9 }),
    ];
    const transition = classifyTransitionIntensity(moments);
    const signalBrief = buildOutfitSignalBrief({
      locationName: "Chicago, IL, United States",
      moments,
      transition,
    });

    expect(signalBrief.transition).toEqual(transition);
  });
});
