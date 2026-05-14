// Smoke tests — verify the production stack is up and reachable.
// Run after every deploy; must complete in under 2 minutes.
// Requires env: API_URL, ADMIN_EMAIL, ADMIN_PASSWORD (or falls back to defaults).
import { test, expect } from '@playwright/test'

const API_URL = process.env.API_URL ?? 'http://localhost:8080'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@barbershop.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@123'

test('landing page loads with correct title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/BarberShop/)
  await expect(page.locator('nav')).toBeVisible()
})

test('API health endpoint returns 200', async ({ request }) => {
  const res = await request.get(`${API_URL}/health`)
  expect(res.status()).toBe(200)
})

test('login endpoint is reachable (returns 400/401 for bad credentials)', async ({ request }) => {
  const res = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: 'nonexistent@test.com', password: 'wrong' },
  })
  // 400 = validation error, 401 = invalid credentials — both confirm the API is up.
  expect([400, 401]).toContain(res.status())
})

test('admin page redirects unauthenticated users to /login', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login/)
})

test('SignalR indicator is green after admin login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', ADMIN_EMAIL)
  await page.fill('input[type="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('/admin')

  // The SignalR status indicator turns emerald when all hubs connect.
  const dot = page.locator('[data-testid="signalr-indicator"] span').first()
  await expect(dot).toHaveClass(/bg-emerald-400/, { timeout: 10_000 })
})
