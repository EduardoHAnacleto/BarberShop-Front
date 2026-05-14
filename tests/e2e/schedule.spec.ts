// E2E tests for /admin/schedule.
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
  await page.goto('/admin/schedule')
  await page.waitForSelector('table')
})

test.describe('schedule page', () => {
  test('toggling Monday open flag persists after reload', async ({ page }) => {
    const mondayRow = page.locator('tbody tr', { hasText: 'Monday' })
    const checkbox = mondayRow.locator('input[type="checkbox"]')

    const wasChecked = await checkbox.isChecked()
    // Flip the state.
    await checkbox.setChecked(!wasChecked)
    await mondayRow.locator('button:has-text("Save")').click()

    await expect(page.locator('.toast').first()).toBeVisible()

    // Reload and verify the flag is now the flipped value.
    await page.reload()
    await page.waitForSelector('table')
    const newCheckbox = page.locator('tbody tr', { hasText: 'Monday' }).locator('input[type="checkbox"]')
    expect(await newCheckbox.isChecked()).toBe(!wasChecked)

    // Flip back so the test is idempotent across runs.
    await newCheckbox.setChecked(wasChecked)
    await page.locator('tbody tr', { hasText: 'Monday' }).locator('button:has-text("Save")').click()
    await expect(page.locator('.toast').first()).toBeVisible()
  })

  test('adds a closure and it appears in the list', async ({ page }) => {
    await page.click('button:has-text("Add closure")')
    await page.waitForSelector('#closure-from')

    const future = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 16)
    await page.fill('#closure-from', future)
    const reason = `Holiday ${Date.now()}`
    await page.fill('#closure-reason', reason)

    await page.click('button:has-text("Save")')

    await expect(page.locator('.toast').first()).toBeVisible()
    await expect(page.locator('text=' + reason)).toBeVisible()
  })

  test('removes a closure via the trash icon', async ({ page }) => {
    const initialCount = await page.locator('button[aria-label="Remove closure"]').count()
    if (initialCount === 0) test.skip(true, 'No closures to remove')

    await page.locator('button[aria-label="Remove closure"]').first().click()
    await expect(page.locator('text=Remove closure')).toBeVisible()
    await page.click('button:has-text("Remove")')

    await expect(page.locator('.toast').first()).toBeVisible()
  })
})
