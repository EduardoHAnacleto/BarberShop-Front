// E2E tests for /admin/services.
// Precondition: API running, admin logged in.
import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@barbershop.com'
const ADMIN_PASSWORD = 'Admin@123'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', ADMIN_EMAIL)
  await page.fill('#password', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/admin')
  await page.goto('/admin/services')
  await page.waitForSelector('table')
})

test.describe('services page', () => {
  test('short name keeps Save disabled', async ({ page }) => {
    await page.click('button:has-text("New service")')
    await page.waitForSelector('#service-name')

    await page.fill('#service-name', 'Hi')
    await page.fill('#service-duration', '30')
    await page.fill('#service-price', '25')

    const saveBtn = page.locator('button:has-text("Save")').last()
    await expect(saveBtn).toBeDisabled()
    await expect(page.locator('text=at least 3 characters')).toBeVisible()
  })

  test('creates a valid service and it appears in the table', async ({ page }) => {
    await page.click('button:has-text("New service")')
    await page.waitForSelector('#service-name')

    const unique = `Service ${Date.now()}`
    await page.fill('#service-name', unique)
    await page.fill('#service-description', 'Test description')
    await page.fill('#service-duration', '45')
    await page.fill('#service-price', '35.50')

    await page.click('button:has-text("Save")')

    await expect(page.locator('.toast').first()).toBeVisible()
    await expect(page.locator('table')).toContainText(unique)
  })

  test('edits a service price', async ({ page }) => {
    await page.locator('button[aria-label="Edit service"]').first().click()
    await page.waitForSelector('#service-price')

    await page.fill('#service-price', '99.99')
    await page.click('button:has-text("Save")')

    await expect(page.locator('.toast').first()).toBeVisible()
    await expect(page.locator('table')).toContainText('$99.99')
  })

  test('deletes a service via the trash icon', async ({ page }) => {
    await page.locator('button[aria-label="Remove service"]').first().click()
    // Match the dialog heading rather than free text — the body also contains
    // the phrase "Remove service" (e.g. "Remove Service 123?").
    await expect(page.locator('h2:has-text("Remove service")')).toBeVisible()
    await page.click('button:has-text("Remove")')

    await expect(page.locator('.toast').first()).toBeVisible()
  })
})
