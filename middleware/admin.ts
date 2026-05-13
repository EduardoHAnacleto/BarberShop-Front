// Named route middleware that allows access only to authenticated admin users.
// Unauthenticated visitors go to /login; authenticated non-admins go to /.
// Applied via definePageMeta({ middleware: 'admin' }) on all /admin/* pages.
export default defineNuxtRouteMiddleware(() => {
  const { isLoggedIn, isAdmin } = useAuth()

  // Redirect unauthenticated users to the login page first.
  if (!isLoggedIn.value) return navigateTo('/login')

  // Authenticated users without the Admin role are sent to the public root.
  if (!isAdmin.value) return navigateTo('/')
})
