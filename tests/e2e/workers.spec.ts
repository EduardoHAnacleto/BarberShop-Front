// E2E tests for /admin/workers.
// Precondition: API running at http://localhost:8080, admin logged in.
import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@barbershop.com'
const ADMIN_PASSWORD = 'Admin@123'

// ── Auth fixture ──────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', ADMIN_EMAIL)
  await page.fill('#password', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/admin')
  await page.goto('/admin/workers')
  await page.waitForSelector('table')
})

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('workers page', () => {
  test('creates a worker and it appears in the table', async ({ page }) => {
    await page.click('button:has-text("New worker")')
    await page.waitForSelector('#worker-name')

    await page.fill('#worker-name', 'John Doe Barber')
    await page.fill('#worker-email', `worker_${Date.now()}@test.com`)
    await page.fill('#worker-phone', '555-0199')
    await page.fill('#worker-position', 'Senior Barber')
    await page.fill('#worker-wage', '30')

    // Select at least one service if available.
    const firstServiceCheckbox = page.locator('input[type="checkbox"]').first()
    const checkboxCount = await page.locator('input[type="checkbox"]').count()
    if (checkboxCount > 0) {
      await firstServiceCheckbox.check()
    }

    await page.click('button:has-text("Save")')

    await expect(page.locator('.toast').first()).toBeVisible()
    await expect(page.locator('table')).toContainText('John Doe Barber')
  })

  test('short name keeps Save button disabled', async ({ page }) => {
    await page.click('button:has-text("New worker")')
    await page.waitForSelector('#worker-name')

    // Name with fewer than 10 characters.
    await page.fill('#worker-name', 'Short')
    await page.fill('#worker-email', 'short@test.com')
    await page.fill('#worker-wage', '20')

    const saveBtn = page.locator('button:has-text("Save")').last()
    await expect(saveBtn).toBeDisabled()

    // Validation hint should be visible.
    await expect(page.locator('text=at least 10 characters')).toBeVisible()
  })

  test('edits a worker position and change appears in the table', async ({ page }) => {
    await page.locator('button[aria-label="Edit worker"]').first().click()
    await page.waitForSelector('#worker-position')

    await page.fill('#worker-position', 'Head Stylist')
    await page.click('button:has-text("Save")')

    await expect(page.locator('.toast').first()).toBeVisible()
    await expect(page.locator('table')).toContainText('Head Stylist')
  })

  test('deletes a worker via the trash icon', async ({ page }) => {
    // Capture the name of the first worker so we can verify it is gone.
    const firstNameEl = page.locator('tbody tr').first().locator('td').nth(1)
    const workerName = await firstNameEl.textContent()

    await page.locator('button[aria-label="Remove worker"]').first().click()
    await expect(page.locator('text=Remove worker')).toBeVisible()
    await page.click('button:has-text("Remove")')

    await expect(page.locator('.toast').first()).toBeVisible()
    if (workerName?.trim()) {
      await expect(page.locator('table')).not.toContainText(workerName.trim())
    }
  })
})
