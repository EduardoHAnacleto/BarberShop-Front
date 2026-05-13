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
    // Base URL for page.goto('/login') style navigation.
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Start the Nuxt preview server before running E2E tests when not already
  // running. The build must have been completed beforehand via npm run build.
  webServer: {
    command: 'npm run preview',
    url: process.env.BASE_URL ?? 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },

  // Default project: Chromium desktop. Sprint 7 adds Firefox, WebKit and mobile.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
