import fs from "fs";
import os from "os";
import path from "path";
import { expect, test } from "@playwright/test";
import {
  buildCreatorIndex,
  curateCreatorCatalog,
  loadCuratedCreatorCatalog,
  loadCreatorRegistry,
  resolveCreatorSources,
  type CreatorRegistryEntry,
} from "../src/lib/creator-catalog";

function withTempDir(fn: (dir: string) => void) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "creator-curation-"));
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test.describe("creator curation bootstrap", () => {
  test("boots from a legacy creator file when no raw dump exists yet", () => {
    withTempDir((dir) => {
      fs.mkdirSync(path.join(dir, "data/creators"), { recursive: true });

      const registry: CreatorRegistryEntry[] = [
        {
          username: "legacycreator",
          name: "Legacy Creator",
          image: null,
          shopmy: { username: "legacycreator", curatorId: 77 },
        },
      ];

      fs.writeFileSync(
        path.join(dir, "data/creators/_registry.json"),
        `${JSON.stringify(registry, null, 2)}\n`,
      );
      fs.writeFileSync(
        path.join(dir, "data/creators/legacycreator.json"),
        `${JSON.stringify(
          {
            username: "legacycreator",
            name: "Legacy Creator",
            image: null,
            scrapedAt: "2026-04-14T00:00:00.000Z",
            curatorId: 77,
            products: [
              {
                id: 501,
                title: "Wool Coat",
                image: "https://example.com/coat.jpg",
                url: "https://example.com/coat",
                price: 300,
                brand: "Brand A",
                category: "Coats",
                department: "Apparel",
              },
              {
                id: 502,
                title: "Chelsea Boot",
                image: "https://example.com/boot.jpg",
                url: "https://example.com/boot",
                price: 220,
                brand: "Brand B",
                category: "Boots",
                department: "Footwear",
              },
            ],
          },
          null,
          2,
        )}\n`,
      );

      const [entry] = loadCreatorRegistry(dir);
      const sources = resolveCreatorSources(entry, dir, { allowLegacyFallback: true });
      const catalog = curateCreatorCatalog(entry, sources, new Date("2026-04-14T00:00:00.000Z"));
      const index = buildCreatorIndex([catalog])[0];

      expect(sources).toHaveLength(1);
      expect(catalog.products.every((product) => product.url)).toBe(true);
      expect(catalog.products.every((product) => product.canonicalCategory !== undefined)).toBe(true);
      expect(catalog.products.every((product) => product.addedAtSource === "unknown" || product.addedAtSource === "scraped_at")).toBe(true);
      expect(index.username).toBe("legacycreator");
    });
  });

  test("bootstrap can merge existing raw sources with missing legacy sources", () => {
    withTempDir((dir) => {
      fs.mkdirSync(path.join(dir, "data/creators"), { recursive: true });
      fs.mkdirSync(path.join(dir, "data/creators-raw"), { recursive: true });

      const registry: CreatorRegistryEntry[] = [
        {
          username: "dualcreator",
          name: "Dual Creator",
          image: null,
          ltk: { username: "dualcreator", profileId: "ltk-profile" },
          shopmy: { username: "dualcreator", curatorId: 77 },
        },
      ];

      fs.writeFileSync(path.join(dir, "data/creators/_registry.json"), `${JSON.stringify(registry, null, 2)}\n`);
      fs.writeFileSync(
        path.join(dir, "data/creators-raw/dualcreator-ltk.json"),
        `${JSON.stringify(
          {
            source: "ltk",
            username: "dualcreator",
            name: "Dual Creator",
            image: null,
            scrapedAt: "2026-04-14T00:00:00.000Z",
            sourceMeta: { profileId: "ltk-profile" },
            products: [
              {
                sourceProductId: "ltk-1",
                title: "Wool Sweater",
                image: "https://example.com/sweater.jpg",
                url: "https://example.com/sweater",
                price: 150,
                brand: "Brand A",
                category: "Sweaters",
                department: "Apparel",
                addedAt: null,
                addedAtSource: "unknown",
              },
            ],
          },
          null,
          2,
        )}\n`,
      );
      fs.writeFileSync(
        path.join(dir, "data/creators/dualcreator.json"),
        `${JSON.stringify(
          {
            username: "dualcreator",
            name: "Dual Creator",
            image: null,
            scrapedAt: "2026-04-14T00:00:00.000Z",
            curatorId: 77,
            products: [
              {
                id: 501,
                title: "Leather Tote",
                image: "https://example.com/tote.jpg",
                url: "https://example.com/tote",
                price: 300,
                brand: "Brand B",
                category: "Bags",
                department: "Bags & Purses",
              },
            ],
          },
          null,
          2,
        )}\n`,
      );

      const [entry] = loadCreatorRegistry(dir);
      const sources = resolveCreatorSources(entry, dir, { allowLegacyFallback: true });

      expect(sources.map((source) => source.source).sort()).toEqual(["ltk", "shopmy"]);
    });
  });

  test("index rebuilding can include untouched curated catalogs during single-creator recuration", () => {
    withTempDir((dir) => {
      fs.mkdirSync(path.join(dir, "data/creators"), { recursive: true });

      const registry: CreatorRegistryEntry[] = [
        {
          username: "first",
          name: "First",
          image: null,
          shopmy: { username: "first", curatorId: 11 },
        },
        {
          username: "second",
          name: "Second",
          image: null,
          shopmy: { username: "second", curatorId: 22 },
        },
      ];

      fs.writeFileSync(path.join(dir, "data/creators/_registry.json"), `${JSON.stringify(registry, null, 2)}\n`);
      fs.writeFileSync(
        path.join(dir, "data/creators/first.json"),
        `${JSON.stringify(
          {
            username: "first",
            name: "First",
            image: null,
            sources: ["shopmy"],
            sourceMeta: { shopmy: { curatorId: 11 } },
            catalogUpdatedAt: "2026-04-14T00:00:00.000Z",
            incomplete: false,
            coverage: {
              top: { minimum: 3, count: 3, complete: true, window: "all+undated" },
              layer: { minimum: 3, count: 3, complete: true, window: "all+undated" },
              bottom: { minimum: 2, count: 2, complete: true, window: "all+undated" },
              shoe: { minimum: 2, count: 2, complete: true, window: "all+undated" },
              dress: { minimum: 1, count: 1, complete: true, window: "all+undated" },
              bag: { minimum: 1, count: 1, complete: true, window: "all+undated" },
            },
            products: [],
          },
          null,
          2,
        )}\n`,
      );
      fs.writeFileSync(
        path.join(dir, "data/creators/second.json"),
        `${JSON.stringify(
          {
            username: "second",
            name: "Second",
            image: null,
            sources: ["shopmy"],
            sourceMeta: { shopmy: { curatorId: 22 } },
            catalogUpdatedAt: "2026-04-14T00:00:00.000Z",
            incomplete: false,
            coverage: {
              top: { minimum: 3, count: 3, complete: true, window: "all+undated" },
              layer: { minimum: 3, count: 3, complete: true, window: "all+undated" },
              bottom: { minimum: 2, count: 2, complete: true, window: "all+undated" },
              shoe: { minimum: 2, count: 2, complete: true, window: "all+undated" },
              dress: { minimum: 1, count: 1, complete: true, window: "all+undated" },
              bag: { minimum: 1, count: 1, complete: true, window: "all+undated" },
            },
            products: [],
          },
          null,
          2,
        )}\n`,
      );

      const catalogs = registry
        .map((entry) => loadCuratedCreatorCatalog(entry.username, dir))
        .filter((catalog): catalog is NonNullable<typeof catalog> => catalog !== null);

      expect(buildCreatorIndex(catalogs)).toHaveLength(2);
    });
  });
});
