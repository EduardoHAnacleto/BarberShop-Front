// E2E tests for the authentication flow.
// Precondition: API running at http://localhost:8080 with seed user
//   admin@barbershop.com / Admin@123
//
// WARNING: The lockout test (last describe block) makes 5 failed login attempts
// against the admin account, which may lock it for the default lockout window.
// Run it in an isolated or resettable environment if possible.
import { test, expect } from '@playwright/test'

// Credentials from the API seed data.
const ADMIN_EMAIL = 'admin@barbershop.com'
const ADMIN_PASSWORD = 'Admin@123'

// ── Shared helper ─────────────────────────────────────────────────────────────

// Fills the login form and clicks submit. Does not wait for navigation.
async function fillLoginForm(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
): Promise<void> {
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
}

// ── Auth tests ────────────────────────────────────────────────────────────────

test.describe('auth — login flow', () => {
  test('login with valid admin credentials redirects to /admin with sidebar visible', async ({
    page,
  }) => {
    await page.goto('/login')
    await fillLoginForm(page, ADMIN_EMAIL, ADMIN_PASSWORD)

    // After a successful login the watchEffect in login.vue redirects to /admin.
    await expect(page).toHaveURL('/admin')

    // The admin layout renders the sidebar as an <aside> element.
    await expect(page.locator('aside')).toBeVisible()
  })

  test('login with invalid credentials stays on /login and shows an error toast', async ({
    page,
  }) => {
    await page.goto('/login')
    await fillLoginForm(page, 'wrong@example.com', 'wrongpassword')

    // A failed login must not leave the login page.
    await expect(page).toHaveURL('/login')

    // An error toast must appear with a non-empty message.
    const toast = page.locator('.toast').first()
    await expect(toast).toBeVisible()
    await expect(toast.locator('span.flex-1')).not.toBeEmpty()
  })

  test('logout clears the cookie and redirects to /login', async ({ page }) => {
    // First log in so there is a session to log out from.
    await page.goto('/login')
    await fillLoginForm(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await expect(page).toHaveURL('/admin')

    // Click "Sign out" in the sidebar footer.
    await page.click('button[aria-label="Sign out"]')
    await expect(page).toHaveURL('/login')

    // The bs_token cookie must be absent after logout.
    const cookies = await page.context().cookies()
    const token = cookies.find((c) => c.name === 'bs_token')
    expect(token).toBeUndefined()
  })

  test('accessing a protected route without login redirects to /login with redirect param', async ({
    page,
  }) => {
    await page.goto('/admin')

    // The auth middleware encodes the intended path as the redirect query param.
    await expect(page).toHaveURL('/login?redirect=%2Fadmin')
  })

  test('post-login redirect sends user to the originally requested route', async ({ page }) => {
    // Navigate to a protected sub-route without being logged in.
    await page.goto('/admin/appointments')
    await expect(page).toHaveURL('/login?redirect=%2Fadmin%2Fappointments')

    // Log in — login.vue reads route.query.redirect and navigates there.
    await fillLoginForm(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await expect(page).toHaveURL('/admin/appointments')
  })

  test('password field visibility toggles between password and text type', async ({ page }) => {
    await page.goto('/login')

    const passwordInput = page.locator('#password')

    // Default state: input should mask the value.
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click the eye icon to reveal the password.
    await page.click('button[aria-label="Show password"]')
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // Click again to re-mask.
    await page.click('button[aria-label="Hide password"]')
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

// ── Role-based access ─────────────────────────────────────────────────────────

test.describe('auth — role-based redirect', () => {
  test('user with non-Admin role is redirected to / when accessing /admin', async ({ page }) => {
    // This test requires a seeded user with the User role.
    // Seed user: user@barbershop.com / User@123 (role: User).
    // Skip when the user account is not available in the current environment.
    test.skip(
      !process.env.USER_EMAIL || !process.env.USER_PASSWORD,
      'Set USER_EMAIL and USER_PASSWORD env vars for a seeded User-role account',
    )

    await page.goto('/login')
    await fillLoginForm(page, process.env.USER_EMAIL!, process.env.USER_PASSWORD!)
    await expect(page).toHaveURL('/')

    // Attempting to access /admin after a User login must redirect to /.
    await page.goto('/admin')
    await expect(page).toHaveURL('/')
  })
})

// ── Lockout test — potentially destructive ────────────────────────────────────

test.describe('auth — account lockout', () => {
  test('5 failed login attempts trigger an account-locked message', async ({ page }) => {
    await page.goto('/login')

    // Make 5 consecutive failed login attempts to trigger the lockout threshold.
    for (let i = 0; i < 5; i++) {
      await page.fill('#email', ADMIN_EMAIL)
      await page.fill('#password', 'WrongPassword!99')
      await page.click('button[type="submit"]')

      // Wait for the error toast to appear before the next attempt.
      await expect(page.locator('.toast').first()).toBeVisible()
    }

    // The next attempt (6th) should return the lockout message.
    await page.fill('#email', ADMIN_EMAIL)
    await page.fill('#password', 'WrongPassword!99')
    await page.click('button[type="submit"]')

    // The toast message must mention that the account is locked.
    await expect(page.locator('.toast').first()).toContainText(/locked/i)
  })
})
