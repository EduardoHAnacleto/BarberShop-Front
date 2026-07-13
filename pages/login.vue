<script setup lang="ts">
// Login page. Handles email/password and Google Identity Services sign-in.
// Automatically redirects already-authenticated users to the appropriate page.
definePageMeta({ layout: 'default' })

const route = useRoute()
const { login, loginWithGoogle, isLoggedIn, isAdmin } = useAuth()
// White-label logo monogram (sprint12072026license §4).
const { monogram } = useShopIdentity()

// Form state bound to the inputs.
const form = reactive({ email: '', password: '' })

// Controls the loading spinner on the submit button.
const loading = ref(false)

// Whether the password field is shown as plain text.
const showPassword = ref(false)

// When true, the API issues a 30-day JWT and the cookie is persisted across
// browser restarts. Also forwarded to the Google login callback below.
const rememberMe = ref(false)

// Redirect authenticated users away from the login page immediately.
// Admins go to /admin; all other roles go to /my (client portal).
watchEffect(() => {
  if (isLoggedIn.value) {
    const redirect = (route.query.redirect as string) || (isAdmin.value ? '/admin' : '/my')
    navigateTo(redirect)
  }
})

// Submits the email/password form, navigates on success.
// Explicit navigateTo (not watchEffect) ensures the route change happens after
// _hydrate() has committed the auth state, preventing a blank reload on /my.
async function handleLogin(): Promise<void> {
  loading.value = true
  const success = await login(form.email, form.password, rememberMe.value)
  loading.value = false
  if (success) {
    const redirect = (route.query.redirect as string) || (isAdmin.value ? '/admin' : '/my')
    await navigateTo(redirect)
  }
}

// True when a Google OAuth client ID has been configured. When false, the
// Google sign-in button is hidden — initialising GSI with an empty client_id
// throws "parameter client_id is not set correctly".
const googleEnabled = computed(() => !!useRuntimeConfig().public.googleClientId)

// Initialises the Google Identity Services button in the #google-btn container
// and triggers the One Tap prompt so users already signed into Google on this
// device get an automatic sign-in popup without clicking anything.
function initGoogle(): void {
  // window.google is injected by the GSI script loaded in nuxt.config.ts head.
  window.google?.accounts.id.initialize({
    client_id: useRuntimeConfig().public.googleClientId as string,
    // Reads rememberMe.value at the moment Google returns the credential so the
    // user's current checkbox choice is honoured for the Google flow as well.
    callback: async (response: { credential: string }) => {
      await loginWithGoogle(response.credential, rememberMe.value)
    },
    // auto_select silently re-signs in returning users who previously consented
    // — together with prompt() this gives true one-click login.
    auto_select: true,
    // FedCM is required by Chrome for One Tap in newer versions.
    use_fedcm_for_prompt: true,
    // Keep the One Tap card open if the user clicks outside of it.
    cancel_on_tap_outside: false,
    // Localises the button/prompt copy as "Sign in".
    context: 'signin',
    // Improves One Tap support on Safari/Firefox under ITP restrictions.
    itp_support: true,
  })

  // Renders the visible "Sign in with Google" button as a fallback for when
  // One Tap is suppressed (e.g. user already dismissed it, FedCM blocked).
  window.google?.accounts.id.renderButton(document.getElementById('google-btn')!, {
    theme: 'filled_black',
    size: 'large',
    width: 300,
    type: 'standard',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'left',
  })

  // Display Google's One Tap card immediately — uses the account already
  // signed into the device's browser to offer one-click sign-in.
  window.google?.accounts.id.prompt()
}

// Mount the Google button once the SDK is available. Retries every 200 ms
// until window.google is defined (the script loads async). Skipped entirely
// when no client ID is configured (typical for local development).
onMounted(() => {
  if (!googleEnabled.value) return

  const interval = setInterval(() => {
    if (window.google) {
      clearInterval(interval)
      initGoogle()
    }
  }, 200)

  // Safety: stop polling after 10 seconds regardless.
  setTimeout(() => clearInterval(interval), 10_000)
})
</script>

