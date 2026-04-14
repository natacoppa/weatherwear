import { expect, test } from "@playwright/test";
import { AIShapeError } from "../src/lib/ai-shapes";
import { parseDayOutfitImageRequest } from "../src/app/api/outfit-image/route";

const validPayload = {
  outfit: {
    family: "city_dress",
    headline: "Heat-smart city dress",
    walkOut: {
      summary: "Warm start, polished all day",
      base: {
        kind: "dress",
        dress: "Olive cotton poplin midi dress",
      },
      layer: null,
      shoes: "Black leather loafers",
      accessories: ["Structured tote"],
    },
    carry: {
      summary: "Sun gets sharper",
      add: ["Sunglasses"],
      remove: [],
      note: "Keep it light",
    },
    evening: {
      summary: "Still easy by dinner",
      add: [],
      note: "No extra layer needed",
    },
    bagEssentials: ["SPF 30"],
  },
  location: "New York, NY, United States",
  temp: 84,
};

test.describe("outfit image route request parsing", () => {
  test("accepts the current day-mode outfit contract", () => {
    const parsed = parseDayOutfitImageRequest(validPayload);

    expect(parsed.location).toBe(validPayload.location);
    expect(parsed.temp).toBe(validPayload.temp);
    expect(parsed.outfit.family).toBe("city_dress");
    expect(parsed.outfit.walkOut.base.kind).toBe("dress");
  });

  test("rejects payloads missing the new family/base contract", () => {
    expect(() =>
      parseDayOutfitImageRequest({
        ...validPayload,
        outfit: {
          ...validPayload.outfit,
          family: undefined,
        },
      }),
    ).toThrow(AIShapeError);

    expect(() =>
      parseDayOutfitImageRequest({
        ...validPayload,
        outfit: {
          ...validPayload.outfit,
          walkOut: {
            ...validPayload.outfit.walkOut,
            base: undefined,
          },
        },
      }),
    ).toThrow(AIShapeError);
  });

  test("rejects payloads missing location or numeric temp", () => {
    expect(() => parseDayOutfitImageRequest({ ...validPayload, location: "" })).toThrow(AIShapeError);
    expect(() => parseDayOutfitImageRequest({ ...validPayload, temp: "84" })).toThrow(AIShapeError);
  });
});
