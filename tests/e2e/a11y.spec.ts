// Accessibility tests using @axe-core/playwright.
// Verifies zero critical/serious violations on all key routes.
// Run: npx playwright test tests/e2e/a11y.spec.ts
import { test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Helper: perform axe analysis and assert no critical/serious violations.
async function checkA11y(page: import('@playwright/test').Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const critical = results.violations.filter((v) => v.impact === 'critical')
  const serious = results.violations.filter((v) => v.impact === 'serious')

  if (critical.length > 0 || serious.length > 0) {
    const report = [...critical, ...serious]
      .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
      .join('\n')
    throw new Error(`Accessibility violations found:\n${report}`)
  }
}

// ── Public routes (no authentication required) ────────────────────────────────

test('login page has no critical/serious a11y violations', async ({ page }) => {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await checkA11y(page)
})

test('landing page has no critical/serious a11y violations', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await checkA11y(page)
})

test('booking step 1 (service selection) has no critical/serious a11y violations', async ({ page }) => {
  await page.goto('/book')
  await page.waitForLoadState('networkidle')
  await checkA11y(page)
})

// ── Admin routes (require authentication) ─────────────────────────────────────

test.describe('admin a11y', () => {
  // Log in once before all admin tests.
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@barbershop.com')
    await page.fill('input[type="password"]', 'Admin@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('admin dashboard has no critical/serious a11y violations', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await checkA11y(page)
  })

  test('admin appointments has no critical/serious a11y violations', async ({ page }) => {
    await page.goto('/admin/appointments')
    await page.waitForLoadState('networkidle')
    await checkA11y(page)
  })

  test('admin workers has no critical/serious a11y violations', async ({ page }) => {
    await page.goto('/admin/workers')
    await page.waitForLoadState('networkidle')
    await checkA11y(page)
  })

  test('admin schedule has no critical/serious a11y violations', async ({ page }) => {
    await page.goto('/admin/schedule')
    await page.waitForLoadState('networkidle')
    await checkA11y(page)
  })
})
