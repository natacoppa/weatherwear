import type { OutfitSignalBrief } from "@/lib/outfit-signals";
import type { CreatorOutfit, DayOutfit } from "@/lib/types";

const EXTREME_HEAT_DISALLOWED = [
  "jacket",
  "coat",
  "scarf",
  "bomber",
  "wool",
  "cashmere",
  "sweater",
  "knit",
] as const;

const NON_WALKABLE_FOOTWEAR = [
  "stiletto",
  "heel",
  "heels",
  "pump",
  "pumps",
] as const;

function collectDayFields(outfit: DayOutfit): string[] {
  return [
    outfit.walkOut.top,
    outfit.walkOut.layer,
    outfit.walkOut.bottom,
    outfit.walkOut.shoes,
    ...outfit.walkOut.accessories,
    ...outfit.carry.add,
    ...outfit.carry.remove,
    ...outfit.evening.add,
    ...outfit.bagEssentials,
  ].filter((value): value is string => Boolean(value));
}

function collectDayFootwearFields(outfit: DayOutfit): string[] {
  return [
    outfit.walkOut.shoes,
    ...outfit.carry.add,
    ...outfit.evening.add,
    ...outfit.bagEssentials,
  ].filter((value): value is string => Boolean(value));
}

function collectCreatorFields(outfit: CreatorOutfit["outfit"]): string[] {
  return [
    outfit.walkOut.top?.title,
    outfit.walkOut.top?.category,
    outfit.walkOut.top?.canonicalCategory,
    outfit.walkOut.layer?.title,
    outfit.walkOut.layer?.category,
    outfit.walkOut.layer?.canonicalCategory,
    outfit.walkOut.bottom?.title,
    outfit.walkOut.bottom?.category,
    outfit.walkOut.bottom?.canonicalCategory,
    outfit.walkOut.shoes?.title,
    outfit.walkOut.shoes?.category,
    outfit.walkOut.shoes?.canonicalCategory,
    ...outfit.walkOut.accessories.map((item) => item.title),
    ...outfit.walkOut.accessories.map((item) => item.category),
    ...outfit.walkOut.accessories.map((item) => item.canonicalCategory),
    ...outfit.carry.add,
    ...outfit.carry.remove,
    ...outfit.evening.add,
    ...outfit.bagEssentials,
  ].filter((value): value is string => Boolean(value));
}

function collectCreatorFootwearFields(outfit: CreatorOutfit["outfit"]): string[] {
  return [
    outfit.walkOut.shoes?.title,
    ...outfit.carry.add,
    ...outfit.evening.add,
    ...outfit.bagEssentials,
  ].filter((value): value is string => Boolean(value));
}

function findExtremeHeatViolations(fields: string[]): string[] {
  const joined = fields.join("\n").toLowerCase();
  return EXTREME_HEAT_DISALLOWED
    .filter((token) => joined.includes(token))
    .map((token) => `Extreme heat guardrail violation: found disallowed item "${token}".`);
}

function findCreatorExtremeHeatStructuralViolations(outfit: CreatorOutfit["outfit"]): string[] {
  const violations: string[] = [];

  if (outfit.walkOut.layer?.canonicalCategory === "layer") {
    violations.push("Extreme heat guardrail violation: walk-out layer slot contains outerwear.");
  }

  return violations;
}

function findFootwearViolations(fields: string[]): string[] {
  const joined = fields.join("\n").toLowerCase();
  return NON_WALKABLE_FOOTWEAR
    .filter((token) => joined.includes(token))
    .map((token) => `Walking-footwear guardrail violation: found non-walkable footwear "${token}".`);
}

export function findDayOutfitGuardrailViolations(outfit: DayOutfit, signalBrief: OutfitSignalBrief): string[] {
  const violations: string[] = [];
  if (signalBrief.overrides.extremeHeat) {
    violations.push(...findExtremeHeatViolations(collectDayFields(outfit)));
  }
  if (signalBrief.overrides.footwear) {
    violations.push(...findFootwearViolations(collectDayFootwearFields(outfit)));
  }
  return violations;
}

export function findCreatorOutfitGuardrailViolations(
  outfit: CreatorOutfit["outfit"],
  signalBrief: OutfitSignalBrief,
): string[] {
  const violations: string[] = [];
  if (signalBrief.overrides.extremeHeat) {
    violations.push(...findExtremeHeatViolations(collectCreatorFields(outfit)));
    violations.push(...findCreatorExtremeHeatStructuralViolations(outfit));
  }
  if (signalBrief.overrides.footwear) {
    violations.push(...findFootwearViolations(collectCreatorFootwearFields(outfit)));
  }
  return violations;
}

export function buildGuardrailRetryInstruction(violations: string[], signalBrief: OutfitSignalBrief): string {
  const corrections: string[] = [];

  if (signalBrief.overrides.extremeHeat) {
    corrections.push(
      "Hard correction: this is an extreme-heat day. Rebuild the outfit for the hottest part of the day, not the morning. Do not include jackets, scarves, sweaters, knits, wool, cashmere, coats, or similar heavy layers.",
    );
  }

  if (signalBrief.overrides.footwear) {
    corrections.push(
      "Hard correction: this is a walking-heavy day. The shoes must be genuinely walkable, not heels, pumps, stilettos, or similarly punishing footwear.",
    );
  }

  if (corrections.length === 0) {
    corrections.push("Hard correction: rebuild the outfit to satisfy the weather guardrails.");
  }

  return `${corrections.join("\n")}\nViolations to fix:\n${violations.map((violation) => `- ${violation}`).join("\n")}`;
}
