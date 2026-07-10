<script setup lang="ts">
// Reset-password landing page. Reads the token from the query string (the
// link sent by the forgot-password email) and submits a new password.
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { api } = useApi()
const toast = useToast()

const token = computed(() => (route.query.token as string) ?? '')

const newPassword = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const showPassword = ref(false)

const passwordsMismatch = computed(
  () => confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value,
)

async function handleSubmit(): Promise<void> {
  if (newPassword.value.length < 8) {
    toast.error('New password must be at least 8 characters')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    toast.error('Passwords do not match')
    return
  }

  submitting.value = true
  try {
    await api.auth.resetPassword(token.value, newPassword.value)
    toast.success('Password reset. Please sign in with your new password.')
    await router.push('/login')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: string } }).response?.data ?? 'Could not reset password'
    toast.error(typeof msg === 'string' ? msg : 'Could not reset password')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden">
    <div
      class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gold-500/[0.03] blur-3xl pointer-events-none"
    />
    <div
      class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold-500/[0.03] blur-3xl pointer-events-none"
    />

    <div class="relative z-10 w-full max-w-sm mx-4">
      <div class="text-center mb-8">
        <div
          class="w-14 h-14 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center
                 justify-center mx-auto mb-4"
        >
          <span class="font-display font-bold text-gold-400 text-2xl">B</span>
        </div>
        <h1 class="font-display text-2xl text-primary">Choose a new password</h1>
      </div>

      <!-- No token in the URL — the user did not arrive via the email link. -->
      <div v-if="!token" class="card text-center space-y-3">
        <p class="text-primary">This reset link is missing or invalid.</p>
        <NuxtLink to="/forgot-password" class="text-gold-400 hover:underline text-sm">
          Request a new link →
        </NuxtLink>
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="label" for="reset-new-password">New password</label>
          <div class="relative">
            <input
              id="reset-new-password"
              v-model="newPassword"
              class="input pr-10"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
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

        <div class="form-group">
          <label class="label" for="reset-confirm-password">Confirm new password</label>
          <input
            id="reset-confirm-password"
            v-model="confirmPassword"
            class="input"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="••••••••"
            required
          >
          <p v-if="passwordsMismatch" class="text-red-400 text-xs mt-1">Passwords do not match</p>
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="submitting">
          <span v-if="submitting" class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin" />
          <span>{{ submitting ? 'Resetting…' : 'Reset password' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>
