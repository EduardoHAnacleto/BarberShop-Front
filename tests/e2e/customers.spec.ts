// E2E tests for /admin/customers.
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
  await page.goto('/admin/customers')
  await page.waitForSelector('table')
})

test.describe('customers page', () => {
  test('creates a customer and it appears in the table', async ({ page }) => {
    await page.click('button:has-text("New customer")')
    await page.waitForSelector('#customer-name')

    const unique = `Customer ${Date.now()}`
    await page.fill('#customer-name', unique)
    await page.fill('#customer-email', `c_${Date.now()}@test.com`)
    await page.fill('#customer-phone', '555-1234')

    await page.click('button:has-text("Save")')

    await expect(page.locator('.toast').first()).toBeVisible()
    await expect(page.locator('table')).toContainText(unique)
  })

  test('edits a customer name and change appears in the table', async ({ page }) => {
    await page.locator('button[aria-label="Edit customer"]').first().click()
    await page.waitForSelector('#customer-name')

    const newName = `Edited ${Date.now()}`
    await page.fill('#customer-name', newName)
    await page.click('button:has-text("Save")')

    await expect(page.locator('.toast').first()).toBeVisible()
    await expect(page.locator('table')).toContainText(newName)
  })

  test('deletes a customer via the trash icon', async ({ page }) => {
    const firstName = await page.locator('tbody tr').first().locator('td').first().textContent()

    await page.locator('button[aria-label="Remove customer"]').first().click()
    await expect(page.locator('text=Remove customer')).toBeVisible()
    await page.click('button:has-text("Remove")')

    await expect(page.locator('.toast').first()).toBeVisible()
    if (firstName?.trim()) {
      await expect(page.locator('table')).not.toContainText(firstName.trim())
    }
  })
})
