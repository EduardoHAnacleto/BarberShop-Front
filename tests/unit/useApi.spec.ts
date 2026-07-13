// Unit tests for useApi composable.
// Uses MSW (Node adapter) to intercept HTTP at the network level, which works
// regardless of which Axios instance the composable uses internally.
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// ── Mock Nuxt composables ─────────────────────────────────────────────────────

// Controlled cookie store — shared between the mock and assertions.
let mockCookieValue: string | null = null

mockNuxtImport('useCookie', () => {
  return (_name: string) => ({
    get value() {
      return mockCookieValue
    },
    set value(v: string | null) {
      mockCookieValue = v
    },
  })
})

// vi.hoisted ensures the variable is initialized before mockNuxtImport's hoisted factory runs.
const mockNavigateTo = vi.hoisted(() => vi.fn())
mockNuxtImport('navigateTo', () => mockNavigateTo)

mockNuxtImport('useRuntimeConfig', () => {
  return () => ({ public: { apiBase: 'http://localhost:8080' } })
})

// ── Import composable after mocks ─────────────────────────────────────────────

const { useApi } = await import('~/composables/useApi')
const { api } = useApi()

// ── MSW server ────────────────────────────────────────────────────────────────

// Captures the Authorization header from each request so interceptor tests
// can assert on it without per-test handler overrides.
let lastAuthHeader: string | null = null

