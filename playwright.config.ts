import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const e2eDatabaseUrl =
  process.env.E2E_DATABASE_URL ??
  "postgresql://deliveryreg:deliveryreg@localhost:55438/deliveryreg_e2e?schema=public";

process.env.DATABASE_URL ??= e2eDatabaseUrl;

export default defineConfig({
  testDir: "./e2e/specs",
  timeout: 45_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: {
    command: `DATABASE_URL="${e2eDatabaseUrl}" AUTH_SECRET="e2e-auth-secret-with-more-than-thirty-two-characters" BUSINESS_TIMEZONE="America/Manaus" NODE_ENV=production npm run start -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium"
      }
    }
  ],
  outputDir: "test-results/e2e"
});
