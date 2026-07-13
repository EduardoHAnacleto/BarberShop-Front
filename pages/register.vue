<script setup lang="ts">
// Public client registration page.
// Calls POST /api/auth/register (single endpoint), shows a success screen,
// then redirects to the landing page after a brief confirmation delay.
definePageMeta({ layout: 'default' })

const { setToken, isLoggedIn } = useAuth()
const { api } = useApi()
const toast = useToast()
const { t } = useI18n()
// Locale-aware paths for the terms/privacy consent links below the form.
const localePath = useLocalePath()
// White-label logo monogram (sprint12072026license §4).
const { monogram } = useShopIdentity()

// Form state.
const form = reactive({
  name: '',
  email: '',
  password: '',
  phone: '',
  dateOfBirth: '',
})

// Controls spinner on submit button.
const loading = ref(false)

// Whether the password field shows plain text.
const showPassword = ref(false)

// Shown after successful registration while the countdown runs.
const registered = ref(false)

// Redirect already-authenticated users straight to their portal.
watchEffect(() => {
  if (isLoggedIn.value) navigateTo('/my')
})

// Validates the form before submission.
const isValid = computed(
  () => form.name.trim().length >= 2 && form.email.includes('@') && form.password.length >= 6,
)

async function handleRegister(): Promise<void> {
  if (!isValid.value) return
  loading.value = true

  try {
    // Single endpoint: creates customer + user and returns a JWT.
    const res = await api.auth.register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phoneNumber: form.phone.trim(),
      dateOfBirth: form.dateOfBirth || null,
    })

    // Hydrate auth state from the returned token so the user is logged in.
    setToken(res.token)

    registered.value = true

    // Redirect to My Account after 3 s so the user can read the confirmation.
    setTimeout(() => navigateTo('/my'), 3000)
  } catch (err: unknown) {
    const raw = (err as { response?: { data?: unknown } }).response?.data
    const msg = typeof raw === 'string' ? raw : t('register.failed')
    toast.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
    <!-- Decorative ambient blobs. -->
    <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gold-500/[0.03] blur-3xl pointer-events-none" />
    <div class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold-500/[0.03] blur-3xl pointer-events-none" />

    <div class="relative z-10 w-full max-w-sm">

      <!-- ── Success confirmation ── -->
      <div v-if="registered" class="text-center space-y-4">
        <!-- Animated checkmark. -->
        <div
          class="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30
                 flex items-center justify-center mx-auto"
        >
          <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 class="font-display text-2xl text-primary">{{ $t('register.successTitle') }}</h1>
        <p class="text-secondary text-sm">
          {{ $t('register.welcome', { name: form.name.split(' ')[0] }) }}<br>
          {{ $t('register.redirecting') }}
        </p>
        <NuxtLink to="/my" class="btn-primary inline-block mt-2">{{ $t('register.goNow') }}</NuxtLink>
      </div>

      <!-- ── Registration form ── -->
      <template v-else>
        <!-- Logo and heading. -->
        <div class="text-center mb-8">
          <div
            class="w-14 h-14 rounded-xl bg-gold-500/20 border border-gold-500/30
                   flex items-center justify-center mx-auto mb-4"
          >
            <span class="font-display font-bold text-gold-400 text-2xl">{{ monogram }}</span>
          </div>
          <h1 class="font-display text-2xl text-primary">{{ $t('register.title') }}</h1>
          <p class="text-secondary text-sm mt-1">{{ $t('register.subtitle') }}</p>
        </div>

        <form class="space-y-4" @submit.prevent="handleRegister">
          <div class="form-group">
            <label class="label" for="reg-name">{{ $t('register.fullName') }}</label>
            <input
              id="reg-name"
              v-model="form.name"
              type="text"
              required
              autocomplete="name"
              placeholder="John Doe"
              class="input w-full"
            >
          </div>

          <div class="form-group">
            <label class="label" for="reg-email">{{ $t('common.email') }}</label>
            <input
              id="reg-email"
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              placeholder="john@example.com"
              class="input w-full"
            >
          </div>

          <div class="form-group">
            <label class="label" for="reg-password">{{ $t('common.password') }}</label>
            <div class="relative">
              <input
                id="reg-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                :placeholder="$t('register.passwordPlaceholder')"
                class="input w-full pr-10"
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

          <div class="form-group">
            <label class="label" for="reg-phone">{{ $t('register.phone') }} <span class="text-muted">({{ $t('register.optional') }})</span></label>
            <input
              id="reg-phone"
              v-model="form.phone"
              type="tel"
              autocomplete="tel"
              placeholder="+1 555 000 0000"
              class="input w-full"
            >
          </div>

          <div class="form-group">
            <label class="label" for="reg-dob">{{ $t('register.dateOfBirth') }} <span class="text-muted">({{ $t('register.optional') }})</span></label>
            <input
              id="reg-dob"
              v-model="form.dateOfBirth"
              type="date"
              autocomplete="bday"
              class="input w-full"
            >
          </div>

          <button
            type="submit"
            class="btn-primary w-full"
            :disabled="!isValid || loading"
          >
            <span
              v-if="loading"
              class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin"
            />
            <span>{{ loading ? $t('register.creating') : $t('register.createAccount') }}</span>
          </button>
        </form>

        <!-- Consent notice — account creation is the LGPD-relevant collection
             point for a registered client's personal data. -->
        <p class="text-center text-xs text-muted mt-4">
          {{ $t('legal.agreeRegisterPrefix') }}
          <NuxtLink :to="localePath('/terms')" class="text-gold-400 hover:underline">{{ $t('legal.terms.title') }}</NuxtLink>
          {{ $t('legal.agreeAnd') }}
          <NuxtLink :to="localePath('/privacy')" class="text-gold-400 hover:underline">{{ $t('legal.privacy.title') }}</NuxtLink>.
        </p>

        <p class="text-center text-sm text-muted mt-6">
          {{ $t('register.alreadyHaveAccount') }}
          <NuxtLink to="/login" class="text-gold-400 hover:underline ml-1">{{ $t('login.signIn') }}</NuxtLink>
        </p>
        <p class="text-center text-sm text-muted mt-2">
          <NuxtLink to="/" class="text-secondary hover:text-primary transition-colors">← {{ $t('common.backToHome') }}</NuxtLink>
        </p>
      </template>
    </div>
  </div>
</template>
