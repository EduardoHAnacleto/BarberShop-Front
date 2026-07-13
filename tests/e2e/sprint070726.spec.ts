// E2E tests for the Sprint 07/07/26 features against the live demo stack.
//
// Precondition: the full Docker stack is up (nginx on :80 proxying the Nuxt
// frontend + .NET API) OR the Nuxt dev server + API are running, and the demo
// database has been seeded (see the seed data documented in the sprint). Set
// BASE_URL accordingly (defaults to http://localhost:3001 from the config).
//
// Seed accounts used here (English demo data):
//   Admin  : admin@barbershop.com          / Admin@123
//   Worker : james.carter@barbershop.com   / Worker@123   (many appointments)
//   Client : emily.johnson@example.com     / Client@123
import { test, expect } from '@playwright/test'

const ADMIN = { email: 'admin@barbershop.com', password: 'Admin@123' }
const WORKER = { email: 'james.carter@barbershop.com', password: 'Worker@123' }
const CLIENT = { email: 'emily.johnson@example.com', password: 'Client@123' }

// Direct backend base — used only for API setup/teardown (seeding a waitlist
// entry, filling a day's slots) that would be slow or unreliable to drive
// through the UI. Mirrors the pattern in smoke.spec.ts.
const API_URL = process.env.API_URL ?? 'http://localhost:8080'

// Logs in and waits for the client-side redirect away from the login page
// (which only happens once the JWT cookie is set), so a subsequent navigation
// always carries the session. The staff page shows a role selector first.
async function loginVia(
  page: import('@playwright/test').Page,
  path: '/login' | '/staff-login',
  creds: { email: string; password: string },
  staffRole?: 'Worker' | 'Admin',
): Promise<void> {
  await page.goto(path)
  // /staff-login gates the form behind a role card ("Who are you?").
  if (path === '/staff-login' && staffRole) {
    await page.getByRole('button', { name: new RegExp(staffRole) }).click()
  }
  // The two pages use different input ids (#email vs #staff-email); target the
  // fields by their accessible label instead so the helper works on both.
  await page.getByLabel('Email').fill(creds.email)
  await page.getByLabel('Password', { exact: true }).fill(creds.password)
  await page.click('button[type="submit"]')
  // Wait until we are no longer on the login page (auth committed).
  await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 15_000 })
}

// ── 1.1 — client/worker portals load (previously broke on /users/{id} 403) ──

test.describe('sprint §1.1 — self-service portals load', () => {
  test('client portal /my loads the profile without a 403 error', async ({ page }) => {
    await loginVia(page, '/login', CLIENT)

    await page.goto('/my')
    // The profile card resolves via /users/me; "Failed to load" must not show.
    await expect(page.getByRole('heading', { name: 'My Account' })).toBeVisible()
    await expect(page.getByText('Failed to load your profile')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
  })

  test('worker portal /worker loads the schedule', async ({ page }) => {
    await loginVia(page, '/staff-login', WORKER, 'Worker')
    await page.goto('/worker')
    await expect(page.getByRole('heading', { name: 'My Schedule' })).toBeVisible()
    await expect(page.getByText('Failed to load your schedule')).toHaveCount(0)
  })
})

// ── 4.1 — worker actions (start / complete / no-show) ───────────────────────

test.describe('sprint §4.1 — worker portal actions', () => {
  test('worker sees Start / No-show controls on upcoming appointments', async ({ page }) => {
    await loginVia(page, '/staff-login', WORKER, 'Worker')
    await page.goto('/worker')

    // James Carter is seeded with upcoming appointments, so at least one
    // "Start" button must be present under the Upcoming column.
    const startButtons = page.getByRole('button', { name: 'Start' })
    await expect(startButtons.first()).toBeVisible()
  })
})

// ── 4.2 — client reschedule modal ───────────────────────────────────────────

test.describe('sprint §4.2 — reschedule', () => {
  test('client can open the reschedule modal from an upcoming appointment', async ({ page }) => {
    await loginVia(page, '/login', CLIENT)

    await page.goto('/my')
    const reschedule = page.getByRole('button', { name: 'Reschedule' })
    // Emily may or may not have an upcoming scheduled appointment depending on
    // "now"; only assert the modal wiring when the control is present.
    if (await reschedule.count()) {
      await reschedule.first().click()
      await expect(page.getByRole('heading', { name: 'Reschedule appointment' })).toBeVisible()
      await expect(page.locator('#reschedule-date')).toBeVisible()
    }
  })
})

// ── 4.3 — change password form ──────────────────────────────────────────────

test.describe('sprint §4.3 — change password', () => {
  test('client profile exposes a change-password form', async ({ page }) => {
    await loginVia(page, '/login', CLIENT)

    await page.goto('/my')
    await page.getByRole('button', { name: 'Change password' }).click()
    await expect(page.locator('#pw-current')).toBeVisible()
    await expect(page.locator('#pw-next')).toBeVisible()
    await expect(page.locator('#pw-confirm')).toBeVisible()

    // Mismatched confirmation must be rejected client-side (error toast, no nav).
    await page.fill('#pw-current', 'Client@123')
    await page.fill('#pw-next', 'NewPass@456')
    await page.fill('#pw-confirm', 'Different@789')
    await page.getByRole('button', { name: 'Update password' }).click()
    await expect(page.locator('.toast').first()).toBeVisible()
    await expect(page).toHaveURL(/\/my/)
  })
})

// ── 5.9 — admin command palette ─────────────────────────────────────────────

test.describe('sprint §5.9 — command palette', () => {
  test('Ctrl+K opens the palette and navigates to a section', async ({ page }) => {
    await loginVia(page, '/login', ADMIN)
    await expect(page).toHaveURL('/admin')

    await page.keyboard.press('Control+k')
    const input = page.getByPlaceholder('Jump to…')
    await expect(input).toBeVisible()

    await input.fill('customers')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/admin/customers')
  })
})

// ── 5.10 — CSV export button ────────────────────────────────────────────────

test.describe('sprint §5.10 — CSV export', () => {
  test('admin customers page offers a CSV export that triggers a download', async ({ page }) => {
    await loginVia(page, '/login', ADMIN)

    await page.goto('/admin/customers')
    const exportBtn = page.getByRole('button', { name: 'Export CSV' })
    await expect(exportBtn).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await exportBtn.click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/customers-\d{4}-\d{2}-\d{2}\.csv/)
  })
})

