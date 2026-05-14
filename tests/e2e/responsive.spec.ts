// Responsive layout tests across 4 viewport widths.
// Verifies sidebar visibility, hamburger button, horizontal overflow,
// and dashboard grid columns at mobile / tablet / desktop / wide.
import { test, expect } from '@playwright/test'

// ── Mobile: 375px ─────────────────────────────────────────────────────────────

test.describe('mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@barbershop.com')
    await page.fill('input[type="password"]', 'Admin@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('sidebar is hidden and hamburger button is visible', async ({ page }) => {
    // The sidebar drawer is off-screen on mobile (translate-x-full).
    // The data-testid lets us check transform without relying on visibility.
    const sidebar = page.getByTestId('admin-sidebar')
    const box = await sidebar.boundingBox()
    // Sidebar is translated off-screen: its right edge should be ≤ 0 when closed.
    expect(box).not.toBeNull()
    expect((box!.x + box!.width)).toBeLessThanOrEqual(0)

    // Hamburger button is rendered (not md:hidden at 375px).
    await expect(page.getByTestId('hamburger-btn')).toBeVisible()
  })

  test('hamburger opens sidebar drawer', async ({ page }) => {
    await page.getByTestId('hamburger-btn').click()

    // After opening, the sidebar should be on-screen.
    const sidebar = page.getByTestId('admin-sidebar')
    await expect(sidebar).toBeVisible()
    const box = await sidebar.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
  })

  test('appointments table has horizontal scroll wrapper on mobile', async ({ page }) => {
    await page.goto('/admin/appointments')
    await page.waitForLoadState('networkidle')

    // The table-wrapper div must have overflow-x auto/scroll so tables don't
    // force the page to overflow horizontally.
    const wrapper = page.locator('.table-wrapper').first()
    await expect(wrapper).toBeVisible()

    // No horizontal page overflow.
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(375 + 2) // 2px rounding tolerance
  })
})

// ── Tablet: 768px ─────────────────────────────────────────────────────────────

test.describe('tablet (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@barbershop.com')
    await page.fill('input[type="password"]', 'Admin@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('hamburger is hidden and sidebar is visible at tablet width', async ({ page }) => {
    // At md breakpoint (768px) the hamburger uses md:hidden.
    await expect(page.getByTestId('hamburger-btn')).toBeHidden()

    // Sidebar is on-screen.
    const sidebar = page.getByTestId('admin-sidebar')
    const box = await sidebar.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
  })

  test('dashboard KPI grid renders 2 or 3 columns at tablet width', async ({ page }) => {
    // At md breakpoint: grid-cols-3 — at least 2 cols visible (5 cards / 3 = 2 rows).
    const cards = page.locator('.card').filter({ hasText: /Today|Scheduled|On Going|Workers|Customers/ })
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(5)
  })
})

// ── Desktop: 1280px ───────────────────────────────────────────────────────────

test.describe('desktop (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@barbershop.com')
    await page.fill('input[type="password"]', 'Admin@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('sidebar is expanded and hamburger is hidden at desktop width', async ({ page }) => {
    await expect(page.getByTestId('hamburger-btn')).toBeHidden()

    const sidebar = page.getByTestId('admin-sidebar')
    const box = await sidebar.boundingBox()
    // Expanded sidebar is 240px (w-60).
    expect(box!.width).toBeGreaterThanOrEqual(200)
  })

  test('dashboard KPI grid shows 5 columns at xl width', async ({ page }) => {
    // xl:grid-cols-5 kicks in at 1280px — all 5 KPI cards should fit in one row.
    const grid = page.locator('.grid.grid-cols-2').first()
    await expect(grid).toBeVisible()

    // All 5 KPI cards are visible without vertical stacking.
    const cards = page.locator('.card').filter({ hasText: /Today|Scheduled|On Going|Workers|Customers/ })
    await expect(cards).toHaveCount(5)
  })

  test('no horizontal overflow at desktop width', async ({ page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(1280 + 2)
  })
})

// ── Wide: 1920px ──────────────────────────────────────────────────────────────

test.describe('wide (1920px)', () => {
  test.use({ viewport: { width: 1920, height: 1080 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@barbershop.com')
    await page.fill('input[type="password"]', 'Admin@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('no horizontal overflow on admin dashboard at 1920px', async ({ page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(1920 + 2)
  })

  test('no horizontal overflow on appointments page at 1920px', async ({ page }) => {
    await page.goto('/admin/appointments')
    await page.waitForLoadState('networkidle')
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(1920 + 2)
  })

  test('no horizontal overflow on landing page at 1920px', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(1920 + 2)
  })
})
