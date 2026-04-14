// Lightweight runtime validators for AI-generated JSON. Not zod — just
// enough to catch a missing/renamed field before it propagates as a typed
// `any` into downstream code.
//
// Pattern: each validator asserts required keys and types, coerces where
// safe, and throws AIShapeError with a human-readable message otherwise.
//
// Narrow the `unknown` into the declared return type and trust the caller
// to have run this before using the result.

import type { DayOutfit, CreatorOutfit, TripResult } from "@/lib/types";
import { isDayOutfitFamily } from "@/lib/outfit-family";

export class AIShapeError extends Error {
  constructor(message: string, public readonly raw: unknown) {
    super(`AI response shape invalid: ${message}`);
    this.name = "AIShapeError";
  }
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function dayOutfitBase(v: unknown): DayOutfit["walkOut"]["base"] {
  if (!isObject(v)) throw new AIShapeError("walkOut.base missing", v);
  if (v.kind === "separates") {
    const top = str(v.top);
    const bottom = str(v.bottom);
    if (!top || !bottom) {
      throw new AIShapeError("separates base requires top and bottom", v);
    }
    return {
      kind: "separates",
      top,
      bottom,
    };
  }
  if (v.kind === "dress") {
    const dress = str(v.dress);
    if (!dress) {
      throw new AIShapeError("dress base requires dress", v);
    }
    return {
      kind: "dress",
      dress,
    };
  }
  throw new AIShapeError("walkOut.base kind invalid", v);
}

export function assertDayOutfit(raw: unknown): DayOutfit {
  if (!isObject(raw)) throw new AIShapeError("not an object", raw);
  if (!isObject(raw.walkOut)) throw new AIShapeError("walkOut missing", raw);
  if (!isObject(raw.carry)) throw new AIShapeError("carry missing", raw);
  if (!isObject(raw.evening)) throw new AIShapeError("evening missing", raw);

  const walkOut = raw.walkOut;
  const carry = raw.carry;
  const evening = raw.evening;
  const family = str(raw.family);
  if (!isDayOutfitFamily(family)) {
    throw new AIShapeError("family missing or invalid", raw);
  }

  return {
    family,
    headline: str(raw.headline),
    walkOut: {
      summary: str(walkOut.summary),
      base: dayOutfitBase(walkOut.base),
      layer: typeof walkOut.layer === "string" ? walkOut.layer : null,
      shoes: str(walkOut.shoes),
      accessories: strArray(walkOut.accessories),
    },
    carry: {
      summary: str(carry.summary),
      add: strArray(carry.add),
      remove: strArray(carry.remove),
      note: str(carry.note),
    },
    evening: {
      summary: str(evening.summary),
      add: strArray(evening.add),
      note: str(evening.note),
    },
    bagEssentials: strArray(raw.bagEssentials),
  };
}

// Packing-list shape used by /api/trip.
export function assertPackingList(raw: unknown): TripResult["packingList"] {
  if (!isObject(raw)) throw new AIShapeError("packing list not an object", raw);
  const cats = Array.isArray(raw.categories) ? raw.categories : [];
  return {
    headline: str(raw.headline),
    weatherSummary: str(raw.weatherSummary),
    categories: cats
      .filter(isObject)
      .map((c) => ({
        name: str(c.name),
        items: strArray(c.items),
      })),
    skipList: strArray(raw.skipList),
    proTip: str(raw.proTip),
  };
}

// Creator-outfit shape used by /api/outfit-shopmy. Item indices are ints
// referencing candidate arrays; we keep them as numbers and let the
// consumer remap. Out-of-range indices become -1 elsewhere.
interface CreatorCandidateSlot {
  index: number;
}

export interface CreatorOutfitRaw {
  headline: string;
  walkOut: {
    summary: string;
    top: CreatorCandidateSlot | null;
    layer: CreatorCandidateSlot | null;
    bottom: CreatorCandidateSlot | null;
    shoes: CreatorCandidateSlot | null;
    accessories: CreatorCandidateSlot[];
  };
  carry: CreatorOutfit["outfit"]["carry"];
  evening: CreatorOutfit["outfit"]["evening"];
  bagEssentials: string[];
}

function slotOrNull(v: unknown): CreatorCandidateSlot | null {
  if (!isObject(v)) return null;
  if (typeof v.index !== "number") return null;
  return { index: v.index };
}

export function assertCreatorOutfitRaw(raw: unknown): CreatorOutfitRaw {
  if (!isObject(raw)) throw new AIShapeError("not an object", raw);
  if (!isObject(raw.walkOut)) throw new AIShapeError("walkOut missing", raw);
  if (!isObject(raw.carry)) throw new AIShapeError("carry missing", raw);
  if (!isObject(raw.evening)) throw new AIShapeError("evening missing", raw);

  const accessories = Array.isArray(raw.walkOut.accessories)
    ? raw.walkOut.accessories.map(slotOrNull).filter((x): x is CreatorCandidateSlot => x !== null)
    : [];

  const carry = raw.carry;
  const evening = raw.evening;
  return {
    headline: str(raw.headline),
    walkOut: {
      summary: str(raw.walkOut.summary),
      top: slotOrNull(raw.walkOut.top),
      layer: slotOrNull(raw.walkOut.layer),
      bottom: slotOrNull(raw.walkOut.bottom),
      shoes: slotOrNull(raw.walkOut.shoes),
      accessories,
    },
    carry: {
      summary: str(carry.summary),
      add: strArray(carry.add),
      remove: strArray(carry.remove),
      note: str(carry.note),
    },
    evening: {
      summary: str(evening.summary),
      add: strArray(evening.add),
      note: str(evening.note),
    },
    bagEssentials: strArray(raw.bagEssentials),
  };
}
