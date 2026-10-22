import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "paris-campaign.spec.ts",
  outputDir: "generated-artifacts/paris-browser",
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL,
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH },
  },
});
