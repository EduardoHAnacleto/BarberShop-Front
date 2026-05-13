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
