import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  workers: 1, // Run all tests one by one

  testDir: "./src/tests",

  fullyParallel: true,

  reporter: [["line"], ["allure-playwright", { resultsDir: "allure-results" }]],

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
