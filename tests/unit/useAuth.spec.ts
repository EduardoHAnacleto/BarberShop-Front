// Unit tests for useAuth composable.
// Covers login/google login, _hydrate expiry check, isAdmin/isLoggedIn
// computeds, and logout behaviour.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// ── Nuxt composable mocks ─────────────────────────────────────────────────────

// Shared cookie store (keyed by name) used by the mock useCookie.
const cookieStore: Record<string, string | null> = {}

mockNuxtImport('useCookie', () => {
  return (name: string) => ({
    get value() {
      return cookieStore[name] ?? null
    },
    set value(v: string | null) {
      cookieStore[name] = v
    },
  })
})

// vi.hoisted ensures the variable is initialized before mockNuxtImport's hoisted factory runs.
const mockNavigateTo = vi.hoisted(() => vi.fn())
mockNuxtImport('navigateTo', () => mockNavigateTo)

// Mock useState to return a Vue ref so computed() can track changes reactively.
// Each call with the same key returns the same shared ref.
const stateStore: Record<string, ReturnType<typeof ref>> = {}
mockNuxtImport('useState', () => {
  return (key: string, init?: () => unknown) => {
    if (!stateStore[key]) stateStore[key] = ref(init?.() ?? null)
    return stateStore[key]
  }
})

// Mock api methods used by useAuth.
const mockApiLogin = vi.fn()
const mockApiGoogle = vi.fn()
mockNuxtImport('useApi', () => {
  return () => ({
    api: {
      auth: {
        login: mockApiLogin,
        google: mockApiGoogle,
      },
    },
  })
})

// Mock useToast to capture messages without side effects.
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
mockNuxtImport('useToast', () => {
  return () => ({
    success: mockToastSuccess,
    error: mockToastError,
  })
})

// ── Import composable after mocks ─────────────────────────────────────────────

const { useAuth } = await import('~/composables/useAuth')

// ── Helpers ───────────────────────────────────────────────────────────────────

// Builds a minimal JWT string for testing. Does NOT produce a valid signature —
// only used for decoding in tests where jwtDecode is called with the real library.
function makeToken(payload: { sub?: string; email?: string; role?: string; exp?: number }): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify({ sub: '1', email: 'test@test.com', role: 'Admin', exp: Math.floor(Date.now() / 1000) + 3600, ...payload }))
  return `${header}.${body}.signature`
}

function makeExpiredToken(): string {
  return makeToken({ exp: Math.floor(Date.now() / 1000) - 60 }) // expired 60 s ago
}

// ── Test setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Clear all stores and mocks between tests.
  // Reflect.deleteProperty is used instead of the delete operator to satisfy
  // the no-dynamic-delete lint rule while still removing all keys.
  Object.keys(cookieStore).forEach((k) => Reflect.deleteProperty(cookieStore, k))
  Object.keys(stateStore).forEach((k) => Reflect.deleteProperty(stateStore, k))
  mockNavigateTo.mockReset()
  mockApiLogin.mockReset()
  mockApiGoogle.mockReset()
  mockToastSuccess.mockReset()
  mockToastError.mockReset()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAuth — login()', () => {
  it('returns true, calls _hydrate and toast.success on 200', async () => {
    const token = makeToken({ role: 'Admin', email: 'admin@b.com' })
    mockApiLogin.mockResolvedValueOnce({ token, email: 'admin@b.com', userRole: 'Admin' })

    const { login } = useAuth()
    const result = await login('admin@b.com', 'pass')

    expect(result).toBe(true)
    expect(cookieStore['bs_token']).toBe(token)
    expect(mockToastSuccess).toHaveBeenCalled()
  })

  it('returns false, calls toast.error and does not set cookie on 400', async () => {
    mockApiLogin.mockRejectedValueOnce({
      response: { data: 'Invalid credentials' },
    })

    const { login } = useAuth()
    const result = await login('x@x.com', 'wrong')

    expect(result).toBe(false)
    expect(cookieStore['bs_token']).toBeFalsy()
    expect(mockToastError).toHaveBeenCalledWith('Invalid credentials')
  })

  it('toast.error shows the exact API lockout message', async () => {
    mockApiLogin.mockRejectedValueOnce({
      response: { data: 'Account is locked. Please try again later.' },
    })

    const { login } = useAuth()
    await login('locked@b.com', 'pw')

    expect(mockToastError).toHaveBeenCalledWith(
      'Account is locked. Please try again later.',
    )
  })
})

