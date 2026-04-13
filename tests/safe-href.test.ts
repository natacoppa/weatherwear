import { expect, test } from "@playwright/test";
import { safeHref } from "../src/lib/safe-href";

test.describe("safeHref", () => {
  test("passes through https", () => {
    expect(safeHref("https://example.com/x")).toBe("https://example.com/x");
  });

  test("passes through http", () => {
    expect(safeHref("http://example.com")).toBe("http://example.com");
  });

  test("passes through protocol-relative", () => {
    expect(safeHref("//example.com/x")).toBe("//example.com/x");
  });

  test("passes through path-relative and anchor", () => {
    expect(safeHref("/about")).toBe("/about");
    expect(safeHref("#section")).toBe("#section");
  });

  test("passes through mailto and tel", () => {
    expect(safeHref("mailto:a@b.com")).toBe("mailto:a@b.com");
    expect(safeHref("tel:+14155551234")).toBe("tel:+14155551234");
  });

  test("rejects javascript:", () => {
    expect(safeHref("javascript:alert(1)")).toBe("#");
    expect(safeHref("JavaScript:alert(1)")).toBe("#");
    expect(safeHref("  javascript:alert(1)")).toBe("#");
  });

  test("rejects javascript: with smuggled control characters", () => {
    expect(safeHref("java\tscript:alert(1)")).toBe("#");
    expect(safeHref("\tjavascript:alert(1)")).toBe("#");
    expect(safeHref("java\0script:alert(1)")).toBe("#");
  });

  test("rejects data:, vbscript:, file:", () => {
    expect(safeHref("data:text/html,<script>alert(1)</script>")).toBe("#");
    expect(safeHref("vbscript:msgbox(1)")).toBe("#");
    expect(safeHref("file:///etc/passwd")).toBe("#");
  });

  test("handles null / undefined / empty / whitespace", () => {
    expect(safeHref(null)).toBe("#");
    expect(safeHref(undefined)).toBe("#");
    expect(safeHref("")).toBe("#");
    expect(safeHref("   ")).toBe("#");
  });
});
