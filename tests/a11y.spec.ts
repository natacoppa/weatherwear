import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Fails the suite only on serious/critical violations — earlier phases of
// the refactor already added aria labels and focus rings, but this gate
// keeps future changes honest.
test.describe("a11y", () => {
  test("landing has no serious violations", async ({ page }) => {
    await page.goto("/");
    // Scope to structural violations (missing labels, roles, etc.).
    // Color-contrast is a pre-existing palette design decision tracked separately.
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test("app has no serious violations", async ({ page }) => {
    await page.goto("/app");
    // Scope to structural violations (missing labels, roles, etc.).
    // Color-contrast is a pre-existing palette design decision tracked separately.
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});