describe('useAuth — _hydrate() (via login)', () => {
  it('calls logout() when the token is already expired', async () => {
    const expiredToken = makeExpiredToken()
    mockApiLogin.mockResolvedValueOnce({
      token: expiredToken,
      email: 'e@e.com',
      userRole: 'Admin',
    })

    const { login } = useAuth()
    await login('e@e.com', 'pw')

    // logout() clears the cookie and navigates to /login.
    expect(cookieStore['bs_token']).toBeFalsy()
    expect(mockNavigateTo).toHaveBeenCalledWith('/login')
  })

  it('sets state.email and state.role when token is valid', async () => {
    const token = makeToken({ role: 'Admin', email: 'admin@b.com' })
    mockApiLogin.mockResolvedValueOnce({ token, email: 'admin@b.com', userRole: 'Admin' })

    const { login, userEmail } = useAuth()
    await login('admin@b.com', 'pw')

    expect(userEmail.value).toBe('admin@b.com')
  })
})

describe('useAuth — computed flags', () => {
  it('isAdmin returns true when role is "Admin"', async () => {
    const token = makeToken({ role: 'Admin' })
    mockApiLogin.mockResolvedValueOnce({ token, email: 'a@b.com', userRole: 'Admin' })

    const { login, isAdmin } = useAuth()
    await login('a@b.com', 'pw')

    expect(isAdmin.value).toBe(true)
  })

  it('isAdmin returns false when role is "User"', async () => {
    const token = makeToken({ role: 'User' })
    mockApiLogin.mockResolvedValueOnce({ token, email: 'u@b.com', userRole: 'User' })

    const { login, isAdmin } = useAuth()
    await login('u@b.com', 'pw')

    expect(isAdmin.value).toBe(false)
  })

  it('isAdmin returns true when role is under the .NET Microsoft claim URI', async () => {
    // .NET JwtSecurityTokenHandler emits role under the long claim URI by
    // default. The composable must accept that variant too.
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const body = btoa(JSON.stringify({
      sub: '1',
      email: 'admin@b.com',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }))
    const token = `${header}.${body}.signature`
    mockApiLogin.mockResolvedValueOnce({ token, email: 'admin@b.com', userRole: 'Admin' })

    const { login, isAdmin } = useAuth()
    await login('admin@b.com', 'pw')

    expect(isAdmin.value).toBe(true)
  })

  it('isLoggedIn returns true when token is present', async () => {
    const token = makeToken({})
    mockApiLogin.mockResolvedValueOnce({ token, email: 'a@b.com', userRole: 'Admin' })

    const { login, isLoggedIn } = useAuth()
    await login('a@b.com', 'pw')

    expect(isLoggedIn.value).toBe(true)
  })

  it('isLoggedIn returns false initially (no token)', () => {
    const { isLoggedIn } = useAuth()
    expect(isLoggedIn.value).toBe(false)
  })
})

describe('useAuth — logout()', () => {
  it('clears state.token, clears cookie, and calls navigateTo("/login")', async () => {
    // First log in to set up state.
    const token = makeToken({})
    mockApiLogin.mockResolvedValueOnce({ token, email: 'a@b.com', userRole: 'Admin' })

    const { login, logout, isLoggedIn } = useAuth()
    await login('a@b.com', 'pw')
    expect(isLoggedIn.value).toBe(true)

    logout()

    expect(isLoggedIn.value).toBe(false)
    expect(cookieStore['bs_token']).toBeNull()
    expect(mockNavigateTo).toHaveBeenCalledWith('/login')
  })
})

describe('useAuth — loginWithGoogle()', () => {
  it('returns true and calls _hydrate on successful Google auth', async () => {
    const token = makeToken({ role: 'Admin', email: 'g@google.com' })
    mockApiGoogle.mockResolvedValueOnce({ token, email: 'g@google.com', userRole: 'Admin' })

    const { loginWithGoogle, isLoggedIn } = useAuth()
    const result = await loginWithGoogle('google-id-token')

    expect(result).toBe(true)
    expect(isLoggedIn.value).toBe(true)
    expect(cookieStore['bs_token']).toBe(token)
  })
})
