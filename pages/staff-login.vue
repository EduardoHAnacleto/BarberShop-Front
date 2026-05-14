<script setup lang="ts">
// Staff entry point: user selects Worker or Admin role, then signs in.
// Workers are redirected to /worker; admins to /admin after a successful login.
definePageMeta({ layout: 'default' })

const { login, isLoggedIn, isAdmin } = useAuth()
const route = useRoute()

// Which role the staff member identified themselves as. null = not yet selected.
const selectedRole = ref<'worker' | 'admin' | null>(null)

// Login form state.
const form = reactive({ email: '', password: '' })
const loading = ref(false)
const showPassword = ref(false)

// Redirect already-authenticated users to the right portal immediately.
watchEffect(() => {
  if (!isLoggedIn.value) return
  const fallback = isAdmin.value ? '/admin' : '/worker'
  navigateTo((route.query.redirect as string) || fallback)
})

// Submits the login form. The watchEffect above handles the post-login redirect.
async function handleLogin(): Promise<void> {
  loading.value = true
  await login(form.email, form.password)
  loading.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden">
    <!-- Decorative blobs. -->
    <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gold-500/[0.03] blur-3xl pointer-events-none" />
    <div class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold-500/[0.03] blur-3xl pointer-events-none" />

    <div class="relative z-10 w-full max-w-sm mx-4">
      <!-- Logo and title. -->
      <div class="text-center mb-8">
        <div
          class="w-14 h-14 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center
                 justify-center mx-auto mb-4"
        >
          <span class="font-display font-bold text-gold-400 text-2xl">B</span>
        </div>
        <h1 class="font-display text-2xl text-primary">Staff Login</h1>
        <p class="text-secondary text-sm mt-1">
          {{ selectedRole ? `Signing in as ${selectedRole}` : 'Who are you?' }}
        </p>
      </div>

      <!-- Role selector — shown before any role is picked. -->
      <div v-if="!selectedRole" class="grid grid-cols-2 gap-4">
        <!-- Worker card. -->
        <button
          type="button"
          class="card flex flex-col items-center gap-3 py-8 cursor-pointer
                 border border-border hover:border-gold-500/40 transition-all group"
          @click="selectedRole = 'worker'"
        >
          <!-- Scissors icon. -->
          <svg
            class="w-10 h-10 text-gold-400 group-hover:scale-110 transition-transform"
            fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
          >
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
          <span class="font-display text-primary text-lg">Worker</span>
          <span class="text-muted text-xs text-center">Barber / Stylist</span>
        </button>

        <!-- Admin card. -->
        <button
          type="button"
          class="card flex flex-col items-center gap-3 py-8 cursor-pointer
                 border border-border hover:border-gold-500/40 transition-all group"
          @click="selectedRole = 'admin'"
        >
          <!-- Shield icon. -->
          <svg
            class="w-10 h-10 text-gold-400 group-hover:scale-110 transition-transform"
            fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span class="font-display text-primary text-lg">Admin</span>
          <span class="text-muted text-xs text-center">Manager / Owner</span>
        </button>
      </div>

      <!-- Login form — shown after a role is selected. -->
      <template v-else>
        <!-- Back button to re-select role. -->
        <button
          type="button"
          class="flex items-center gap-1 text-sm text-muted hover:text-secondary transition-colors mb-6"
          @click="selectedRole = null"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Change role
        </button>

        <form class="space-y-4" @submit.prevent="handleLogin">
          <!-- Email field. -->
          <div class="form-group">
            <label class="label" for="staff-email">Email</label>
            <input
              id="staff-email"
              v-model="form.email"
              class="input"
              type="email"
              autocomplete="email"
              placeholder="your@email.com"
              required
            >
          </div>

          <!-- Password field with visibility toggle. -->
          <div class="form-group">
            <label class="label" for="staff-password">Password</label>
            <div class="relative">
              <input
                id="staff-password"
                v-model="form.password"
                class="input pr-10"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                required
              >
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <SidebarIcon :icon="showPassword ? 'eye-off' : 'eye'" />
              </button>
            </div>
          </div>

          <button type="submit" class="btn-primary w-full" :disabled="loading">
            <span v-if="loading" class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin" />
            <span>{{ loading ? 'Signing in…' : 'Sign in' }}</span>
          </button>
        </form>
      </template>

      <!-- Back to client login. -->
      <p class="text-center text-sm text-muted mt-6">
        Looking for the client area?
        <NuxtLink to="/login" class="text-gold-400 hover:underline ml-1">Sign in here</NuxtLink>
      </p>
    </div>
  </div>
</template>
