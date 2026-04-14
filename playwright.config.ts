import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./src/tests",
  fullyParallel: true,
  reporter: [["line"], ["allure-playwright", { resultsDir: "allure-results" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "edge", use: { ...devices["Desktop Edge"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "safari", use: { ...devices["Desktop Safari"] } },
  ],
})
