import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

export const OUTFIT_CATEGORIES = ["top", "layer", "bottom", "shoe", "dress", "bag"] as const;
export type OutfitCategory = (typeof OUTFIT_CATEGORIES)[number];
export type CanonicalCategory = OutfitCategory | "other";
export type CreatorSource = "ltk" | "shopmy";
export type AddedAtSource = "source" | "scraped_at" | "unknown";
export type CoverageWindow = "3m" | "6m" | "12m" | "all" | "all+undated";
const CREATOR_SOURCES = ["ltk", "shopmy"] as const;

export const CATEGORY_MINIMUMS: Record<OutfitCategory, number> = {
  top: 3,
  layer: 3,
  bottom: 2,
  shoe: 2,
  dress: 1,
  bag: 1,
};

export interface CreatorRegistryHandle {
  username: string;
  curatorId?: number | null;
  profileId?: string | null;
}

export interface CreatorRegistryEntry {
  username: string;
  name: string;
  image: string | null;
  ltk?: CreatorRegistryHandle | null;
  shopmy?: CreatorRegistryHandle | null;
}

export interface RawCreatorSourceMeta {
  curatorId?: number | null;
  profileId?: string | null;
}

export interface RawCreatorProduct {
  sourceProductId: string;
  legacyId?: string | number;
  sourceRank?: number | null;
  title: string;
  image: string;
  url: string | null;
  price: number | null;
  brand: string;
  category: string;
  department: string;
  addedAt: string | null;
  addedAtSource: AddedAtSource;
}

export interface RawCreatorCatalog {
  source: CreatorSource;
  username: string;
  name: string;
  image: string | null;
  scrapedAt: string | null;
  sourceMeta: RawCreatorSourceMeta;
  products: RawCreatorProduct[];
}

export interface CuratedCreatorProduct {
  id: string;
  source: CreatorSource;
  sourceProductId: string;
  sourceRank: number | null;
  title: string;
  image: string;
  url: string | null;
  price: number | null;
  brand: string;
  category: string;
  department: string;
  canonicalCategory: CanonicalCategory;
  addedAt: string | null;
  addedAtSource: AddedAtSource;
}

export interface CategoryCoverage {
  minimum: number;
  count: number;
  complete: boolean;
  window: CoverageWindow;
}

export type CreatorCoverage = Record<OutfitCategory, CategoryCoverage>;

export interface CuratedCreatorCatalog {
  username: string;
  name: string;
  image: string | null;
  sources: CreatorSource[];
  sourceMeta: Partial<Record<CreatorSource, RawCreatorSourceMeta>>;
  catalogUpdatedAt: string;
  incomplete: boolean;
  coverage: CreatorCoverage;
  products: CuratedCreatorProduct[];
}

export interface CreatorIndexEntry {
  username: string;
  name: string;
  image: string | null;
  productCount: number;
  topBrands: string[];
  sources: CreatorSource[];
  incomplete: boolean;
  coverage: CreatorCoverage;
}

interface LegacyCatalogProduct {
  id: string | number;
  title: string;
  image: string;
  url: string | null;
  price: number | null;
  brand: string;
  category: string;
  department: string;
}

interface LegacyCatalogShape {
  username?: string;
  name?: string;
  image?: string | null;
  avatar?: string | null;
  curatorId?: number | null;
  profileId?: string | null;
  scrapedAt?: string | null;
  products?: LegacyCatalogProduct[];
}

interface CategorySelection {
  products: CuratedCreatorProduct[];
  coverage: CategoryCoverage;
}

function isCuratedCatalogShape(value: unknown): value is CuratedCreatorCatalog {
  if (!value || typeof value !== "object") return false;
  const maybe = value as Partial<CuratedCreatorCatalog>;
  return Array.isArray(maybe.sources) && Array.isArray(maybe.products) && typeof maybe.catalogUpdatedAt === "string";
}

export const VALID_CREATOR_USERNAME = /^[a-zA-Z0-9_.-]{1,64}$/;

