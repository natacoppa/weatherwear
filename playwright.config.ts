import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3014",
    trace: "retain-on-failure",
  },
  reporter: [["list"]],
  // Assumes `npm run start:smoke` is running separately on port 3014.
  // Kept manual so we can reuse the build between runs during refactor phases.
});
