import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("landing renders with headline", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Never");
  });

  test("app page renders with search input", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByPlaceholder(/Enter a city|Where are you going/)).toBeVisible();
  });

  test("app can run a today search and render a result", async ({ page }) => {
    await page.goto("/app");
    const input = page.getByPlaceholder(/Enter a city|Where are you going/);
    await input.fill("Los Angeles");
    await page.getByRole("button", { name: /^Go$/ }).click();
    // Result card header shows the location eyebrow (uppercased "LOS ANGELES...").
    await expect(page.getByText(/Los Angeles/i).first()).toBeVisible({ timeout: 45_000 });
  });
});