const server = setupServer(
  // Default handler: schedule endpoint — stores the Authorization header value.
  http.get('http://localhost:8080/api/working-hours/schedule', ({ request }) => {
    lastAuthHeader = request.headers.get('Authorization')
    return HttpResponse.json([{ id: 1, dayOfWeek: 1 }])
  }),

  // Auth login — returns a valid AuthResponse.
  http.post('http://localhost:8080/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string }
    return HttpResponse.json({ token: 'jwt-token', email: body.email, userRole: 'Admin' })
  }),

  // Own-profile endpoint used by the client/worker portals.
  http.get('http://localhost:8080/users/me', ({ request }) => {
    lastAuthHeader = request.headers.get('Authorization')
    return HttpResponse.json({ id: 6, email: 'me@b.com', userRole: 0, customerId: 1, workerId: null })
  }),

  // Own loyalty progress.
  http.get('http://localhost:8080/api/customers/me/loyalty', () =>
    HttpResponse.json({ completedVisits: 3, visitsForReward: 10, visitsUntilReward: 7, rewardReady: false })),

  // Worker status transition endpoint.
  http.patch('http://localhost:8080/api/appointments/:id/status', async ({ request, params }) => {
    const body = await request.json() as { status: number }
    return HttpResponse.json({ id: Number(params.id), status: body.status })
  }),

  // Recurring booking series.
  http.post('http://localhost:8080/api/appointments/recurring', async ({ request }) => {
    const body = await request.json() as { scheduledFor: string; repeatWeeks: number }
    return HttpResponse.json({
      recurrenceId: 'a1b2c3d4-0000-0000-0000-000000000000',
      created: [{ id: 1, scheduledFor: body.scheduledFor }, { id: 2, scheduledFor: body.scheduledFor }],
      skippedDates: [],
    })
  }),

  // Self-service password change.
  http.post('http://localhost:8080/api/auth/change-password', async ({ request }) => {
    const body = await request.json() as { currentPassword: string; newPassword: string }
    if (body.currentPassword === 'wrong') {
      return HttpResponse.json('Current password is incorrect', { status: 400 })
    }
    return HttpResponse.json('Password changed')
  }),

  // Forgot / reset password.
  http.post('http://localhost:8080/api/auth/forgot-password', () =>
    HttpResponse.json('If that email is registered, a reset link has been sent.')),
  http.post('http://localhost:8080/api/auth/reset-password', async ({ request }) => {
    const body = await request.json() as { token: string; newPassword: string }
    if (body.token !== 'valid-token') {
      return HttpResponse.json('Invalid or expired reset link', { status: 400 })
    }
    return HttpResponse.json('Password reset successfully. Please sign in.')
  }),

  // Reviews.
  http.post('http://localhost:8080/api/reviews', async ({ request }) => {
    const body = await request.json() as { appointmentId: number; rating: number }
    return HttpResponse.json({
      id: 1,
      appointmentId: body.appointmentId,
      customerId: 1,
      customerName: 'Emily Johnson',
      workerId: 2,
      workerName: 'James Carter',
      serviceName: 'Haircut',
      rating: body.rating,
      comment: '',
      createdAt: '2026-07-01T10:00:00Z',
    })
  }),
  http.get('http://localhost:8080/api/reviews/worker/:workerId', ({ params }) =>
    HttpResponse.json([{ id: 1, workerId: Number(params.workerId), rating: 5 }])),
  http.get('http://localhost:8080/api/reviews/summary', () =>
    HttpResponse.json([{ workerId: 2, averageRating: 4.5, reviewCount: 3 }])),
  http.get('http://localhost:8080/api/reviews/mine', () => HttpResponse.json([])),
  http.get('http://localhost:8080/api/reviews/all', () =>
    HttpResponse.json([{ id: 1, workerId: 2, rating: 5 }])),
  http.delete('http://localhost:8080/api/reviews/:id', () => new HttpResponse(null, { status: 204 })),

  // Admin analytics.
  http.get('http://localhost:8080/api/reports/summary', () =>
    HttpResponse.json({
      totalRevenue: 500,
      revenueLast30Days: 200,
      completedCount: 20,
      cancelledCount: 2,
      cancellationRate: 0.1,
      topServicesByRevenue: [{ serviceId: 1, serviceName: 'Haircut', revenue: 200, completedCount: 8 }],
      topWorkersByRevenue: [{ workerId: 2, workerName: 'James Carter', revenue: 150, completedCount: 6 }],
    })),

  // Waitlist.
  http.post('http://localhost:8080/api/waitlist', async ({ request }) => {
    const body = await request.json() as { workerId: number; serviceId: number; preferredDate: string }
    return HttpResponse.json({
      id: 1,
      customerId: 1,
      customerName: 'Emily Johnson',
      workerId: body.workerId,
      workerName: 'James Carter',
      serviceId: body.serviceId,
      serviceName: 'Haircut',
      preferredDate: body.preferredDate,
      createdAt: '2026-07-01T10:00:00Z',
      notified: false,
    })
  }),
  http.get('http://localhost:8080/api/waitlist/mine', () =>
    HttpResponse.json([{ id: 1, workerId: 2, serviceId: 3, preferredDate: '2026-08-01', notified: false }])),
  http.get('http://localhost:8080/api/waitlist/all', () =>
    HttpResponse.json([
      { id: 1, workerId: 2, serviceId: 3, preferredDate: '2026-08-01', notified: false },
      { id: 2, workerId: 2, serviceId: 3, preferredDate: '2026-08-02', notified: true },
    ])),
  http.delete('http://localhost:8080/api/waitlist/:id', () => new HttpResponse(null, { status: 204 })),

  // Worker schedule overrides.
  http.get('http://localhost:8080/api/workers/:workerId/schedule', ({ params }) =>
    HttpResponse.json([
      { id: 1, workerId: Number(params.workerId), dayOfWeek: 1, isOpen: true, openTime: '09:00:00', closeTime: '12:00:00' },
    ])),
  http.put('http://localhost:8080/api/workers/:workerId/schedule/:day', async ({ request, params }) => {
    const body = await request.json() as { isOpen: boolean; openTime?: string; closeTime?: string }
    return HttpResponse.json({
      id: 1,
      workerId: Number(params.workerId),
      dayOfWeek: Number(params.day),
      isOpen: body.isOpen,
      openTime: body.openTime,
      closeTime: body.closeTime,
    })
  }),
  http.delete('http://localhost:8080/api/workers/:workerId/schedule/:day', () => new HttpResponse(null, { status: 204 })),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  lastAuthHeader = null
  mockCookieValue = null
  mockNavigateTo.mockReset()
})
afterAll(() => server.close())

// ── Request interceptor ───────────────────────────────────────────────────────

