<script setup lang="ts">
// Public registration page. Creates a customer record and a Client-role user
// account in sequence, then auto-logs in and redirects to the client portal.
import { UserRole } from '~/types'

definePageMeta({ layout: 'default' })

const router = useRouter()
const { login, isLoggedIn } = useAuth()
const { api } = useApi()
const toast = useToast()

// Form state.
const form = reactive({
  name: '',
  email: '',
  password: '',
  phone: '',
})

// Controls spinner on submit button.
const loading = ref(false)

// Whether the password field shows plain text.
const showPassword = ref(false)

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
    // Step 1: create the customer record to get a customerId.
    const customer = await api.customers.create({
      name: form.name.trim(),
      email: form.email.trim(),
      phoneNumber: form.phone.trim(),
    })

    // Step 2: create the user account linked to that customer.
    // Backend hashes the plain-text password; userRole 0 = Client.
    await api.users.create({
      email: form.email.trim(),
      passwordHash: form.password,
      userRole: UserRole.Client,
      isActive: true,
      customerId: customer.id,
    })

    // Step 3: auto-login so the session is established immediately.
    const ok = await login(form.email.trim(), form.password)
    if (ok) {
      await router.push('/my')
    }
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: string } }).response?.data ?? 'Registration failed. Please try again.'
    toast.error(typeof msg === 'string' ? msg : 'Registration failed. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Full-height centred layout matching the login page style. -->
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
    <!-- Decorative ambient blobs. -->
    <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gold-500/[0.03] blur-3xl pointer-events-none" />
    <div class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold-500/[0.03] blur-3xl pointer-events-none" />

    <div class="relative z-10 w-full max-w-sm">
      <!-- Logo and heading. -->
      <div class="text-center mb-8">
        <div
          class="w-14 h-14 rounded-xl bg-gold-500/20 border border-gold-500/30
                 flex items-center justify-center mx-auto mb-4"
        >
          <span class="font-display font-bold text-gold-400 text-2xl">B</span>
        </div>
        <h1 class="font-display text-2xl text-primary">Create an account</h1>
        <p class="text-secondary text-sm mt-1">Book appointments and manage your profile.</p>
      </div>

      <!-- Registration form. -->
      <form class="space-y-4" @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="label" for="reg-name">Full Name</label>
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
          <label class="label" for="reg-email">Email</label>
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
          <label class="label" for="reg-password">Password</label>
          <div class="relative">
            <input
              id="reg-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="new-password"
              placeholder="At least 6 characters"
              class="input w-full pr-10"
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
          <label class="label" for="reg-phone">Phone <span class="text-muted">(optional)</span></label>
          <input
            id="reg-phone"
            v-model="form.phone"
            type="tel"
            autocomplete="tel"
            placeholder="+1 555 000 0000"
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
          <span>{{ loading ? 'Creating account…' : 'Create account' }}</span>
        </button>
      </form>

      <!-- Link back to login. -->
      <p class="text-center text-sm text-muted mt-6">
        Already have an account?
        <NuxtLink to="/login" class="text-gold-400 hover:underline ml-1">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>
