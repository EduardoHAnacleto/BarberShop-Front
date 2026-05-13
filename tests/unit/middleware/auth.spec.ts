// Unit tests for middleware/auth.ts.
// Verifies the redirect-to-login behaviour when the cookie is absent and the
// passthrough behaviour when the cookie is present.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { RouteLocationNormalized } from 'vue-router'

// ── Nuxt composable mocks ─────────────────────────────────────────────────────

let mockCookieValue: string | null = null

mockNuxtImport('useCookie', () => {
  return (_name: string) => ({
    get value() {
      return mockCookieValue
    },
  })
})

// vi.hoisted ensures the variable is initialized before mockNuxtImport's hoisted factory runs.
const mockNavigateTo = vi.hoisted(() => vi.fn())
mockNuxtImport('navigateTo', () => mockNavigateTo)

// defineNuxtRouteMiddleware just returns its callback unchanged in test context.
mockNuxtImport('defineNuxtRouteMiddleware', () => {
  return (fn: (to: RouteLocationNormalized) => unknown) => fn
})

// ── Import middleware after mocks ─────────────────────────────────────────────

const { default: authMiddleware } = await import('~/middleware/auth')

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockCookieValue = null
  mockNavigateTo.mockReset()
})

describe('middleware/auth', () => {
  it('redirects to /login with encoded path when cookie is absent', () => {
    mockCookieValue = null

    const to = { fullPath: '/admin/appointments' } as RouteLocationNormalized
    ;(authMiddleware as (to: RouteLocationNormalized) => unknown)(to)

    expect(mockNavigateTo).toHaveBeenCalledWith(
      '/login?redirect=%2Fadmin%2Fappointments',
    )
  })

  it('does not redirect when a valid cookie is present', () => {
    mockCookieValue = 'valid-token'

    const to = { fullPath: '/admin/appointments' } as RouteLocationNormalized
    ;(authMiddleware as (to: RouteLocationNormalized) => unknown)(to)

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})