describe('request interceptor', () => {
  it('adds Authorization header when bs_token cookie is present', async () => {
    mockCookieValue = 'abc'
    await api.schedule.getSchedule()
    expect(lastAuthHeader).toBe('Bearer abc')
  })

  it('does not add Authorization header when cookie is absent', async () => {
    mockCookieValue = null
    await api.schedule.getSchedule()
    expect(lastAuthHeader).toBeNull()
  })
})

// ── Response interceptor ──────────────────────────────────────────────────────

describe('response interceptor', () => {
  it('clears the cookie and calls navigateTo("/login") on 401', async () => {
    mockCookieValue = 'old-token'
    // Override the schedule handler to return 401 for this test.
    server.use(
      http.get('http://localhost:8080/api/working-hours/schedule', () =>
        HttpResponse.json(null, { status: 401 }),
      ),
    )

    await api.schedule.getSchedule().catch(() => null)

    expect(mockCookieValue).toBeNull()
    expect(mockNavigateTo).toHaveBeenCalledWith('/login')
  })

  it('rejects with the original error on 500 without redirecting', async () => {
    server.use(
      http.get('http://localhost:8080/api/working-hours/schedule', () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
    )

    await expect(api.schedule.getSchedule()).rejects.toMatchObject({
      response: { status: 500 },
    })
    // 500 must not trigger a redirect to login.
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})

// ── Generic typed helpers ─────────────────────────────────────────────────────

describe('generic helpers', () => {
  it('get<T>() returns the response body typed as T', async () => {
    const result = await api.schedule.getSchedule()
    expect(result).toEqual([{ id: 1, dayOfWeek: 1 }])
  })

  it('post<T>() sends the body and returns the response data typed as T', async () => {
    const result = await api.auth.login({ email: 'a@b.com', password: 'pw' })
    expect(result.token).toBe('jwt-token')
    expect(result.email).toBe('a@b.com')
  })
})

// ── users.me() — own-profile resolution for the /my and /worker portals ───────

describe('users.me()', () => {
  it('GETs /users/me with the bearer token and returns the own user record', async () => {
    mockCookieValue = 'jwt'
    const me = await api.users.me()

    expect(lastAuthHeader).toBe('Bearer jwt')
    expect(me.id).toBe(6)
    expect(me.customerId).toBe(1)
  })
})

describe('customers.myLoyalty()', () => {
  it('GETs the own loyalty progress', async () => {
    const status = await api.customers.myLoyalty()
    expect(status.completedVisits).toBe(3)
    expect(status.visitsUntilReward).toBe(7)
    expect(status.rewardReady).toBe(false)
  })
})

describe('appointments.changeStatus()', () => {
  it('PATCHes the status endpoint and returns the updated appointment', async () => {
    // 2 = Completed in AppointmentStatus.
    const updated = await api.appointments.changeStatus(42, 2)

    expect(updated.id).toBe(42)
    expect(updated.status).toBe(2)
  })
})

describe('appointments.createRecurring()', () => {
  it('POSTs the series request and returns created + skipped occurrences', async () => {
    const result = await api.appointments.createRecurring({
      customerId: 1,
      workerId: 2,
      serviceId: 3,
      scheduledFor: '2026-08-01T14:00:00',
      repeatWeeks: 4,
    })

    expect(result.recurrenceId).toBe('a1b2c3d4-0000-0000-0000-000000000000')
    expect(result.created).toHaveLength(2)
    expect(result.skippedDates).toEqual([])
  })
})

describe('auth.changePassword()', () => {
  it('POSTs current and new passwords and resolves on success', async () => {
    const res = await api.auth.changePassword('OldPass@123', 'NewPass@456')
    expect(res).toBe('Password changed')
  })

  it('rejects with the API error when the current password is wrong', async () => {
    await expect(api.auth.changePassword('wrong', 'NewPass@456')).rejects.toMatchObject({
      response: { status: 400 },
    })
  })
})

describe('auth.forgotPassword() / auth.resetPassword()', () => {
  it('forgotPassword() POSTs the email and resolves with the generic message', async () => {
    const res = await api.auth.forgotPassword('someone@example.com')
    expect(res).toBe('If that email is registered, a reset link has been sent.')
  })

  it('resetPassword() POSTs the token and new password and resolves on success', async () => {
    const res = await api.auth.resetPassword('valid-token', 'BrandNewPass@1')
    expect(res).toBe('Password reset successfully. Please sign in.')
  })

  it('resetPassword() rejects with the API error for an invalid token', async () => {
    await expect(api.auth.resetPassword('bad-token', 'BrandNewPass@1')).rejects.toMatchObject({
      response: { status: 400 },
    })
  })
})

describe('api.reviews', () => {
  it('create() POSTs the review and returns the created record', async () => {
    const review = await api.reviews.create({ appointmentId: 42, rating: 5, comment: 'Great!' })
    expect(review.appointmentId).toBe(42)
    expect(review.rating).toBe(5)
  })

  it('byWorker() GETs the reviews for a specific worker', async () => {
    const reviews = await api.reviews.byWorker(2)
    expect(reviews).toHaveLength(1)
    expect(reviews[0]?.workerId).toBe(2)
  })

  it('summary() GETs the bulk per-worker rating summary', async () => {
    const summary = await api.reviews.summary()
    expect(summary).toEqual([{ workerId: 2, averageRating: 4.5, reviewCount: 3 }])
  })

  it('mine() GETs the caller\'s own reviews', async () => {
    const mine = await api.reviews.mine()
    expect(mine).toEqual([])
  })

  it('all() GETs every review for admin moderation', async () => {
    const all = await api.reviews.all()
    expect(all).toHaveLength(1)
  })

  it('delete() removes a review by id', async () => {
    // A 204 No Content body comes back as '' through axios, not null.
    await expect(api.reviews.delete(1)).resolves.toBe('')
  })
})

describe('api.reports', () => {
  it('summary() GETs the revenue and top-performer rollup', async () => {
    const summary = await api.reports.summary()
    expect(summary.revenueLast30Days).toBe(200)
    expect(summary.topServicesByRevenue[0]?.serviceName).toBe('Haircut')
    expect(summary.topWorkersByRevenue[0]?.workerName).toBe('James Carter')
  })
})

describe('api.waitlist', () => {
  it('join() POSTs the request and returns the created entry', async () => {
    const entry = await api.waitlist.join({ workerId: 2, serviceId: 3, preferredDate: '2026-08-01' })
    expect(entry.workerId).toBe(2)
    expect(entry.serviceId).toBe(3)
    expect(entry.preferredDate).toBe('2026-08-01')
    expect(entry.notified).toBe(false)
  })

  it('mine() GETs the caller\'s own waitlist entries', async () => {
    const mine = await api.waitlist.mine()
    expect(mine).toHaveLength(1)
    expect(mine[0]?.workerId).toBe(2)
  })

  it('all() GETs every waitlist entry for admin moderation', async () => {
    const all = await api.waitlist.all()
    expect(all).toHaveLength(2)
    expect(all[1]?.notified).toBe(true)
  })

  it('remove() deletes a waitlist entry by id', async () => {
    // A 204 No Content body comes back as '' through axios, not null.
    await expect(api.waitlist.remove(1)).resolves.toBe('')
  })
})

describe('api.workerSchedule', () => {
  it('getByWorker() GETs the override rows for a worker', async () => {
    const overrides = await api.workerSchedule.getByWorker(2)
    expect(overrides).toHaveLength(1)
    expect(overrides[0]?.dayOfWeek).toBe(1)
  })

  it('upsert() PUTs the override and returns the saved row', async () => {
    const saved = await api.workerSchedule.upsert(2, 1, {
      isOpen: true, openTime: '10:00:00', closeTime: '14:00:00',
    })
    expect(saved.workerId).toBe(2)
    expect(saved.dayOfWeek).toBe(1)
    expect(saved.openTime).toBe('10:00:00')
  })

  it('removeOverride() deletes the override for a worker+day', async () => {
    // A 204 No Content body comes back as '' through axios, not null.
    await expect(api.workerSchedule.removeOverride(2, 1)).resolves.toBe('')
  })
})
