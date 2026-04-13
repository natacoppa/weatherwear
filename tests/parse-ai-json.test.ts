import { expect, test } from "@playwright/test";
import { AIParseError, parseAiJson } from "../src/lib/parse-ai-json";

test.describe("parseAiJson", () => {
  test("parses plain JSON", () => {
    expect(parseAiJson<{ a: number }>('{"a": 1}')).toEqual({ a: 1 });
  });

  test("strips ```json fences", () => {
    expect(parseAiJson<{ a: number }>("```json\n{\"a\": 1}\n```")).toEqual({ a: 1 });
  });

  test("strips ``` fences without language", () => {
    expect(parseAiJson<{ a: number }>("```\n{\"a\": 1}\n```")).toEqual({ a: 1 });
  });

  test("handles leading prose", () => {
    expect(parseAiJson<{ a: number }>('Here is the JSON: {"a": 1}')).toEqual({ a: 1 });
  });

  test("handles trailing prose with braces", () => {
    const out = parseAiJson<{ a: number }>(
      'Result: {"a": 1}. Let me know if {you need} anything else.',
    );
    expect(out).toEqual({ a: 1 });
  });

  test("handles nested objects", () => {
    const out = parseAiJson<{ a: { b: number[] } }>(
      'here: {"a": {"b": [1, 2, 3]}} done',
    );
    expect(out).toEqual({ a: { b: [1, 2, 3] } });
  });

  test("respects string-escaped braces", () => {
    const out = parseAiJson<{ s: string }>('{"s": "a { b } c"} trailing');
    expect(out).toEqual({ s: "a { b } c" });
  });

  test("throws AIParseError on no JSON", () => {
    expect(() => parseAiJson("just prose, no json")).toThrow(AIParseError);
  });

  test("throws AIParseError on malformed JSON", () => {
    expect(() => parseAiJson("{a: 1}")).toThrow(AIParseError);
  });

  test("AIParseError exposes the raw text", () => {
    try {
      parseAiJson("{a: 1}");
    } catch (e) {
      expect(e).toBeInstanceOf(AIParseError);
      expect((e as AIParseError).raw).toBe("{a: 1}");
    }
  });
});
