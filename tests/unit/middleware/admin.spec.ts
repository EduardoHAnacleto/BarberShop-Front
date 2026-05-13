// Unit tests for middleware/admin.ts.
// Covers: unauthenticated → /login, authenticated non-admin → /, admin → no redirect.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { computed } from 'vue'

// ── Nuxt composable mocks ─────────────────────────────────────────────────────

// Controlled auth state exposed to each test.
let mockIsLoggedIn = false
let mockIsAdmin = false

mockNuxtImport('useAuth', () => {
  return () => ({
    isLoggedIn: computed(() => mockIsLoggedIn),
    isAdmin: computed(() => mockIsAdmin),
  })
})

// vi.hoisted ensures the variable is initialized before mockNuxtImport's hoisted factory runs.
const mockNavigateTo = vi.hoisted(() => vi.fn())
mockNuxtImport('navigateTo', () => mockNavigateTo)

// defineNuxtRouteMiddleware just returns its callback unchanged in test context.
mockNuxtImport('defineNuxtRouteMiddleware', () => {
  return (fn: () => unknown) => fn
})

// ── Import middleware after mocks ─────────────────────────────────────────────

const { default: adminMiddleware } = await import('~/middleware/admin')

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockIsLoggedIn = false
  mockIsAdmin = false
  mockNavigateTo.mockReset()
})

describe('middleware/admin', () => {
  it('redirects to /login when the user is not authenticated', () => {
    mockIsLoggedIn = false
    mockIsAdmin = false

    ;(adminMiddleware as () => unknown)()

    expect(mockNavigateTo).toHaveBeenCalledWith('/login')
  })

  it('redirects to / when the user is logged in but does not have the Admin role', () => {
    mockIsLoggedIn = true
    mockIsAdmin = false

    ;(adminMiddleware as () => unknown)()

    expect(mockNavigateTo).toHaveBeenCalledWith('/')
  })

  it('does not redirect when the user is logged in and has the Admin role', () => {
    mockIsLoggedIn = true
    mockIsAdmin = true

    ;(adminMiddleware as () => unknown)()

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})
