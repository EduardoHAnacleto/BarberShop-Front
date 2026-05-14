// Playwright configuration for E2E tests.
// Assumes the Nuxt dev server is started separately (or via webServer below)
// and the BarberShop API is running at http://localhost:8080.
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  reporter: 'html',

  use: {
    // Base URL for page.goto('/login') style navigation. Port 3001 because
    // 3000 is occupied by Grafana in this developer's local environment.
    baseURL: process.env.BASE_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Reuse the running dev server when present (typical local workflow);
  // otherwise spin up the preview build for CI runs.
  webServer: {
    command: 'npm run dev',
    url: process.env.BASE_URL ?? 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },

  projects: [
    { name: 'chromium',      use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',       use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',        use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
})
