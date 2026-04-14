import type { OutfitSignalBrief } from "@/lib/outfit-signals";

export const DAY_OUTFIT_FAMILIES = [
  "easy_dress",
  "city_dress",
  "skirt_separates",
  "shorts_separates",
  "airy_trouser_separates",
  "light_tailored_separates",
  "light_separates",
  "soft_layered_separates",
  "light_dress",
  "structured_separates",
  "dress_plus_layer",
  "tailored_trouser_separates",
  "winter_separates",
  "skirt_with_tights",
  "dress_with_layering",
  "coat_anchored_separates",
] as const;

export type DayOutfitFamily = (typeof DAY_OUTFIT_FAMILIES)[number];

export const VARIATION_ID_HEADER = "x-ww-variation-id";
export const RECENT_FAMILIES_HEADER = "x-ww-recent-families";
export const RECENT_FAMILY_LIMIT = 3;

export interface DayVariationContext {
  variationId: string | null;
  recentFamilies: DayOutfitFamily[];
}

export interface DayOutfitFamilySelection {
  family: DayOutfitFamily;
  validFamilies: DayOutfitFamily[];
  seed: string;
  recentFamilies: DayOutfitFamily[];
}

const FAMILY_WEIGHT: Record<DayOutfitFamily, number> = {
  easy_dress: 0.88,
  city_dress: 0.83,
  skirt_separates: 0.8,
  shorts_separates: 0.73,
  airy_trouser_separates: 0.42,
  light_tailored_separates: 0.35,
  light_separates: 0.66,
  soft_layered_separates: 0.57,
  light_dress: 0.7,
  structured_separates: 0.61,
  dress_plus_layer: 0.58,
  tailored_trouser_separates: 0.54,
  winter_separates: 0.72,
  skirt_with_tights: 0.49,
  dress_with_layering: 0.47,
  coat_anchored_separates: 0.68,
};

const DRESS_FAMILIES = new Set<DayOutfitFamily>([
  "easy_dress",
  "city_dress",
  "light_dress",
  "dress_plus_layer",
  "dress_with_layering",
]);

const SKIRT_FAMILIES = new Set<DayOutfitFamily>([
  "skirt_separates",
  "skirt_with_tights",
]);

const SHORTS_FAMILIES = new Set<DayOutfitFamily>(["shorts_separates"]);

const TROUSER_FAMILIES = new Set<DayOutfitFamily>([
  "airy_trouser_separates",
  "tailored_trouser_separates",
]);

const SKIRT_BOTTOM_KEYWORDS = ["skirt", "skort", "culotte"] as const;
const SHORT_BOTTOM_KEYWORDS = ["short", "boxer"] as const;
const TROUSER_BOTTOM_KEYWORDS = ["trouser", "pant", "slack", "chino", "jean", "denim", "legging", "capri"] as const;
const STRUCTURED_KEYWORDS = [
  "structured",
  "tailored",
  "button-down",
  "button down",
  "blouse",
  "vest",
  "loafer",
  "slingback",
  "ballet",
  "pleated",
  "mule",
  "leather tote",
  "structured tote",
] as const;
const LIGHT_LAYER_KEYWORDS = [
  "cardigan",
  "overshirt",
  "shirt jacket",
  "lightweight jacket",
  "light jacket",
  "linen jacket",
  "cotton jacket",
  "bomber",
  "wrap",
  "crewneck",
] as const;
const HEAVY_LAYER_KEYWORDS = [
  "coat",
  "trench",
  "parka",
  "puffer",
  "wool",
  "cashmere",
  "shearling",
  "fleece",
  "thermal",
  "winter",
] as const;
const WINTER_SHOE_KEYWORDS = ["boot", "clog", "loafer"] as const;
const EASY_SHOE_KEYWORDS = ["sandal", "slide", "flat", "sneaker", "espadrille"] as const;
const POLISHED_SHOE_KEYWORDS = ["loafer", "ballet", "slingback", "mule", "mary jane"] as const;

export function isDayOutfitFamily(value: string): value is DayOutfitFamily {
  return DAY_OUTFIT_FAMILIES.includes(value as DayOutfitFamily);
}

export function parseRecentFamilies(value: string | null | undefined): DayOutfitFamily[] {
  if (!value) return [];
  const seen = new Set<DayOutfitFamily>();
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(isDayOutfitFamily)
    .filter((family) => {
      if (seen.has(family)) return false;
      seen.add(family);
      return true;
    })
    .slice(0, RECENT_FAMILY_LIMIT);
}

