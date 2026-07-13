<script setup lang="ts">
// Staff entry point: user selects Worker or Admin role, then signs in.
// Workers are redirected to /worker; admins to /admin after a successful login.
definePageMeta({ layout: 'default' })

const { login, isLoggedIn, isAdmin } = useAuth()
const route = useRoute()
// White-label logo monogram (sprint12072026license §4).
const { monogram } = useShopIdentity()

// Which role the staff member identified themselves as. null = not yet selected.
const selectedRole = ref<'worker' | 'admin' | null>(null)

const { t } = useI18n()

// Localised, properly-cased label for the "Signing in as X" subtitle.
const selectedRoleLabel = computed(() =>
  selectedRole.value === 'worker' ? t('staffLogin.worker') : t('staffLogin.admin'),
)

// Login form state.
const form = reactive({ email: '', password: '' })
const loading = ref(false)
const showPassword = ref(false)

// Opts into a long-lived (30 day) cookie + JWT — same as the client login flow.
const rememberMe = ref(false)

// Redirect already-authenticated users to the right portal immediately.
watchEffect(() => {
  if (!isLoggedIn.value) return
  const fallback = isAdmin.value ? '/admin' : '/worker'
  navigateTo((route.query.redirect as string) || fallback)
})

// Submits the login form and navigates on success.
// Explicit navigateTo after login() so auth state is committed before route change.
async function handleLogin(): Promise<void> {
  loading.value = true
  const success = await login(form.email, form.password, rememberMe.value)
  loading.value = false
  if (success) {
    await navigateTo(isAdmin.value ? '/admin' : '/worker')
  }
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
          <span class="font-display font-bold text-gold-400 text-2xl">{{ monogram }}</span>
        </div>
        <h1 class="font-display text-2xl text-primary">{{ $t('nav.staffLogin') }}</h1>
        <p class="text-secondary text-sm mt-1">
          {{ selectedRole ? $t('staffLogin.signingInAs', { role: selectedRoleLabel }) : $t('staffLogin.whoAreYou') }}
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
          <span class="font-display text-primary text-lg">{{ $t('staffLogin.worker') }}</span>
          <span class="text-muted text-xs text-center">{{ $t('staffLogin.workerSubtitle') }}</span>
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
          <span class="font-display text-primary text-lg">{{ $t('staffLogin.admin') }}</span>
          <span class="text-muted text-xs text-center">{{ $t('staffLogin.adminSubtitle') }}</span>
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
          {{ $t('staffLogin.changeRole') }}
        </button>

        <form class="space-y-4" @submit.prevent="handleLogin">
          <!-- Email field. -->
          <div class="form-group">
            <label class="label" for="staff-email">{{ $t('common.email') }}</label>
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
            <label class="label" for="staff-password">{{ $t('common.password') }}</label>
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
                :aria-label="showPassword ? $t('common.hidePassword') : $t('common.showPassword')"
                @click="showPassword = !showPassword"
              >
                <SidebarIcon :icon="showPassword ? 'eye-off' : 'eye'" />
              </button>
            </div>
          </div>

          <!-- Remember-me opts the staff session into a 30-day cookie. -->
          <div class="flex items-center gap-2">
            <input
              id="staff-remember-me"
              v-model="rememberMe"
              type="checkbox"
              autocomplete="off"
              class="w-4 h-4 rounded border-border bg-raised text-gold-500
                     focus:ring-gold-500/40 cursor-pointer"
            >
            <label for="staff-remember-me" class="text-sm text-secondary cursor-pointer select-none">
              {{ $t('login.rememberMe') }}
            </label>
          </div>

          <button type="submit" class="btn-primary w-full" :disabled="loading">
            <span v-if="loading" class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin" />
            <span>{{ loading ? $t('login.signingIn') : $t('login.signIn') }}</span>
          </button>
        </form>
      </template>

      <!-- Back to client login. -->
      <p class="text-center text-sm text-muted mt-6">
        {{ $t('staffLogin.lookingForClientArea') }}
        <NuxtLink to="/login" class="text-gold-400 hover:underline ml-1">{{ $t('staffLogin.signInHere') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
