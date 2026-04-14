import { expect, test } from "@playwright/test";
import {
  findCreatorOutfitGuardrailViolations,
  findDayOutfitGuardrailViolations,
  sanitizeDayOutfitForExtremeHeat,
} from "../src/lib/outfit-output-guardrails";
import type { CreatorOutfit, DayOutfit } from "../src/lib/types";
import type { OutfitSignalBrief } from "../src/lib/outfit-signals";

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

function dayOutfit(overrides: Partial<DayOutfit> = {}): DayOutfit {
  return {
    family: "airy_trouser_separates",
    headline: "Heat-smart city look",
    walkOut: {
      summary: "Warm start before peak sun",
      base: {
        kind: "separates",
        top: "White cotton tee",
        bottom: "Stone linen trousers",
      },
      layer: null,
      shoes: "Tan leather sandals",
      accessories: ["Black sunglasses", "Canvas tote"],
    },
    carry: { summary: "Sun gets intense", add: ["SPF 30"], remove: [], note: "Stay in airflow" },
    evening: { summary: "Still warm", add: [], note: "Outfit holds all day" },
    bagEssentials: ["Water bottle"],
    ...overrides,
  };
}

function creatorOutfit(overrides: Partial<CreatorOutfit["outfit"]> = {}): CreatorOutfit["outfit"] {
  return {
    headline: "Polished hot-weather look",
    walkOut: {
      summary: "Breathable and sharp",
      top: { index: 0, title: "White cotton tee", image: "", url: null, price: 0, brand: "Brand", category: "Tops", canonicalCategory: "top" },
      layer: null,
      bottom: { index: 1, title: "Stone linen trouser", image: "", url: null, price: 0, brand: "Brand", category: "Trousers", canonicalCategory: "bottom" },
      shoes: { index: 2, title: "Leather slide sandal", image: "", url: null, price: 0, brand: "Brand", category: "Sandals", canonicalCategory: "shoe" },
      accessories: [{ index: 3, title: "Black cat-eye sunglasses", image: "", url: null, price: 0, brand: "Brand", category: "Accessories", canonicalCategory: "other" }],
    },
    carry: { summary: "Heat peaks", add: ["SPF 30"], remove: [], note: "No extra layers" },
    evening: { summary: "Still warm", add: [], note: "Outfit holds all day" },
    bagEssentials: [],
    ...overrides,
  };
}