export function serializeRecentFamilies(families: DayOutfitFamily[]): string {
  return families.slice(0, RECENT_FAMILY_LIMIT).join(",");
}

export function appendRecentFamily(
  recentFamilies: DayOutfitFamily[],
  family: DayOutfitFamily,
): DayOutfitFamily[] {
  return [family, ...recentFamilies.filter((entry) => entry !== family)].slice(0, RECENT_FAMILY_LIMIT);
}

export function buildAnonymousVariationId(random: () => number = Math.random): string {
  return Array.from({ length: 4 }, () => Math.floor(random() * 0xffffffff).toString(16).padStart(8, "0")).join("");
}

export function deriveValidDayOutfitFamilies(signalBrief: OutfitSignalBrief): DayOutfitFamily[] {
  if (signalBrief.overrides.extremeHeat) {
    return [
      signalBrief.styleContext === "polished_urban" ? "city_dress" : "easy_dress",
      "skirt_separates",
      "shorts_separates",
      "airy_trouser_separates",
      "easy_dress",
    ].filter((family, index, families) => families.indexOf(family) === index) as DayOutfitFamily[];
  }

  if (signalBrief.peakHeat === "hot") {
    return [
      "easy_dress",
      "skirt_separates",
      "shorts_separates",
      "airy_trouser_separates",
      signalBrief.styleContext === "polished_urban" ? "light_tailored_separates" : "light_dress",
    ];
  }

  if (signalBrief.coldFloor === "severe" || signalBrief.coldFloor === "cold") {
    return [
      "winter_separates",
      "coat_anchored_separates",
      "skirt_with_tights",
      "dress_with_layering",
    ];
  }

  if (signalBrief.peakHeat === "warm" && signalBrief.coldFloor === "warm") {
    return [
      "light_separates",
      "light_dress",
      "skirt_separates",
      "airy_trouser_separates",
      "soft_layered_separates",
    ];
  }

  return [
    "structured_separates",
    "soft_layered_separates",
    "dress_plus_layer",
    "tailored_trouser_separates",
  ];
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function familyScore(seed: string, family: DayOutfitFamily): number {
  const jitter = hashString(`${seed}|${family}`) / 0xffffffff;
  return FAMILY_WEIGHT[family] * 2 + jitter;
}

export function selectDayOutfitFamily(input: {
  signalBrief: OutfitSignalBrief;
  variationContext: DayVariationContext;
  locationName: string;
  date: string;
}): DayOutfitFamilySelection {
  const validFamilies = deriveValidDayOutfitFamilies(input.signalBrief);
  const recentFamilies = input.variationContext.recentFamilies.filter((family) => validFamilies.includes(family));
  const unblockedFamilies = validFamilies.filter((family) => !recentFamilies.includes(family));
  const candidateFamilies = unblockedFamilies.length > 0 ? unblockedFamilies : validFamilies;
  const seed = [
    input.locationName,
    input.date,
    input.variationContext.variationId ?? "anon",
    candidateFamilies.join(","),
  ].join("|");

  const family = [...candidateFamilies].sort((left, right) => familyScore(seed, right) - familyScore(seed, left))[0];

  return {
    family,
    validFamilies,
    seed,
    recentFamilies,
  };
}

export function describeDayOutfitFamily(family: DayOutfitFamily): string {
  switch (family) {
    case "easy_dress":
      return "an effortless one-piece dress that feels breathable, low-bulk, and naturally hot-weather";
    case "city_dress":
      return "a polished city dress that still feels light, breathable, and easy to move in";
    case "skirt_separates":
      return "separates anchored by a skirt, not trousers";
    case "shorts_separates":
      return "separates anchored by shorts, still styled and intentional";
    case "airy_trouser_separates":
      return "airy separates with trousers only because they genuinely improve the look";
    case "light_tailored_separates":
      return "light tailored separates that still feel breathable rather than heavy";
    case "light_separates":
      return "easy light separates with no unnecessary structure";
    case "soft_layered_separates":
      return "soft separates with one light supporting layer";
    case "light_dress":
      return "a light dress that feels easy rather than occasion-heavy";
    case "structured_separates":
      return "structured separates suited to a cooler, more composed day";
    case "dress_plus_layer":
      return "a dress as the base silhouette with a light supporting layer";
    case "tailored_trouser_separates":
      return "tailored separates anchored by trousers";
    case "winter_separates":
      return "warm winter separates that prioritize comfort first";
    case "skirt_with_tights":
      return "a skirt-led silhouette adapted for cold weather";
    case "dress_with_layering":
      return "a dress silhouette supported by meaningful layering";
    case "coat_anchored_separates":
      return "separates anchored by a real coat and cold-weather structure";
  }
}

function normalized(value: string | null | undefined): string {
  return (value || "").toLowerCase();
}

function hasKeyword(value: string | null | undefined, keywords: string[]): boolean {
  const text = normalized(value);
  return keywords.some((keyword) => text.includes(keyword));
}

function bundleTexts(outfit: {
  walkOut: {
    base: { kind: "separates"; top: string; bottom: string } | { kind: "dress"; dress: string };
    layer: string | null;
    shoes?: string | null;
    accessories?: string[];
  };
}): string[] {
  const baseTexts = outfit.walkOut.base.kind === "dress"
    ? [outfit.walkOut.base.dress]
    : [outfit.walkOut.base.top, outfit.walkOut.base.bottom];

  return [
    ...baseTexts,
    outfit.walkOut.layer,
    outfit.walkOut.shoes,
    ...(outfit.walkOut.accessories || []),
  ].filter((value): value is string => Boolean(value));
}

function hasAnyKeyword(values: string[], keywords: readonly string[]): boolean {
  return values.some((value) => hasKeyword(value, [...keywords]));
}

export function dayOutfitMatchesFamily(
  outfit: {
    walkOut: {
      base: { kind: "separates"; top: string; bottom: string } | { kind: "dress"; dress: string };
      layer: string | null;
      shoes?: string | null;
      accessories?: string[];
    };
  },
  family: DayOutfitFamily,
): boolean {
  const { base, layer } = outfit.walkOut;
  const texts = bundleTexts(outfit);
  const hasStructured = hasAnyKeyword(texts, STRUCTURED_KEYWORDS);
  const hasLightLayer = hasAnyKeyword(texts, LIGHT_LAYER_KEYWORDS);
  const hasHeavyLayer = hasAnyKeyword(texts, HEAVY_LAYER_KEYWORDS);
  const hasWinterShoes = hasAnyKeyword(texts, WINTER_SHOE_KEYWORDS);
  const hasEasyShoes = hasAnyKeyword(texts, EASY_SHOE_KEYWORDS);
  const hasPolishedShoes = hasAnyKeyword(texts, POLISHED_SHOE_KEYWORDS);

  if (DRESS_FAMILIES.has(family)) {
    if (base.kind !== "dress") return false;
    if (family === "dress_plus_layer" || family === "dress_with_layering") {
      return family === "dress_plus_layer"
        ? Boolean(layer) && hasLightLayer && !hasHeavyLayer
        : Boolean(layer) && (hasHeavyLayer || hasWinterShoes);
    }
    if (layer) return false;
    if (family === "easy_dress") {
      return !hasStructured && hasEasyShoes;
    }
    if (family === "city_dress") {
      return hasStructured || hasPolishedShoes;
    }
    if (family === "light_dress") {
      return !hasHeavyLayer;
    }
    return true;
  }

  if (base.kind !== "separates") return false;

  if (SKIRT_FAMILIES.has(family)) {
    if (!hasKeyword(base.bottom, [...SKIRT_BOTTOM_KEYWORDS])) return false;
    return family === "skirt_with_tights" ? Boolean(layer) || hasWinterShoes || hasHeavyLayer : true;
  }

  if (SHORTS_FAMILIES.has(family)) {
    return hasKeyword(base.bottom, [...SHORT_BOTTOM_KEYWORDS]);
  }

  if (TROUSER_FAMILIES.has(family)) {
    if (!hasKeyword(base.bottom, [...TROUSER_BOTTOM_KEYWORDS])) return false;
    return family === "tailored_trouser_separates" ? hasStructured : !hasHeavyLayer;
  }

  if (family === "light_tailored_separates") {
    return !layer && hasStructured;
  }

  if (family === "light_separates") {
    return !layer && !hasStructured;
  }

  if (family === "soft_layered_separates") {
    return Boolean(layer) && hasLightLayer && !hasHeavyLayer;
  }

  if (family === "structured_separates") {
    return !layer && hasStructured;
  }

  if (family === "winter_separates") {
    return Boolean(layer) && (hasHeavyLayer || hasWinterShoes);
  }

  if (family === "coat_anchored_separates") {
    return Boolean(layer) && hasHeavyLayer;
  }

  return true;
}
