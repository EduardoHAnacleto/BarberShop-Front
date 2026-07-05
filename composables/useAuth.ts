// Authentication composable. Manages the JWT stored in the bs_token cookie,
// hydrates global auth state on client load, and exposes login/logout actions.
// See sprint plan S1.4 for the full spec.
import { jwtDecode } from 'jwt-decode'
import type { AuthResponse } from '~/types'

// .NET's default JwtSecurityTokenHandler emits role under the long Microsoft
// claim URI rather than the short "role" key. We accept either so the same
// composable works against any IdP that follows the JWT short-name convention.
const ROLE_CLAIM_URI = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

// Shape of the decoded JWT payload issued by the BarberShop API.
interface JwtPayload {
  sub: string
  email: string
  role?: string
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string
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

  // Default cookie lifetime — 24 h. Seconds in 30 days — lifetime of the
  // "Remember me" cookie, matching the long-lived JWT the API issues when
  // rememberMe=true.
  const DEFAULT_MAX_AGE = 86_400
  const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30

  // Single source of truth for the bs_token cookie binding. `secure` is
  // enabled in production only; dev runs over plain HTTP on localhost and
  // browsers refuse to set Secure cookies on non-HTTPS origins. maxAge is
  // parametrized so remember-me sessions can request a 30-day lifetime
  // without creating a second, out-of-sync ref bound to the same cookie name.
  function tokenCookie(maxAge: number = DEFAULT_MAX_AGE) {
    return useCookie<string | null>('bs_token', {
      maxAge,
      secure: !import.meta.dev,
      sameSite: 'lax',
    })
  }

  const { api } = useApi()
  const toast = useToast()

  // ── Internal helpers ────────────────────────────────────────────────────

  // Decodes the JWT, validates expiry, and populates auth state + cookie.
  // Calls logout if the token is already expired to avoid stale state.
  // When rememberMe=true, rewrites the cookie with a 30-day lifetime so the
  // session survives browser restarts.
  function _hydrate(token: string, rememberMe: boolean = false): void {
    const decoded = jwtDecode<JwtPayload>(token)

    if (decoded.exp * 1000 < Date.now()) {
      // Token has expired — clean up rather than set stale state.
      logout()
      return
    }

    state.value = {
      token,
      email: decoded.email,
      role: decoded.role ?? decoded[ROLE_CLAIM_URI] ?? null,
      userId: decoded.sub,
    }

    tokenCookie(rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE).value = token
  }

  // Re-hydrate from an existing cookie when the client first loads and the
  // global state is still empty (e.g. after a page refresh).
  const existingToken = tokenCookie().value
  if (import.meta.client && existingToken && !state.value.token) {
    _hydrate(existingToken)
  }

  // ── Public actions ───────────────────────────────────────────────────────

  // Authenticates with email/password; returns true on success.
  // rememberMe asks the API for a long-lived JWT and persists the cookie 30 days.
  async function login(
    email: string,
    password: string,
    rememberMe: boolean = false,
  ): Promise<boolean> {
    try {
      const res: AuthResponse = await api.auth.login({ email, password, rememberMe })
      _hydrate(res.token, rememberMe)
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
  // success. rememberMe behaves identically to the email/password flow.
  async function loginWithGoogle(
    idToken: string,
    rememberMe: boolean = false,
  ): Promise<boolean> {
    try {
      const res: AuthResponse = await api.auth.google(idToken, rememberMe)
      _hydrate(res.token, rememberMe)
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
  // Also tells Google to skip auto-select on the next visit so the user can
  // pick a different account (without this, One Tap would immediately re-sign
  // them in with the same Google account they just logged out from).
  function logout(): void {
    state.value = { token: null, email: null, role: null, userId: null }
    tokenCookie().value = null
    if (import.meta.client) {
      window.google?.accounts.id.disableAutoSelect()
    }
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

  // Hydrates auth state from an externally obtained token (e.g. registration response).
  function setToken(token: string): void {
    _hydrate(token)
  }

  return { login, loginWithGoogle, logout, setToken, isLoggedIn, isAdmin, userEmail, userId }
}
