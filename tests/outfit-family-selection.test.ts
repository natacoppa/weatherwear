import { expect, test } from "@playwright/test";
import {
  appendRecentFamily,
  dayOutfitMatchesFamily,
  parseRecentFamilies,
  selectDayOutfitFamily,
  serializeRecentFamilies,
  type DayVariationContext,
} from "../src/lib/outfit-family";
import type { OutfitSignalBrief } from "../src/lib/outfit-signals";
import type { DayOutfit } from "../src/lib/types";

function signalBrief(overrides: Partial<OutfitSignalBrief> = {}): OutfitSignalBrief {
  return {
    peakHeat: "extreme",
    coldFloor: "warm",
    humidityBurden: "medium",
    sunExposure: "brutal",
    walkingLoad: "high",
    carryTolerance: "low",
    styleContext: "polished_urban",
    transition: {
      intensity: "significant",
      summary: "meaningful shift across the day",
      promptGuidance: "Describe only changes that materially improve comfort.",
    },
    overrides: {
      extremeHeat: true,
      extremeCold: false,
      footwear: true,
    },
    ...overrides,
  };
}

function dayOutfit(base: DayOutfit["walkOut"]["base"], layer: string | null = null): Pick<DayOutfit, "walkOut"> {
  return {
    walkOut: {
      summary: "test",
      base,
      layer,
      shoes: "Sandals",
      accessories: [],
    },
  };
}

test.describe("day outfit family selection", () => {
  test("selection is deterministic for the same variation context", () => {
    const input = {
      signalBrief: signalBrief(),
      variationContext: {
        variationId: "bench-user-a",
        recentFamilies: ["shorts_separates"],
      } satisfies DayVariationContext,
      locationName: "New York, NY, United States",
      date: "2026-07-18",
    };

    const first = selectDayOutfitFamily(input);
    const second = selectDayOutfitFamily(input);

    expect(first.family).toBe(second.family);
    expect(first.seed).toBe(second.seed);
    expect(first.validFamilies).toEqual(second.validFamilies);
  });

  test("selection avoids immediately repeating recent families when alternatives exist", () => {
    const selection = selectDayOutfitFamily({
      signalBrief: signalBrief(),
      variationContext: {
        variationId: "bench-user-b",
        recentFamilies: ["city_dress", "skirt_separates", "shorts_separates"],
      },
      locationName: "Miami, FL, United States",
      date: "2026-07-22",
    });

    expect(selection.validFamilies).toContain("easy_dress");
    expect(selection.validFamilies).toContain("airy_trouser_separates");
    expect(selection.family).not.toBe("city_dress");
    expect(selection.family).not.toBe("skirt_separates");
    expect(selection.family).not.toBe("shorts_separates");
  });

  test("recent family serialization stays bounded and unique", () => {
    const next = appendRecentFamily(["shorts_separates", "city_dress"], "skirt_separates");
    const deduped = parseRecentFamilies(`${serializeRecentFamilies(next)},city_dress,invalid`);

    expect(next).toEqual(["skirt_separates", "shorts_separates", "city_dress"]);
    expect(deduped).toEqual(["skirt_separates", "shorts_separates", "city_dress"]);
  });

  test("family matcher enforces dress and separates lanes", () => {
    expect(
      dayOutfitMatchesFamily({
        walkOut: {
          ...dayOutfit({ kind: "dress", dress: "Olive cotton midi dress" }).walkOut,
          shoes: "Black leather loafers",
          accessories: ["Structured tote"],
        },
      }, "city_dress"),
    ).toBe(true);
    expect(
      dayOutfitMatchesFamily(dayOutfit({ kind: "separates", top: "Tank", bottom: "White poplin skirt" }), "skirt_separates"),
    ).toBe(true);
    expect(
      dayOutfitMatchesFamily(dayOutfit({ kind: "separates", top: "Tank", bottom: "Stone linen shorts" }), "skirt_separates"),
    ).toBe(false);
    expect(
      dayOutfitMatchesFamily(dayOutfit({ kind: "dress", dress: "Black slip dress" }), "dress_plus_layer"),
    ).toBe(false);
    expect(
      dayOutfitMatchesFamily(
        dayOutfit({ kind: "dress", dress: "Black slip dress" }, "Light cotton cardigan"),
        "dress_plus_layer",
      ),
    ).toBe(true);
  });

  test("family matcher distinguishes layered and winter-oriented families", () => {
    expect(
      dayOutfitMatchesFamily({
        walkOut: {
          ...dayOutfit({ kind: "separates", top: "Cream knit polo", bottom: "Stone chino trousers" }, "Light cotton cardigan").walkOut,
          shoes: "Leather loafers",
        },
      }, "soft_layered_separates"),
    ).toBe(true);

    expect(
      dayOutfitMatchesFamily({
        walkOut: {
          ...dayOutfit({ kind: "separates", top: "Black merino sweater", bottom: "Charcoal wool trousers" }, "Camel wool coat").walkOut,
          shoes: "Black leather boots",
        },
      }, "winter_separates"),
    ).toBe(true);

    expect(
      dayOutfitMatchesFamily({
        walkOut: {
          ...dayOutfit({ kind: "separates", top: "White tee", bottom: "Blue denim culottes" }).walkOut,
          shoes: "Leather flats",
        },
      }, "skirt_separates"),
    ).toBe(true);
  });
});