export function mapToCanonicalCategory(category: string, department: string): CanonicalCategory {
  const cat = category.toLowerCase();
  const dept = department.toLowerCase();

  if (dept.includes("bags") || cat.includes("bag")) return "bag";
  if (dept.includes("footwear") || dept === "shoes") return "shoe";
  if (cat.includes("sneaker") || cat.includes("boot") || cat.includes("loafer") || cat.includes("heel") || cat.includes("sandal") || cat.includes("flat")) {
    return "shoe";
  }
  if (cat.includes("dress")) return "dress";
  if (cat.includes("jacket") || cat.includes("coat") || cat.includes("blazer") || cat.includes("outerwear") || cat.includes("vest")) {
    return "layer";
  }
  if (cat.includes("pant") || cat.includes("jean") || cat.includes("skirt") || cat.includes("short") || cat.includes("trouser") || cat.includes("bottom")) {
    return "bottom";
  }
  if (
    cat.includes("top") ||
    cat.includes("sweater") ||
    cat.includes("blouse") ||
    cat.includes("cardigan") ||
    cat.includes("knit") ||
    cat.includes("t-shirt") ||
    cat.includes("tee") ||
    cat.includes("shirt")
  ) {
    return "top";
  }

  return "other";
}

export function buildShopMyAffiliateUrl(productId: string | number, curatorId: number | null | undefined): string | null {
  if (!curatorId) return null;
  return `https://shopmy.us/shop/product/${encodeURIComponent(String(productId))}?Curator_id=${curatorId}`;
}

function uniqueSources(products: CuratedCreatorProduct[]): CreatorSource[] {
  return [...new Set(products.map((product) => product.source))].sort() as CreatorSource[];
}

function declaredSources(entry: CreatorRegistryEntry): CreatorSource[] {
  const sources: CreatorSource[] = [];
  if (entry.ltk) sources.push("ltk");
  if (entry.shopmy) sources.push("shopmy");
  return sources;
}

function parseDate(value: string | null): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isTrulyDated(product: Pick<CuratedCreatorProduct, "addedAt" | "addedAtSource">): boolean {
  return product.addedAtSource === "source" && parseDate(product.addedAt) !== null;
}