// ── 5.2 — add-to-calendar actions on booking success ────────────────────────

test.describe('sprint §5.2 — add to calendar', () => {
  test('success page shows calendar actions when event details are present', async ({ page }) => {
    // Navigate directly with the query the booking flow would pass.
    const q = new URLSearchParams({
      appointmentId: '123',
      service: 'Haircut',
      worker: 'James Carter',
      scheduledFor: '2026-07-20T14:00:00',
      duration: '30',
    })
    await page.goto(`/book/success?${q.toString()}`)

    await expect(page.getByRole('heading', { name: 'Booking Confirmed!' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download .ics' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Add to Google Calendar' })).toBeVisible()
  })
})

// ── 5.4 — post-appointment reviews ──────────────────────────────────────────

test.describe('sprint §5.4 — reviews', () => {
  test('client can leave a review on a completed appointment', async ({ page }) => {
    await loginVia(page, '/login', CLIENT)
    await page.goto('/my')

    // Emily may or may not have an unreviewed completed appointment depending
    // on seed state; only assert the flow when the control is present.
    const reviewBtn = page.getByRole('button', { name: 'Leave a review' })
    if (await reviewBtn.count()) {
      await reviewBtn.first().click()
      await expect(page.getByRole('heading', { name: 'Leave a review' })).toBeVisible()
      await page.getByRole('button', { name: '5 stars' }).click()
      await page.getByRole('button', { name: 'Submit review' }).click()
      await expect(page.locator('.toast').first()).toBeVisible()
      // The button is replaced by the submitted rating once the list refreshes.
      await expect(reviewBtn.first()).toHaveCount(0)
    }
  })

  test('booking flow shows a rating badge on worker cards', async ({ page }) => {
    await page.goto('/book')
    await page.locator('button.card').first().click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Choose a professional' })).toBeVisible()
    // Every worker card renders either a star average or the "No reviews" fallback.
    await expect(page.getByText(/No reviews|\d\.\d \(\d+\)/).first()).toBeVisible()
  })

  test('admin can see submitted reviews in the moderation table', async ({ page }) => {
    await loginVia(page, '/login', ADMIN)
    await page.goto('/admin/reviews')

    await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible()
    await expect(page.getByPlaceholder('Search customer, worker, service…')).toBeVisible()
  })
})

// ── 5.7 — loyalty progress ───────────────────────────────────────────────────

test.describe('sprint §5.7 — loyalty', () => {
  test('client profile shows loyalty progress toward the next reward', async ({ page }) => {
    await loginVia(page, '/login', CLIENT)
    await page.goto('/my')

    await expect(page.getByText('Loyalty progress')).toBeVisible()
    await expect(page.getByText(/completed visits/)).toBeVisible()
  })
})

// ── 5.5 — admin analytics ────────────────────────────────────────────────────

test.describe('sprint §5.5 — analytics', () => {
  test('admin dashboard shows a revenue KPI card', async ({ page }) => {
    await loginVia(page, '/login', ADMIN)
    await expect(page).toHaveURL('/admin')

    await expect(page.getByText('Revenue (30d)')).toBeVisible()
  })
})

// ── 5.8 — recurring appointments ─────────────────────────────────────────────

