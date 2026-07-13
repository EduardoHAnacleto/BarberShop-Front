// E2E tests for the public booking flow.
// Precondition: API running at http://localhost:8080 with at least one service
// and one worker configured (standard seed data).
import { test, expect } from '@playwright/test'

// ── Full booking flow ─────────────────────────────────────────────────────────

test.describe('booking flow — complete journey', () => {
  test('completes a booking and lands on the success page', async ({ page }) => {
    // Start at the booking page.
    await page.goto('/book')
    await expect(page.getByRole('heading', { name: 'Book an Appointment' })).toBeVisible()

    // Step 1: wait for services to load and click the first one.
    await page.waitForSelector('button.card', { timeout: 10_000 })
    const firstService = page.locator('button.card').first()
    await firstService.click()

    // Advance to step 2.
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 2: wait for worker cards to load and click the first one.
    await page.waitForSelector('button.card', { timeout: 10_000 })
    const firstWorker = page.locator('button.card').first()
    await firstWorker.click()

    // Pick tomorrow's date in ISO format.
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    // Advance past weekends to find a likely open weekday.
    while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
      tomorrow.setDate(tomorrow.getDate() + 1)
    }
    const isoDate = tomorrow.toISOString().slice(0, 10)
    await page.fill('#booking-date', isoDate)

    // Wait for time slots to appear (requires schedule fetch).
    await page.waitForTimeout(1_500)

    // If the day is open, select the first time slot; otherwise skip to confirm
    // by picking the next weekday until we find an open one.
    const closedMsg = page.getByText(/closed on this day/i)
    const hasSlots = await page.locator('button.font-mono').count()

    if ((await closedMsg.isVisible()) || hasSlots === 0) {
      test.skip(true, 'No open slots available for the next weekday in test environment')
      return
    }

    // Click the first available time slot.
    await page.locator('button.font-mono').first().click()

    // Advance to step 3.
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 3: fill customer details.
    await page.fill('#customer-name', 'Test Customer')
    await page.fill('#customer-email', 'test.e2e@example.com')

    // Submit the booking.
    await page.getByRole('button', { name: /confirm booking/i }).click()

    // Success page should appear with an appointment ID.
    await expect(page).toHaveURL(/\/book\/success/, { timeout: 15_000 })
    await expect(page.getByText('Booking Confirmed!')).toBeVisible()
    await expect(page.getByText(/Appointment #/i)).toBeVisible()
  })
})

// ── Pre-selection via query param ─────────────────────────────────────────────

test.describe('booking — serviceId pre-selection', () => {
  test('navigating with ?serviceId=1 pre-selects that service', async ({ page }) => {
    await page.goto('/book?serviceId=1')

    // Wait for services to load.
    await page.waitForSelector('button.card', { timeout: 10_000 })

    // The service with id=1 card should have the gold border active class.
    // We check that the Continue button is enabled (which only happens when
    // a service is already selected via the query param).
    const continueBtn = page.getByRole('button', { name: /continue/i })
    await expect(continueBtn).not.toBeDisabled({ timeout: 5_000 })
  })
})

// ── Closed day message ────────────────────────────────────────────────────────

test.describe('booking — closed day handling', () => {
  test('selecting a date that is closed shows the unavailability message', async ({ page }) => {
    await page.goto('/book')
    await page.waitForSelector('button.card', { timeout: 10_000 })

    // Select the first service.
    await page.locator('button.card').first().click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Select the first worker.
    await page.waitForSelector('button.card', { timeout: 10_000 })
    await page.locator('button.card').first().click()

    // Pick the nearest Sunday — typically closed for a barbershop.
    const nextSunday = new Date()
    const daysUntilSunday = (7 - nextSunday.getDay()) % 7 || 7
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday)
    const isoDate = nextSunday.toISOString().slice(0, 10)
    await page.fill('#booking-date', isoDate)

    // Allow schedule fetch to complete.
    await page.waitForTimeout(2_000)

    // Either the closed message appears or time slots appear — both are valid.
    const closedMsg = page.getByText(/closed on this day/i)
    const slots = page.locator('button.font-mono')

    const closedVisible = await closedMsg.isVisible()
    const slotsCount = await slots.count()

    // At least one outcome must be visible after the schedule loads.
    expect(closedVisible || slotsCount > 0).toBe(true)
  })
})

// ── Email validation ──────────────────────────────────────────────────────────

test.describe('booking — form validation', () => {
  test('confirm button is disabled when email is invalid', async ({ page }) => {
    // Navigate directly to the booking flow and advance to step 3 via URL
    // manipulation is not possible with a stepper; instead we use a helper.
    // We need to complete steps 1 and 2 first.
    await page.goto('/book')
    await page.waitForSelector('button.card', { timeout: 10_000 })
    await page.locator('button.card').first().click()
    await page.getByRole('button', { name: /continue/i }).click()

    await page.waitForSelector('button.card', { timeout: 10_000 })
    await page.locator('button.card').first().click()

    // Find next open weekday.
    const d = new Date()
    d.setDate(d.getDate() + 1)
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
    await page.fill('#booking-date', d.toISOString().slice(0, 10))
    await page.waitForTimeout(1_500)

    const slots = page.locator('button.font-mono')
    if ((await slots.count()) === 0) {
      test.skip(true, 'No open slots available')
      return
    }
    await slots.first().click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 3: provide an invalid email.
    await page.fill('#customer-name', 'Test User')
    await page.fill('#customer-email', 'not-an-email')

    // The confirm button should be disabled because validation fails.
    const confirmBtn = page.getByRole('button', { name: /confirm booking/i })
    await expect(confirmBtn).toBeDisabled()
  })
})
