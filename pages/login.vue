<script setup lang="ts">
// Login page. Handles email/password and Google Identity Services sign-in.
// Automatically redirects already-authenticated users to the appropriate page.
definePageMeta({ layout: 'default' })

const route = useRoute()
const { login, loginWithGoogle, isLoggedIn, isAdmin } = useAuth()

// Form state bound to the inputs.
const form = reactive({ email: '', password: '' })

// Controls the loading spinner on the submit button.
const loading = ref(false)

// Whether the password field is shown as plain text.
const showPassword = ref(false)

// Redirect authenticated users away from the login page immediately.
watchEffect(() => {
  if (isLoggedIn.value) {
    const redirect = (route.query.redirect as string) || (isAdmin.value ? '/admin' : '/')
    navigateTo(redirect)
  }
})

// Submits the email/password form and shows a spinner while the request runs.
async function handleLogin(): Promise<void> {
  loading.value = true
  await login(form.email, form.password)
  loading.value = false
}

// True when a Google OAuth client ID has been configured. When false, the
// Google sign-in button is hidden — initialising GSI with an empty client_id
// throws "parameter client_id is not set correctly".
const googleEnabled = computed(() => !!useRuntimeConfig().public.googleClientId)

// Initialises the Google Identity Services button in the #google-btn container.
function initGoogle(): void {
  // window.google is injected by the GSI script loaded in nuxt.config.ts head.
  window.google?.accounts.id.initialize({
    client_id: useRuntimeConfig().public.googleClientId as string,
    callback: async (response: { credential: string }) => {
      await loginWithGoogle(response.credential)
    },
  })

  window.google?.accounts.id.renderButton(document.getElementById('google-btn')!, {
    theme: 'filled_black',
    size: 'large',
    width: 300,
  })
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
          <span class="font-display font-bold text-gold-400 text-2xl">B</span>
        </div>
        <h1 class="font-display text-2xl text-primary">BarberShop</h1>
        <p class="text-secondary text-sm mt-1">Sign in to your account</p>
      </div>

      <!-- Email / password form. -->
      <form class="space-y-4" @submit.prevent="handleLogin">
        <!-- Email field. -->
        <div class="form-group">
          <label class="label" for="email">Email</label>
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
          <label class="label" for="password">Password</label>
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
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <SidebarIcon :icon="showPassword ? 'eye-off' : 'eye'" />
            </button>
          </div>
        </div>

        <!-- Submit button — shows a spinner while loading. -->
        <button
          type="submit"
          class="btn-primary w-full"
          :disabled="loading"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin" />
          <span>{{ loading ? 'Signing in…' : 'Sign in' }}</span>
        </button>
      </form>

      <!-- Divider and Google sign-in are hidden when no client ID is configured. -->
      <template v-if="googleEnabled">
        <!-- Divider between email/password and Google sign-in. -->
        <div class="flex items-center gap-3 my-5">
          <div class="flex-1 divider" />
          <span class="text-xs text-muted font-mono">or</span>
          <div class="flex-1 divider" />
        </div>

        <!-- Google Identity Services button. The SDK renders into this div
             once the GSI script finishes loading (handled in initGoogle). -->
        <div id="google-btn" class="flex justify-center" />
      </template>
    </div>
  </div>
</template>
