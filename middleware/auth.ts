// Named route middleware that guards any route requiring a valid session.
// When the bs_token cookie is absent the visitor is redirected to /login with
// the original path as a `redirect` query param so the login page can send
// them back after a successful sign-in.
// Applied via definePageMeta({ middleware: 'auth' }).
export default defineNuxtRouteMiddleware((to) => {
  // Read the cookie directly; useAuth().isLoggedIn is not available here
  // because middleware runs before the component tree is mounted.
  const token = useCookie('bs_token').value

  if (!token) {
    // Encode the full path so query strings in `to` survive the redirect.
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
