// E2E tests for /admin/appointments.
// Precondition: API running at http://localhost:8080, admin logged in.
import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@barbershop.com'
const ADMIN_PASSWORD = 'Admin@123'

// ── Auth fixture ──────────────────────────────────────────────────────────────

// Logs in as admin before each test so the admin surface is accessible.
test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', ADMIN_EMAIL)
  await page.fill('#password', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/admin')
  await page.goto('/admin/appointments')
  await page.waitForSelector('table')
})

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('appointments page', () => {
  test('creates an appointment and it appears in the table', async ({ page }) => {
    await page.click('button:has-text("New appointment")')
    await page.waitForSelector('[id="appt-customer"]')

    // Select first available customer, worker, and service.
    await page.selectOption('#appt-customer', { index: 1 })
    await page.selectOption('#appt-worker', { index: 1 })
    await page.selectOption('#appt-service', { index: 1 })

    // Set a future date.
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16)
    await page.fill('#appt-date', tomorrow)

    await page.click('button:has-text("Save")')

    // Modal should close and a success toast appear.
    await expect(page.locator('.toast').first()).toBeVisible()
    await expect(page.locator('table')).toContainText('Scheduled')
  })

  test('edits an appointment status to On Going', async ({ page }) => {
    // Click the first edit button in the table.
    await page.locator('button[aria-label="Edit appointment"]').first().click()
    await page.waitForSelector('#appt-status')

    await page.selectOption('#appt-status', '1')
    await page.click('button:has-text("Save")')

    await expect(page.locator('.toast').first()).toBeVisible()
    await expect(page.locator('table')).toContainText('On Going')
  })

  test('cancels an appointment via the trash icon', async ({ page }) => {
    await page.locator('button[aria-label="Cancel appointment"]').first().click()
    // Confirm dialog should appear.
    await expect(page.locator('text=Cancel appointment')).toBeVisible()
    await page.click('button:has-text("Cancel appointment")')
    await expect(page.locator('.toast').first()).toBeVisible()
  })

  test('status filter shows only appointments with selected status', async ({ page }) => {
    // Select "Completed" from the status dropdown.
    await page.selectOption('select.input:first-of-type', '2')
    // Every badge in the table should say "Completed".
    const badges = page.locator('.badge')
    const count = await badges.count()
    for (let i = 0; i < count; i++) {
      const text = await badges.nth(i).textContent()
      if (text && text.trim() !== '') {
        expect(['Completed', '']).toContain(text.trim())
      }
    }
  })

  test('text filter hides rows that do not match', async ({ page }) => {
    // Type something unlikely to match any name.
    await page.fill('input[type="search"]', 'zzzzznotexist')
    await expect(page.locator('text=No appointments found')).toBeVisible()
  })

  test('batch delay: selects 2 rows and delays them', async ({ page }) => {
    const checkboxes = page.locator('tbody input[type="checkbox"]')
    const total = await checkboxes.count()
    if (total < 2) test.skip(true, 'Needs at least 2 appointments seeded')

    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    await page.click('button:has-text("Delay")')
    await page.fill('input[type="number"]', '60')
    await page.click('button:has-text("Confirm")')

    await expect(page.locator('.toast').first()).toBeVisible()
  })

  test('batch cancel: selects 2 rows and cancels them', async ({ page }) => {
    const checkboxes = page.locator('tbody input[type="checkbox"]')
    const total = await checkboxes.count()
    if (total < 2) test.skip(true, 'Needs at least 2 appointments seeded')

    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    await page.click('button:has-text("Cancel all")')
    await expect(page.locator('text=Cancel all selected')).toBeVisible()
    await page.click('button:has-text("Cancel all"):last-of-type')

    await expect(page.locator('.toast').first()).toBeVisible()
  })
})
