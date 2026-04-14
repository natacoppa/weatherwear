import fs from "fs";
import path from "path";
import { expect, test } from "@playwright/test";

test.describe("outfit benchmark fixtures", () => {
  test("day-mode fixture contains all canonical benchmark scenarios", () => {
    const scenarios = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "tests/fixtures/outfit-benchmark-queries.json"), "utf8"),
    ) as Array<{
      id: string;
      locationName: string;
      paletteIndex?: number;
      moments: unknown[];
      day: { tempMin: number; tempMax: number };
      reviewFocus?: string;
    }>;

    expect(scenarios).toHaveLength(9);
    expect(scenarios.map((scenario) => scenario.id)).toEqual([
      "nyc-cold-morning",
      "nyc-heatwave-guardrail",
      "la-summer-afternoon",
      "tokyo-spring-rain",
      "london-overcast",
      "paris-autumn",
      "miami-humid-heat",
      "chicago-wind-chill",
      "sf-fog-wind",
    ]);
    expect(scenarios.every((scenario) => scenario.locationName && scenario.moments.length >= 2)).toBe(true);
    expect(scenarios.every((scenario) => typeof scenario.paletteIndex === "number")).toBe(true);
    expect(scenarios.every((scenario) => typeof scenario.day.tempMin === "number" && typeof scenario.day.tempMax === "number")).toBe(true);
    expect(scenarios.every((scenario) => typeof (scenario as { benchmarkDate?: string }).benchmarkDate === "string")).toBe(true);
    expect(scenarios.every((scenario) => typeof (scenario as { variationId?: string }).variationId === "string")).toBe(true);
    expect(scenarios.every((scenario) => Array.isArray((scenario as { recentFamilies?: string[] }).recentFamilies))).toBe(true);
    expect(scenarios.some((scenario) => scenario.reviewFocus?.includes("Manual live check"))).toBe(true);
  });

  test("creator-mode fixture includes fixed candidate data and image references", () => {
    const fixture = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "tests/fixtures/creator-outfit-benchmark.json"), "utf8"),
    ) as {
      validationScope: string;
      manualReviewChecklist?: string[];
      scenarios: Array<{
        id: string;
        locationName: string;
        moments: unknown[];
        reviewFocus?: string;
        candidates: Array<{ title: string; image?: { mediaType: string; data: string } }>;
      }>;
    };

    expect(fixture.validationScope).toBe("prompt-assembly-only");
    expect(fixture.manualReviewChecklist?.length).toBeGreaterThan(0);
    expect(fixture.scenarios.length).toBeGreaterThan(0);
    expect(fixture.scenarios.every((scenario) => scenario.locationName && scenario.moments.length >= 2)).toBe(true);
    expect(fixture.scenarios.every((scenario) => scenario.candidates.length >= 4)).toBe(true);
    expect(fixture.scenarios.every((scenario) => scenario.candidates.some((candidate) => candidate.image?.data))).toBe(true);
    expect(fixture.scenarios.some((scenario) => scenario.reviewFocus?.includes("Manual live check"))).toBe(true);
  });
});
