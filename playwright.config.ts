import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  workers: 1, // Sequential - prevents shared state issues between tests
  fullyParallel: false, // Consistent with workers: 1

  testDir: "./src/tests",

  // Retry on failure - handles flaky network/cold start scenarios
  retries: process.env.CI ? 2 : 1,

  reporter: [
    ["line"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["allure-playwright", { outputFolder: "allure-results" }],
    ["junit", { outputFile: "allure-results/results.xml" }],
  ],

  use: {
    baseURL: process.env.RENDER_STAGING_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },

    /* Test against branded browsers */
    // {
    //   name: "Microsoft Edge",
    //   use: {
    //     ...devices["Desktop Edge"],
    //     channel: "msedge",
    //   },
    // },
    // {
    //   name: "Google Chrome",
    //   use: { ...devices["Desktop Chrome"], channel: "chrome" },
    // },
  ],
})