test.describe("outfit output guardrails", () => {
  test("allows breathable day outfits in extreme heat", () => {
    const violations = findDayOutfitGuardrailViolations(dayOutfit(), signalBrief());
    expect(violations).toEqual([]);
  });

  test("rejects bomber jackets in extreme-heat day outfits", () => {
    const violations = findDayOutfitGuardrailViolations(dayOutfit({
      walkOut: {
        ...dayOutfit().walkOut,
        layer: "Stone gray cotton bomber jacket",
      },
    }), signalBrief());

    expect(violations.some((violation) => violation.includes("bomber"))).toBe(true);
  });

  test("rejects scarves in extreme-heat day outfits", () => {
    const violations = findDayOutfitGuardrailViolations(dayOutfit({
      walkOut: {
        ...dayOutfit().walkOut,
        accessories: ["Sage linen scarf"],
      },
    }), signalBrief());

    expect(violations.some((violation) => violation.includes("scarf"))).toBe(true);
  });

  test("sanitizes removable extreme-heat accessories and layers from day outfits", () => {
    const outfit = dayOutfit({
      walkOut: {
        ...dayOutfit().walkOut,
        layer: "Stone gray cotton bomber jacket",
        accessories: ["Sage linen scarf", "Black sunglasses"],
      },
      carry: {
        ...dayOutfit().carry,
        add: ["Camel silk scarf", "SPF 30"],
        remove: ["Sage knit scarf"],
      },
      evening: {
        ...dayOutfit().evening,
        add: ["Cream cashmere sweater", "Water bottle"],
      },
      bagEssentials: ["Light wool scarf", "Water bottle"],
    });

    const sanitized = sanitizeDayOutfitForExtremeHeat(outfit, signalBrief());

    expect(sanitized.walkOut.layer).toBeNull();
    expect(sanitized.walkOut.accessories).toEqual(["Black sunglasses"]);
    expect(sanitized.carry.add).toEqual(["SPF 30"]);
    expect(sanitized.carry.remove).toEqual([]);
    expect(sanitized.evening.add).toEqual(["Water bottle"]);
    expect(sanitized.bagEssentials).toEqual(["Water bottle"]);
    expect(findDayOutfitGuardrailViolations(sanitized, signalBrief())).toEqual([]);
  });

  test("does not mutate day outfits when extreme heat is off", () => {
    const outfit = dayOutfit({
      walkOut: {
        ...dayOutfit().walkOut,
        accessories: ["Sage linen scarf"],
      },
    });

    const sanitized = sanitizeDayOutfitForExtremeHeat(outfit, signalBrief({
      peakHeat: "warm",
      overrides: { extremeHeat: false, extremeCold: false, footwear: false },
    }));

    expect(sanitized).toEqual(outfit);
  });

  test("does not reject mild-day blazers when extreme heat is off", () => {
    const violations = findDayOutfitGuardrailViolations(dayOutfit({
      walkOut: {
        ...dayOutfit().walkOut,
        layer: "Black lightweight blazer",
      },
    }), signalBrief({
      peakHeat: "warm",
      overrides: { extremeHeat: false, extremeCold: false, footwear: false },
    }));

    expect(violations).toEqual([]);
  });

  test("rejects heels on walking-heavy day outfits", () => {
    const violations = findDayOutfitGuardrailViolations(dayOutfit({
      walkOut: {
        ...dayOutfit().walkOut,
        shoes: "Black leather stiletto heels",
      },
    }), signalBrief({
      peakHeat: "warm",
      overrides: { extremeHeat: false, extremeCold: false, footwear: true },
    }));

    expect(violations.some((violation) => violation.includes("footwear"))).toBe(true);
    expect(violations.some((violation) => violation.includes("heel"))).toBe(true);
  });

  test("rejects outfits that drift outside the selected family", () => {
    const violations = findDayOutfitGuardrailViolations(dayOutfit(), signalBrief(), "skirt_separates");

    expect(violations.some((violation) => violation.includes("expected \"skirt_separates\""))).toBe(true);
    expect(violations.some((violation) => violation.includes("does not match"))).toBe(true);
  });

  test("validates creator outfits after candidate enrichment", () => {
    const outfit = creatorOutfit({
      walkOut: {
        ...creatorOutfit().walkOut,
        layer: { index: 4, title: "Stone gray cotton bomber jacket", image: "", url: null, price: 0, brand: "Brand", category: "Blazers", canonicalCategory: "layer" },
      },
    });

    const violations = findCreatorOutfitGuardrailViolations(outfit, signalBrief());
    expect(violations.some((violation) => violation.includes("bomber"))).toBe(true);
  });

  test("uses creator category metadata to reject heavy layers with opaque titles", () => {
    const outfit = creatorOutfit({
      walkOut: {
        ...creatorOutfit().walkOut,
        layer: { index: 4, title: "LouLou", image: "", url: null, price: 0, brand: "Brand", category: "Blazers", canonicalCategory: "layer" },
      },
    });

    const violations = findCreatorOutfitGuardrailViolations(outfit, signalBrief());
    expect(violations.length).toBeGreaterThan(0);
  });

  test("rejects creator footwear that is not walkable on high-movement days", () => {
    const outfit = creatorOutfit({
      walkOut: {
        ...creatorOutfit().walkOut,
        shoes: { index: 2, title: "Black slingback heels", image: "", url: null, price: 0, brand: "Brand", category: "Heels", canonicalCategory: "shoe" },
      },
    });

    const violations = findCreatorOutfitGuardrailViolations(outfit, signalBrief({
      peakHeat: "warm",
      overrides: { extremeHeat: false, extremeCold: false, footwear: true },
    }));

    expect(violations.some((violation) => violation.includes("footwear"))).toBe(true);
    expect(violations.some((violation) => violation.includes("heel"))).toBe(true);
  });
});
