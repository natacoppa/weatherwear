import { expect, test } from "@playwright/test";
import { shopUrl } from "../src/lib/shop";

// Plain unit tests colocated in the playwright suite. No browser needed,
// but running via `npm run smoke` keeps the test surface in one place.

test.describe("shopUrl", () => {
  test("strips parentheticals", () => {
    const url = shopUrl("Cashmere crew (oatmeal)");
    expect(decodeURIComponent(url)).toContain("q=Cashmere crew");
    expect(decodeURIComponent(url)).not.toContain("oatmeal");
  });

  test("strips em-dash brand attribution", () => {
    const url = shopUrl("Wool coat — Everlane");
    expect(decodeURIComponent(url)).toContain("q=Wool coat");
    expect(decodeURIComponent(url)).not.toContain("Everlane");
  });

  test("strips leading quantity", () => {
    const url = shopUrl("2 Silk scarves");
    expect(decodeURIComponent(url)).toContain("q=Silk scarves");
  });

  test("handles combined forms", () => {
    const url = shopUrl("3 Chelsea boots (black) — Vagabond");
    expect(decodeURIComponent(url)).toContain("q=Chelsea boots");
  });

  test("returns Google Shopping URL", () => {
    expect(shopUrl("linen trousers")).toMatch(/^https:\/\/www\.google\.com\/search\?tbm=shop&q=/);
  });
});