function normalizedText(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function dedupeKey(product: CuratedCreatorProduct): string {
  const normalizedUrl = normalizedText(product.url);
  if (normalizedUrl) return `url:${normalizedUrl}`;
  return `fp:${normalizedText(product.title)}|${normalizedText(product.brand)}|${normalizedText(product.image)}`;
}

function productIdentity(product: CuratedCreatorProduct): string {
  return `${product.source}:${product.sourceProductId}`;
}

function productSortValue(product: CuratedCreatorProduct): number {
  const dated = parseDate(product.addedAt);
  if (dated !== null && isTrulyDated(product)) return dated;
  return product.sourceRank !== null ? -product.sourceRank : Number.MIN_SAFE_INTEGER;
}

function sortProducts(products: CuratedCreatorProduct[]): CuratedCreatorProduct[] {
  return [...products].sort((left, right) => productSortValue(right) - productSortValue(left));
}

function dedupeProducts(products: CuratedCreatorProduct[]): CuratedCreatorProduct[] {
  const deduped = new Map<string, CuratedCreatorProduct>();
  for (const product of sortProducts(products)) {
    const key = dedupeKey(product);
    if (!deduped.has(key)) deduped.set(key, product);
  }
  return sortProducts([...deduped.values()]);
}

function cutoffDate(now: Date, months: number): number {
  const copy = new Date(now.getTime());
  copy.setUTCMonth(copy.getUTCMonth() - months);
  return copy.getTime();
}

function selectCategoryProducts(products: CuratedCreatorProduct[], category: OutfitCategory, now: Date): CategorySelection {
  const inCategory = dedupeProducts(products.filter((product) => product.canonicalCategory === category));
  const minimum = CATEGORY_MINIMUMS[category];
  const dated = inCategory.filter(isTrulyDated);
  const undated = inCategory.filter((product) => !isTrulyDated(product));
  const datedWindows: Array<{ window: CoverageWindow; months?: number }> = [
    { window: "3m", months: 3 },
    { window: "6m", months: 6 },
    { window: "12m", months: 12 },
    { window: "all" },
  ];

  for (const { window, months } of datedWindows) {
    const selected = months
      ? dated.filter((product) => {
          const parsed = parseDate(product.addedAt);
          return parsed !== null && parsed >= cutoffDate(now, months);
        })
      : dated;

    if (selected.length >= minimum) {
      return {
        products: selected,
        coverage: {
          minimum,
          count: selected.length,
          complete: true,
          window,
        },
      };
    }
  }

  const selected = [...dated, ...undated];
  return {
    products: selected,
    coverage: {
      minimum,
      count: selected.length,
      complete: selected.length >= minimum,
      window: undated.length > 0 ? "all+undated" : "all",
    },
  };
}

function emptyCoverage(): CreatorCoverage {
  return {
    top: { minimum: 3, count: 0, complete: false, window: "all" },
    layer: { minimum: 3, count: 0, complete: false, window: "all" },
    bottom: { minimum: 2, count: 0, complete: false, window: "all" },
    shoe: { minimum: 2, count: 0, complete: false, window: "all" },
    dress: { minimum: 1, count: 0, complete: false, window: "all" },
    bag: { minimum: 1, count: 0, complete: false, window: "all" },
  };
}

function topBrands(products: CuratedCreatorProduct[], limit = 5): string[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const brand = String(product.brand || "").trim();
    if (!brand) continue;
    counts.set(brand, (counts.get(brand) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([brand]) => brand);
}

function inferLegacySource(data: LegacyCatalogShape): CreatorSource {
  return data.profileId ? "ltk" : "shopmy";
}

function curatedProductFromRaw(source: CreatorSource, sourceMeta: RawCreatorSourceMeta, product: RawCreatorProduct): CuratedCreatorProduct {
  const sourceProductId = String(product.sourceProductId || product.legacyId || "");
  const fallbackUrl =
    source === "shopmy"
      ? buildShopMyAffiliateUrl(sourceProductId, sourceMeta.curatorId)
      : null;

  return {
    id: `${source}:${sourceProductId}`,
    source,
    sourceProductId,
    sourceRank: product.sourceRank ?? null,
    title: product.title,
    image: product.image,
    url: fallbackUrl || product.url || null,
    price: product.price,
    brand: product.brand,
    category: product.category,
    department: product.department,
    canonicalCategory: mapToCanonicalCategory(product.category, product.department),
    addedAt: product.addedAt,
    addedAtSource: product.addedAtSource,
  };
}

export function normalizeLegacyCatalog(data: LegacyCatalogShape, entry: CreatorRegistryEntry): RawCreatorCatalog {
  const source = inferLegacySource(data);
  const image = data.image ?? data.avatar ?? entry.image ?? null;
  const sourceMeta: RawCreatorSourceMeta =
    source === "shopmy"
      ? { curatorId: data.curatorId ?? entry.shopmy?.curatorId ?? null }
      : { profileId: data.profileId ?? entry.ltk?.profileId ?? null };

  return {
    source,
    username: entry.username,
    name: data.name || entry.name,
    image,
    scrapedAt: data.scrapedAt || null,
    sourceMeta,
    products: (data.products || []).map((product, index) => ({
      sourceProductId: String(product.id),
      legacyId: product.id,
      sourceRank: source === "shopmy" ? index : null,
      title: product.title,
      image: product.image,
      url: product.url ?? null,
      price: product.price ?? null,
      brand: String(product.brand || ""),
      category: product.category,
      department: product.department,
      addedAt: source === "shopmy" ? data.scrapedAt || null : null,
      addedAtSource: source === "shopmy" && data.scrapedAt ? "scraped_at" : "unknown",
    })),
  };
}

export function curateCreatorCatalog(
  entry: CreatorRegistryEntry,
  sources: RawCreatorCatalog[],
  now = new Date(),
): CuratedCreatorCatalog {
  const merged = dedupeProducts(
    sources.flatMap((source) =>
      source.products.map((product) => curatedProductFromRaw(source.source, source.sourceMeta, product)),
    ),
  );

  const selectedProducts: CuratedCreatorProduct[] = [];
  const seen = new Set<string>();
  const coverage = emptyCoverage();

  for (const category of OUTFIT_CATEGORIES) {
    const selection = selectCategoryProducts(merged, category, now);
    coverage[category] = selection.coverage;
    for (const product of selection.products) {
      const identity = productIdentity(product);
      if (!seen.has(identity)) {
        seen.add(identity);
        selectedProducts.push(product);
      }
    }
  }

  const sortedSelected = sortProducts(selectedProducts);
  return {
    username: entry.username,
    name: entry.name,
    image: entry.image,
    sources: uniqueSources(sortedSelected),
    sourceMeta: Object.fromEntries(sources.map((source) => [source.source, source.sourceMeta])),
    catalogUpdatedAt: now.toISOString(),
    incomplete: OUTFIT_CATEGORIES.some((category) => !coverage[category].complete),
    coverage,
    products: sortedSelected,
  };
}

export function buildCreatorIndex(catalogs: CuratedCreatorCatalog[]): CreatorIndexEntry[] {
  return [...catalogs]
    .sort((left, right) => left.username.localeCompare(right.username))
    .map((catalog) => ({
      username: catalog.username,
      name: catalog.name,
      image: catalog.image,
      productCount: catalog.products.length,
      topBrands: topBrands(catalog.products),
      sources: catalog.sources,
      incomplete: catalog.incomplete,
      coverage: catalog.coverage,
    }));
}

export function rawSourcesFromCuratedCatalog(catalog: CuratedCreatorCatalog): RawCreatorCatalog[] {
  return catalog.sources.map((source) => ({
    source,
    username: catalog.username,
    name: catalog.name,
    image: catalog.image,
    scrapedAt: catalog.catalogUpdatedAt,
    sourceMeta: catalog.sourceMeta[source] || {},
    products: catalog.products
      .filter((product) => product.source === source)
      .map((product) => ({
        sourceProductId: product.sourceProductId,
        sourceRank: product.sourceRank,
        title: product.title,
        image: product.image,
        url: product.url,
        price: product.price,
        brand: product.brand,
        category: product.category,
        department: product.department,
        addedAt: product.addedAt,
        addedAtSource: product.addedAtSource,
      })),
  }));
}

export function buildCreatorCandidateSet(
  products: CuratedCreatorProduct[],
  random: () => number = Math.random,
): CuratedCreatorProduct[] {
  const pools: Record<OutfitCategory, CuratedCreatorProduct[]> = {
    top: products.filter((product) => product.canonicalCategory === "top"),
    layer: products.filter((product) => product.canonicalCategory === "layer"),
    bottom: products.filter((product) => product.canonicalCategory === "bottom"),
    shoe: products.filter((product) => product.canonicalCategory === "shoe"),
    dress: products.filter((product) => product.canonicalCategory === "dress"),
    bag: products.filter((product) => product.canonicalCategory === "bag"),
  };
  const limits: Record<OutfitCategory, number> = { top: 3, layer: 3, bottom: 2, shoe: 2, dress: 1, bag: 1 };
  const selected: CuratedCreatorProduct[] = [];
  const seen = new Set<string>();

  function shuffle(pool: CuratedCreatorProduct[]): CuratedCreatorProduct[] {
    const copy = [...pool];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      const current = copy[index];
      copy[index] = copy[swapIndex];
      copy[swapIndex] = current;
    }
    return copy;
  }

  for (const category of OUTFIT_CATEGORIES) {
    let added = 0;
    for (const product of shuffle(pools[category])) {
      const identity = productIdentity(product);
      if (seen.has(identity) || added >= limits[category]) continue;
      seen.add(identity);
      selected.push(product);
      added += 1;
    }
  }

  return selected;
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export function creatorCatalogPath(username: string, cwd = process.cwd()): string {
  return path.join(cwd, "data/creators", `${username}.json`);
}

export function creatorLegacyPath(username: string, cwd = process.cwd()): string {
  return path.join(cwd, "data/creators", `${username}.json`);
}

export function creatorRawPath(entry: CreatorRegistryEntry, source: CreatorSource, cwd = process.cwd()): string {
  const handle = source === "ltk" ? entry.ltk?.username : entry.shopmy?.username;
  return path.join(cwd, "data/creators-raw", `${handle || entry.username}-${source}.json`);
}

export function writeRawCreatorCatalog(entry: CreatorRegistryEntry, catalog: RawCreatorCatalog, cwd = process.cwd()) {
  const filePath = creatorRawPath(entry, catalog.source, cwd);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(catalog, null, 2)}\n`);
}

export function loadCreatorRegistry(cwd = process.cwd()): CreatorRegistryEntry[] {
  return readJsonFile<CreatorRegistryEntry[]>(path.join(cwd, "data/creators/_registry.json"));
}

export function loadCuratedCreatorCatalog(username: string, cwd = process.cwd()): CuratedCreatorCatalog | null {
  if (!VALID_CREATOR_USERNAME.test(username)) return null;
  const filePath = creatorCatalogPath(username, cwd);
  try {
    return readJsonFile<CuratedCreatorCatalog>(filePath);
  } catch {
    return null;
  }
}

export function loadCreatorIndex(cwd = process.cwd()): CreatorIndexEntry[] {
  try {
    return readJsonFile<CreatorIndexEntry[]>(path.join(cwd, "data/creators/_index.json"));
  } catch {
    return [];
  }
}

export function resolveCreatorSources(
  entry: CreatorRegistryEntry,
  cwd = process.cwd(),
  options: { allowLegacyFallback?: boolean } = {},
): RawCreatorCatalog[] {
  const sourceMap = new Map<CreatorSource, RawCreatorCatalog>();

  const orderedSources = () => CREATOR_SOURCES.flatMap((source) => (sourceMap.has(source) ? [sourceMap.get(source)!] : []));

  for (const source of CREATOR_SOURCES) {
    const filePath = creatorRawPath(entry, source, cwd);
    if (!fs.existsSync(filePath)) continue;
    sourceMap.set(source, readJsonFile<RawCreatorCatalog>(filePath));
  }

  const wantedSources = declaredSources(entry);
  const missingSources = wantedSources.filter((source) => !sourceMap.has(source));
  if (!options.allowLegacyFallback || missingSources.length === 0) {
    return orderedSources();
  }

  const legacyPath = creatorLegacyPath(entry.username, cwd);
  const loadFromValue = (value: unknown): RawCreatorCatalog[] => {
    if (isCuratedCatalogShape(value)) return rawSourcesFromCuratedCatalog(value);
    return [normalizeLegacyCatalog(value as LegacyCatalogShape, entry)];
  };

  const addFallbackSources = (fallbackSources: RawCreatorCatalog[]) => {
    for (const source of fallbackSources) {
      if (!wantedSources.includes(source.source) || sourceMap.has(source.source)) continue;
      sourceMap.set(source.source, source);
    }
  };

  if (fs.existsSync(legacyPath)) {
    const legacy = readJsonFile<unknown>(legacyPath);
    if (isCuratedCatalogShape(legacy)) {
      try {
        const headValue = execFileSync("git", ["show", `HEAD:data/creators/${entry.username}.json`], {
          cwd,
          encoding: "utf8",
        });
        addFallbackSources(loadFromValue(JSON.parse(headValue)));
        return orderedSources();
      } catch {
        addFallbackSources(loadFromValue(legacy));
        return orderedSources();
      }
    }

    addFallbackSources(loadFromValue(legacy));
    return orderedSources();
  }

  try {
    const headValue = execFileSync("git", ["show", `HEAD:data/creators/${entry.username}.json`], {
      cwd,
      encoding: "utf8",
    });
    addFallbackSources(loadFromValue(JSON.parse(headValue)));
    return orderedSources();
  } catch {
    return orderedSources();
  }
}