test.describe('sprint §5.8 — recurring appointments', () => {
  test('booking flow offers a repeat-weekly option on the confirm step', async ({ page }) => {
    await page.goto('/book')
    await page.locator('button.card').first().click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { name: 'Choose a professional' })).toBeVisible()

    // Pick the first worker, then the first day (within two weeks) that has
    // at least one open slot — seeded schedules vary, so scan forward a bit
    // rather than assuming any single date is open.
    await page.locator('button.card').first().click()
    let sawSlots = false
    for (let daysAhead = 1; daysAhead <= 14 && !sawSlots; daysAhead++) {
      const date = new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10)
      await page.locator('#booking-date').fill(date)
      const slot = page.locator('button.font-mono').first()
      if (await slot.count()) {
        await slot.click()
        sawSlots = true
      }
    }

    if (sawSlots) {
      await page.getByRole('button', { name: 'Continue' }).click()
      await expect(page.getByText('Repeat this appointment weekly')).toBeVisible()

      // The week-count input only appears once the toggle is checked.
      await expect(page.locator('#repeat-weeks')).toHaveCount(0)
      await page.locator('#repeat-weekly').check()
      await expect(page.locator('#repeat-weeks')).toBeVisible()
    }
  })
})

// ── 4.3-forgot — forgot / reset password ─────────────────────────────────────

test.describe('sprint §4.3-forgot — forgot password', () => {
  test('login page links to forgot-password, which shows a generic confirmation', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Forgot password?' }).click()
    await expect(page).toHaveURL('/forgot-password')
    // Wait for the SPA transition to fully mount the page before interacting —
    // clicking the URL change alone can race the client-side navigation.
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible()

    await page.getByLabel('Email').fill(CLIENT.email)
    await page.getByRole('button', { name: 'Send reset link' }).click()

    // Same message whether or not the email is registered — no account enumeration.
    await expect(page.getByText('If that email is registered, a reset link is on its way.')).toBeVisible()
  })

  test('reset-password page rejects a missing token', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.getByText('This reset link is missing or invalid.')).toBeVisible()
  })

  test('reset-password page accepts a token and shows the password form', async ({ page }) => {
    await page.goto('/reset-password?token=some-token-from-the-email-link')
    // "New password" is also a substring of "Confirm new password" — exact
    // match is required to avoid Playwright's strict-mode ambiguity error.
    await expect(page.getByLabel('New password', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Confirm new password')).toBeVisible()
  })
})

// ── 5.6 — waitlist for fully-booked days ─────────────────────────────────────

