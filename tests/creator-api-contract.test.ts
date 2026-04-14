import { expect, test } from "@playwright/test";
import {
  buildCreatorCandidateSet,
  loadCreatorIndex,
  loadCuratedCreatorCatalog,
} from "../src/lib/creator-catalog";

test.describe("curated creator API contract", () => {
  test("loads curated catalogs without source heuristics and exposes new metadata", () => {
    const catalog = loadCuratedCreatorCatalog("alyssainthecity");
    expect(catalog).not.toBeNull();
    expect(catalog?.sources).toEqual(["shopmy"]);
    expect(catalog?.catalogUpdatedAt).toBeTruthy();
    expect(catalog?.coverage.top.minimum).toBe(3);
    expect(typeof catalog?.incomplete).toBe("boolean");
    expect(catalog?.products[0].canonicalCategory).toBeTruthy();
  });

  test("checked-in data includes at least one same-creator multi-source catalog", () => {
    const catalog = loadCuratedCreatorCatalog("brightonbutler");
    expect(catalog).not.toBeNull();
    expect(catalog?.sources).toEqual(["ltk", "shopmy"]);
  });

  test("creator index exposes completeness metadata for the picker API", () => {
    const index = loadCreatorIndex();
    const entry = index.find((candidate) => candidate.username === "andicsinger");
    expect(entry).toBeTruthy();
    expect(entry?.coverage.bottom.minimum).toBe(2);
    expect(typeof entry?.incomplete).toBe("boolean");
    expect(entry?.sources.length).toBeGreaterThan(0);
  });

  test("candidate selection uses curated canonical categories", () => {
    const catalog = loadCuratedCreatorCatalog("alyssainthecity");
    if (!catalog) throw new Error("Expected alyssainthecity catalog");

    const candidates = buildCreatorCandidateSet(catalog.products, () => 0);
    const counts = candidates.reduce<Record<string, number>>((memo, product) => {
      memo[product.canonicalCategory] = (memo[product.canonicalCategory] || 0) + 1;
      return memo;
    }, {});

    expect(counts.top).toBe(3);
    expect(counts.layer).toBe(3);
    expect(counts.bottom).toBe(2);
    expect(counts.shoe).toBe(2);
    expect(counts.dress).toBe(1);
    expect(counts.bag).toBe(1);
  });
});
