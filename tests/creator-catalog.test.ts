import { expect, test } from "@playwright/test";
import {
  buildCreatorCandidateSet,
  buildCreatorIndex,
  CATEGORY_MINIMUMS,
  curateCreatorCatalog,
  mapToCanonicalCategory,
  normalizeLegacyCatalog,
  type CreatorRegistryEntry,
  type RawCreatorCatalog,
} from "../src/lib/creator-catalog";

const registryEntry: CreatorRegistryEntry = {
  username: "testcreator",
  name: "Test Creator",
  image: null,
  ltk: { username: "testcreator" },
  shopmy: { username: "testcreator", curatorId: 99 },
};

test.describe("creator catalog helpers", () => {
  test("maps source categories into canonical outfit buckets", () => {
    expect(mapToCanonicalCategory("Sweaters", "Apparel")).toBe("top");
    expect(mapToCanonicalCategory("Outerwear", "Apparel")).toBe("layer");
    expect(mapToCanonicalCategory("Jeans", "Apparel")).toBe("bottom");
    expect(mapToCanonicalCategory("Sneakers", "Footwear")).toBe("shoe");
    expect(mapToCanonicalCategory("Dresses", "Apparel")).toBe("dress");
    expect(mapToCanonicalCategory("Tote Bags", "Bags & Purses")).toBe("bag");
    expect(mapToCanonicalCategory("Sunglasses", "Eyewear")).toBe("other");
  });

  test("normalizes legacy imports without inventing provenance certainty", () => {
    const normalized = normalizeLegacyCatalog(
      {
        username: "testcreator",
        name: "Legacy Creator",
        image: "https://example.com/legacy.jpg",
        scrapedAt: "2026-04-14T00:00:00.000Z",
        products: [
          {
            id: 123,
            title: "Cashmere Cardigan",
            image: "https://example.com/cardigan.jpg",
            url: "https://example.com/cardigan",
            price: 100,
            brand: "Example",
            category: "Cardigans",
            department: "Apparel",
          },
        ],
        curatorId: 99,
      },
      registryEntry,
    );

    expect(normalized.source).toBe("shopmy");
    expect(normalized.products[0].sourceProductId).toBe("123");
    expect(normalized.products[0].addedAtSource).toBe("scraped_at");
    expect(normalized.products[0].addedAt).toBe("2026-04-14T00:00:00.000Z");
  });

  test("uses dated windows first and undated inventory only as backfill", () => {
    const sources: RawCreatorCatalog[] = [
      {
        source: "ltk",
        username: "testcreator",
        name: "Test Creator",
        image: null,
        scrapedAt: "2026-04-14T00:00:00.000Z",
        sourceMeta: { profileId: "profile-1" },
        products: [
          {
            sourceProductId: "top-1",
            title: "Fine Knit Sweater",
            image: "https://example.com/top-1.jpg",
            url: "https://example.com/top-1",
            price: 150,
            brand: "Brand A",
            category: "Sweaters",
            department: "Apparel",
            addedAt: "2026-03-15T00:00:00.000Z",
            addedAtSource: "source",
          },
          {
            sourceProductId: "top-2",
            title: "Cashmere Crew",
            image: "https://example.com/top-2.jpg",
            url: "https://example.com/top-2",
            price: 160,
            brand: "Brand B",
            category: "Sweaters",
            department: "Apparel",
            addedAt: "2026-02-10T00:00:00.000Z",
            addedAtSource: "source",
          },
        ],
      },
      {
        source: "shopmy",
        username: "testcreator",
        name: "Test Creator",
        image: null,
        scrapedAt: "2026-04-14T00:00:00.000Z",
        sourceMeta: { curatorId: 99 },
        products: [
          {
            sourceProductId: "top-3",
            sourceRank: 0,
            title: "Silk Blouse",
            image: "https://example.com/top-3.jpg",
            url: "https://example.com/top-3",
            price: 180,
            brand: "Brand C",
            category: "Tops",
            department: "Apparel",
            addedAt: "2026-04-14T00:00:00.000Z",
            addedAtSource: "scraped_at",
          },
        ],
      },
    ];

    const catalog = curateCreatorCatalog(registryEntry, sources, new Date("2026-04-14T00:00:00.000Z"));
    expect(catalog.coverage.top.minimum).toBe(CATEGORY_MINIMUMS.top);
    expect(catalog.coverage.top.window).toBe("all+undated");
    expect(catalog.coverage.top.complete).toBe(true);
    expect(catalog.products.filter((product) => product.canonicalCategory === "top")).toHaveLength(3);
  });

  test("dedupes matching products across sources before indexing", () => {
    const sources: RawCreatorCatalog[] = [
      {
        source: "ltk",
        username: "testcreator",
        name: "Test Creator",
        image: null,
        scrapedAt: null,
        sourceMeta: { profileId: "profile-1" },
        products: [
          {
            sourceProductId: "same",
            title: "Brown Tote",
            image: "https://example.com/tote.jpg",
            url: "https://example.com/tote",
            price: 200,
            brand: "Brand A",
            category: "Bags",
            department: "Bags & Purses",
            addedAt: "2026-04-01T00:00:00.000Z",
            addedAtSource: "source",
          },
        ],
      },
      {
        source: "shopmy",
        username: "testcreator",
        name: "Test Creator",
        image: null,
        scrapedAt: "2026-04-14T00:00:00.000Z",
        sourceMeta: { curatorId: 99 },
        products: [
          {
            sourceProductId: "same-shopmy",
            sourceRank: 0,
            title: "Brown Tote",
            image: "https://example.com/tote.jpg",
            url: "https://example.com/tote",
            price: 200,
            brand: "Brand A",
            category: "Tote Bags",
            department: "Bags & Purses",
            addedAt: "2026-04-14T00:00:00.000Z",
            addedAtSource: "scraped_at",
          },
        ],
      },
    ];

    const catalog = curateCreatorCatalog(registryEntry, sources, new Date("2026-04-14T00:00:00.000Z"));
    const index = buildCreatorIndex([catalog])[0];

    expect(catalog.products.filter((product) => product.canonicalCategory === "bag")).toHaveLength(1);
    expect(index.productCount).toBe(1);
  });

  test("builds candidate sets from canonical categories rather than route-local category lists", () => {
    const catalog = curateCreatorCatalog(
      registryEntry,
      [
        {
          source: "ltk",
          username: "testcreator",
          name: "Test Creator",
          image: null,
          scrapedAt: null,
          sourceMeta: { profileId: "profile-1" },
          products: [
            {
              sourceProductId: "top-1",
              title: "Top 1",
              image: "https://example.com/top-1.jpg",
              url: "https://example.com/top-1",
              price: 1,
              brand: "Brand",
              category: "Tops",
              department: "Apparel",
              addedAt: "2026-04-10T00:00:00.000Z",
              addedAtSource: "source",
            },
            {
              sourceProductId: "top-2",
              title: "Top 2",
              image: "https://example.com/top-2.jpg",
              url: "https://example.com/top-2",
              price: 1,
              brand: "Brand",
              category: "Sweaters",
              department: "Apparel",
              addedAt: "2026-04-09T00:00:00.000Z",
              addedAtSource: "source",
            },
            {
              sourceProductId: "top-3",
              title: "Top 3",
              image: "https://example.com/top-3.jpg",
              url: "https://example.com/top-3",
              price: 1,
              brand: "Brand",
              category: "Blouses",
              department: "Apparel",
              addedAt: "2026-04-08T00:00:00.000Z",
              addedAtSource: "source",
            },
            {
              sourceProductId: "layer-1",
              title: "Layer 1",
              image: "https://example.com/layer-1.jpg",
              url: "https://example.com/layer-1",
              price: 1,
              brand: "Brand",
              category: "Jackets",
              department: "Apparel",
              addedAt: "2026-04-07T00:00:00.000Z",
              addedAtSource: "source",
            },
            {
              sourceProductId: "layer-2",
              title: "Layer 2",
              image: "https://example.com/layer-2.jpg",
              url: "https://example.com/layer-2",
              price: 1,
              brand: "Brand",
              category: "Coats",
              department: "Apparel",
              addedAt: "2026-04-06T00:00:00.000Z",
              addedAtSource: "source",
            },
            {
              sourceProductId: "layer-3",
              title: "Layer 3",
              image: "https://example.com/layer-3.jpg",
              url: "https://example.com/layer-3",
              price: 1,
              brand: "Brand",
              category: "Outerwear",
              department: "Apparel",
              addedAt: "2026-04-05T00:00:00.000Z",
              addedAtSource: "source",
            },
            {
              sourceProductId: "bottom-1",
              title: "Bottom 1",
              image: "https://example.com/bottom-1.jpg",
              url: "https://example.com/bottom-1",
              price: 1,
              brand: "Brand",
              category: "Jeans",
              department: "Apparel",
              addedAt: "2026-04-04T00:00:00.000Z",
              addedAtSource: "source",
            },
            {
              sourceProductId: "bottom-2",
              title: "Bottom 2",
              image: "https://example.com/bottom-2.jpg",
              url: "https://example.com/bottom-2",
              price: 1,
              brand: "Brand",
              category: "Skirts",
              department: "Apparel",
              addedAt: "2026-04-03T00:00:00.000Z",
              addedAtSource: "source",
            },
            {
              sourceProductId: "shoe-1",
              title: "Shoe 1",
              image: "https://example.com/shoe-1.jpg",
              url: "https://example.com/shoe-1",
              price: 1,
              brand: "Brand",
              category: "Sneakers",
              department: "Footwear",
              addedAt: "2026-04-02T00:00:00.000Z",
              addedAtSource: "source",
            },
            {
              sourceProductId: "shoe-2",
              title: "Shoe 2",
              image: "https://example.com/shoe-2.jpg",
              url: "https://example.com/shoe-2",
              price: 1,
              brand: "Brand",
              category: "Boots",
              department: "Footwear",
              addedAt: "2026-04-01T00:00:00.000Z",
              addedAtSource: "source",
            },
            {
              sourceProductId: "dress-1",
              title: "Dress 1",
              image: "https://example.com/dress-1.jpg",
              url: "https://example.com/dress-1",
              price: 1,
              brand: "Brand",
              category: "Dresses",
              department: "Apparel",
              addedAt: "2026-03-31T00:00:00.000Z",
              addedAtSource: "source",
            },
            {
              sourceProductId: "bag-1",
              title: "Bag 1",
              image: "https://example.com/bag-1.jpg",
              url: "https://example.com/bag-1",
              price: 1,
              brand: "Brand",
              category: "Tote Bags",
              department: "Bags & Purses",
              addedAt: "2026-03-30T00:00:00.000Z",
              addedAtSource: "source",
            },
          ],
        },
      ],
      new Date("2026-04-14T00:00:00.000Z"),
    );

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
