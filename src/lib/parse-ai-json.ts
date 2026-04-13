/**
 * Extract and parse a JSON object from AI output. Handles:
 *  - Markdown code fences (```json ... ``` or ``` ... ```)
 *  - Leading/trailing prose ("Here's the JSON: {...} Let me know...")
 *  - Multiple consecutive whitespace/newlines
 *
 * Uses a brace-depth scanner (not a greedy regex) so trailing prose
 * containing `}` doesn't break the extraction.
 *
 * Throws AIParseError with the raw text captured for logging.
 */
export class AIParseError extends Error {
  constructor(message: string, public readonly raw: string) {
    super(message);
    this.name = "AIParseError";
  }
}

export function parseAiJson<T = unknown>(text: string): T {
  const candidate = extractJsonObject(text);
  if (!candidate) {
    throw new AIParseError("No JSON object found in AI response", text);
  }
  try {
    return JSON.parse(candidate) as T;
  } catch (e) {
    throw new AIParseError(
      `JSON parse failed: ${e instanceof Error ? e.message : "unknown"}`,
      text,
    );
  }
}

function extractJsonObject(text: string): string | null {
  // Strip markdown fences first.
  const cleaned = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");

  // Scan for the first balanced {...} block, honoring string literals.
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
    } else if (c === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        return cleaned.slice(start, i + 1);
      }
    }
  }

  return null;
}