<template>
  <!-- Full-height centred layout with decorative background blobs. -->
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden">
    <!-- Decorative gold ambient blob — top-left. -->
    <div
      class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gold-500/[0.03] blur-3xl pointer-events-none"
    />
    <!-- Decorative gold ambient blob — bottom-right. -->
    <div
      class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold-500/[0.03] blur-3xl pointer-events-none"
    />

    <!-- Login card. -->
    <div class="relative z-10 w-full max-w-sm mx-4">
      <!-- Logo and title. -->
      <div class="text-center mb-8">
        <div
          class="w-14 h-14 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center
                 justify-center mx-auto mb-4"
        >
          <span class="font-display font-bold text-gold-400 text-2xl">{{ monogram }}</span>
        </div>
        <h1 class="font-display text-2xl text-primary">{{ $t('login.title') }}</h1>
        <p class="text-secondary text-sm mt-1">{{ $t('login.subtitle') }}</p>
      </div>

      <!-- Email / password form. -->
      <form class="space-y-4" @submit.prevent="handleLogin">
        <!-- Email field. -->
        <div class="form-group">
          <label class="label" for="email">{{ $t('common.email') }}</label>
          <input
            id="email"
            v-model="form.email"
            class="input"
            type="email"
            autocomplete="email"
            placeholder="admin@barbershop.com"
            required
          >
        </div>

        <!-- Password field with visibility toggle. -->
        <div class="form-group">
          <label class="label" for="password">{{ $t('common.password') }}</label>
          <div class="relative">
            <input
              id="password"
              v-model="form.password"
              class="input pr-10"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
              required
            >
            <!-- Eye icon toggle button. -->
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary
                     transition-colors"
              :aria-label="showPassword ? $t('common.hidePassword') : $t('common.showPassword')"
              @click="showPassword = !showPassword"
            >
              <SidebarIcon :icon="showPassword ? 'eye-off' : 'eye'" />
            </button>
          </div>
        </div>

        <!-- Remember-me checkbox — opts into a long-lived 30-day cookie. -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <input
              id="remember-me"
              v-model="rememberMe"
              type="checkbox"
              autocomplete="off"
              class="w-4 h-4 rounded border-border bg-raised text-gold-500
                     focus:ring-gold-500/40 cursor-pointer"
            >
            <label for="remember-me" class="text-sm text-secondary cursor-pointer select-none">
              {{ $t('login.rememberMe') }}
            </label>
          </div>
          <NuxtLink to="/forgot-password" class="text-sm text-gold-400 hover:underline">
            {{ $t('login.forgotPassword') }}
          </NuxtLink>
        </div>

        <!-- Submit button — shows a spinner while loading. -->
        <button
          type="submit"
          class="btn-primary w-full"
          :disabled="loading"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin" />
          <span>{{ loading ? $t('login.signingIn') : $t('login.signIn') }}</span>
        </button>
      </form>

      <!-- Back to home -->
      <div class="text-center mt-5">
        <NuxtLink to="/" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {{ $t('common.backToHome') }}
        </NuxtLink>
      </div>

      <!-- Links for clients: register or switch to staff login. -->
      <p class="text-center text-sm text-muted mt-3">
        {{ $t('login.noAccount') }}
        <NuxtLink to="/register" class="text-gold-400 hover:underline ml-1">{{ $t('nav.register') }}</NuxtLink>
      </p>
      <p class="text-center text-sm text-muted mt-2">
        {{ $t('login.areYouStaff') }}
        <NuxtLink to="/staff-login" class="text-gold-400 hover:underline ml-1">{{ $t('nav.staffLogin') }}</NuxtLink>
      </p>

      <!-- Divider and Google sign-in are hidden when no client ID is configured. -->
      <template v-if="googleEnabled">
        <!-- Divider between email/password and Google sign-in. -->
        <div class="flex items-center gap-3 my-5">
          <div class="flex-1 divider" />
          <span class="text-xs text-muted font-mono">{{ $t('common.or') }}</span>
          <div class="flex-1 divider" />
        </div>

        <!-- Google Identity Services button. The SDK renders into this div
             once the GSI script finishes loading (handled in initGoogle). -->
        <div id="google-btn" class="flex justify-center" />
      </template>
    </div>
  </div>
</template>
