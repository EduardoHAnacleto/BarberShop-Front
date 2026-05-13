// Authentication composable. Manages the JWT stored in the bs_token cookie,
// hydrates global auth state on client load, and exposes login/logout actions.
// See sprint plan S1.4 for the full spec.
import { jwtDecode } from 'jwt-decode'
import type { AuthResponse } from '~/types'

// Shape of the decoded JWT payload issued by the BarberShop API.
interface JwtPayload {
  sub: string
  email: string
  role: string
  exp: number
}

// Reactive auth state shared across all composable calls via useState.
interface AuthState {
  token: string | null
  email: string | null
  role: string | null
  userId: string | null
}

export function useAuth() {
  // Global state — one instance per Nuxt app, shared across all components.
  const state = useState<AuthState>('auth', () => ({
    token: null,
    email: null,
    role: null,
    userId: null,
  }))

  // Cookie persists across page reloads and tab opens (24 h, secure, lax).
  const tokenCookie = useCookie<string | null>('bs_token', {
    maxAge: 86_400,
    secure: true,
    sameSite: 'lax',
  })

  const { api } = useApi()
  const toast = useToast()

  // ── Internal helpers ────────────────────────────────────────────────────

  // Decodes the JWT, validates expiry, and populates auth state + cookie.
  // Calls logout if the token is already expired to avoid stale state.
  function _hydrate(token: string): void {
    const decoded = jwtDecode<JwtPayload>(token)

    if (decoded.exp * 1000 < Date.now()) {
      // Token has expired — clean up rather than set stale state.
      logout()
      return
    }

    state.value = {
      token,
      email: decoded.email,
      role: decoded.role,
      userId: decoded.sub,
    }
    tokenCookie.value = token
  }

  // Re-hydrate from an existing cookie when the client first loads and the
  // global state is still empty (e.g. after a page refresh).
  if (import.meta.client && tokenCookie.value && !state.value.token) {
    _hydrate(tokenCookie.value)
  }

  // ── Public actions ───────────────────────────────────────────────────────

  // Authenticates with email/password; returns true on success.
  async function login(email: string, password: string): Promise<boolean> {
    try {
      const res: AuthResponse = await api.auth.login({ email, password })
      _hydrate(res.token)
      toast.success('Signed in successfully')
      return true
    } catch (error: unknown) {
      // Show the API's error message verbatim so lockout messages reach the user.
      const message =
        (error as { response?: { data?: string } }).response?.data ?? 'Login failed'
      toast.error(typeof message === 'string' ? message : 'Login failed')
      return false
    }
  }

  // Authenticates with a Google Identity Services credential; returns true on
  // success. Follows the same hydrate + toast pattern as login().
  async function loginWithGoogle(idToken: string): Promise<boolean> {
    try {
      const res: AuthResponse = await api.auth.google(idToken)
      _hydrate(res.token)
      toast.success('Signed in with Google')
      return true
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: string } }).response?.data ?? 'Google login failed'
      toast.error(typeof message === 'string' ? message : 'Google login failed')
      return false
    }
  }

  // Clears all auth state and redirects to the login page.
  function logout(): void {
    state.value = { token: null, email: null, role: null, userId: null }
    tokenCookie.value = null
    navigateTo('/login')
  }

  // ── Computed flags ───────────────────────────────────────────────────────

  // True whenever a valid (non-null) token is present.
  const isLoggedIn = computed(() => !!state.value.token)

  // True when the decoded JWT role is "Admin".
  const isAdmin = computed(() => state.value.role === 'Admin')

  // The email address from the decoded JWT, or null if not authenticated.
  const userEmail = computed(() => state.value.email)

  // The subject (user ID) from the decoded JWT, or null if not authenticated.
  const userId = computed(() => state.value.userId)

  return { login, loginWithGoogle, logout, isLoggedIn, isAdmin, userEmail, userId }
}