test.describe('sprint §5.6 — waitlist', () => {
  test('client sees an API-seeded waitlist entry on /my and can leave it', async ({ page, request }) => {
    // Seeding via the API (rather than driving a real "fully booked" day
    // through the UI) keeps this deterministic — see the booking-flow test
    // below for the full UI-driven join.
    const loginRes = await request.post(`${API_URL}/api/auth/login`, { data: CLIENT })
    const { token } = await loginRes.json()
    const authHeader = { Authorization: `Bearer ${token}` }

    const joinRes = await request.post(`${API_URL}/api/waitlist`, {
      headers: authHeader,
      data: { workerId: 1, serviceId: 1, preferredDate: '2026-09-01' },
    })
    expect(joinRes.ok()).toBe(true)
    const entry = await joinRes.json()

    try {
      await loginVia(page, '/login', CLIENT)
      await page.goto('/my')

      await expect(page.getByRole('heading', { name: 'My Waitlist' })).toBeVisible()
      await expect(page.getByText('Haircut with James Carter')).toBeVisible()

      await page.getByRole('button', { name: 'Leave waitlist' }).click()
      await expect(page.locator('.toast').first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'My Waitlist' })).toHaveCount(0)
    } finally {
      // Safety net in case the UI leave-click above didn't run to completion.
      await request.delete(`${API_URL}/api/waitlist/${entry.id}`, { headers: authHeader }).catch(() => {})
    }
  })

  test('client can join the waitlist for a fully-booked day from the booking flow', async ({ page, request }) => {
    // 16 sequential setup requests plus a full UI flow can run past the
    // default 30s test timeout, which would kill the test mid-cleanup and
    // strand appointments on the target date — give this one more headroom.
    test.setTimeout(90_000)

    // A Monday, confirmed open with a full slate of slots in this seed data —
    // see the day-of-week scan in the sprint notes before changing this date.
    const WAITLIST_DATE = '2026-09-21'

    // Force the day fully booked by booking every slot the server reports as
    // open for James Carter + Haircut — uses the same availability endpoint
    // the booking page itself calls, so no business hours are hardcoded here.
    const loginRes = await request.post(`${API_URL}/api/auth/login`, { data: ADMIN })
    const { token } = await loginRes.json()
    const authHeader = { Authorization: `Bearer ${token}` }

    const availRes = await request.get(
      `${API_URL}/api/workers/1/availability?date=${WAITLIST_DATE}&serviceId=1`,
      { headers: authHeader },
    )
    const { slots } = await availRes.json() as { slots: string[] }
    expect(slots.length).toBeGreaterThan(0)

    // Parallelize the fill — sequential round trips for every slot risk
    // eating the whole test timeout before the UI portion even starts.
    const createdIds = await Promise.all(slots.map(async (slot) => {
      const res = await request.post(`${API_URL}/api/appointments`, {
        headers: authHeader,
        data: {
          workerId: 1,
          customerId: 1,
          serviceId: 1,
          scheduledFor: `${WAITLIST_DATE}T${slot}:00`,
          status: 0,
          extraDetails: 'e2e-waitlist-fill',
        },
      })
      const appt = await res.json()
      return appt.id as number
    }))

    try {
      await loginVia(page, '/login', CLIENT)
      await page.goto('/book')
      await page.locator('button.card').filter({ has: page.getByRole('heading', { name: 'Haircut', exact: true }) }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await expect(page.getByRole('heading', { name: 'Choose a professional' })).toBeVisible()

      await page.locator('button.card').filter({ hasText: 'James Carter' }).click()
      await page.locator('#booking-date').fill(WAITLIST_DATE)

      await expect(page.getByText('Fully booked on this day.')).toBeVisible()
      const notifyBtn = page.getByRole('button', { name: 'Notify me if a slot opens up' })
      await expect(notifyBtn).toBeVisible()
      await notifyBtn.click()

      // Matches both the inline confirmation and the toast — either proves
      // the join succeeded, so disambiguate with .first() rather than picking
      // one and risking a race if that particular element isn't the one
      // rendered first.
      await expect(page.getByText("You're on the waitlist").first()).toBeVisible()
    } finally {
      // Cleanup: cancel every appointment created to fill the day, and remove
      // whatever waitlist entry the UI step above created.
      if (createdIds.length > 0) {
        await request.post(`${API_URL}/api/appointments/cancel`, {
          headers: authHeader,
          data: { idList: createdIds },
        }).catch(() => {})
      }

      const allRes = await request.get(`${API_URL}/api/waitlist/all`, { headers: authHeader })
      const all = await allRes.json() as { id: number; workerId: number; preferredDate: string }[]
      const mine = all.filter((w) => w.workerId === 1 && w.preferredDate.startsWith(WAITLIST_DATE))
      for (const leftover of mine) {
        await request.delete(`${API_URL}/api/waitlist/${leftover.id}`, { headers: authHeader }).catch(() => {})
      }
    }
  })
})

// ── 5.3 — per-worker individual schedules ────────────────────────────────────

test.describe('sprint §5.3 — worker schedules', () => {
  test('admin can narrow a worker\'s hours for one day and revert to the shop default', async ({ page, request }) => {
    const loginRes = await request.post(`${API_URL}/api/auth/login`, { data: ADMIN })
    const { token } = await loginRes.json()
    const authHeader = { Authorization: `Bearer ${token}` }

    try {
      await loginVia(page, '/login', ADMIN)
      await page.goto('/admin/worker-schedules')
      await expect(page.getByRole('heading', { name: 'Worker schedules' })).toBeVisible()

      await page.selectOption('#worker-select', { label: 'James Carter' })

      const mondayRow = page.locator('tbody tr', { hasText: 'Monday' })
      await expect(mondayRow.getByText('Shop default')).toBeVisible()

      // Narrow Monday to a short morning shift.
      const timeInputs = mondayRow.locator('input[type="time"]')
      await timeInputs.nth(0).fill('09:00')
      await timeInputs.nth(1).fill('12:00')
      await mondayRow.getByRole('button', { name: 'Save' }).click()

      await expect(page.locator('.toast').first()).toBeVisible()
      await expect(mondayRow.getByText('Custom')).toBeVisible()

      // The availability endpoint must reflect the narrowed hours immediately.
      const availRes = await request.get(
        `${API_URL}/api/workers/1/availability?date=2026-09-21&serviceId=1`,
        { headers: authHeader },
      )
      const { slots } = await availRes.json() as { slots: string[] }
      expect(slots).toContain('09:00')
      expect(slots).not.toContain('17:30')

      // Revert — the row goes back to "Shop default" and the full grid returns.
      await mondayRow.getByRole('button', { name: 'Revert' }).click()
      await expect(page.locator('.toast').first()).toBeVisible()
      await expect(mondayRow.getByText('Shop default')).toBeVisible()
    } finally {
      // Safety net in case the UI revert step above didn't run to completion.
      await request.delete(`${API_URL}/api/workers/1/schedule/1`, { headers: authHeader }).catch(() => {})
    }
  })
})
