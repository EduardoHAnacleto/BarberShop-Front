<script setup lang="ts">
// Forgot-password request page. Always shows the same success state whether
// or not the email is registered — the API itself never reveals that either,
// so the frontend must not leak it via a different UI branch.
definePageMeta({ layout: 'default' })

const { api } = useApi()
const toast = useToast()
const { t } = useI18n()

const email = ref('')
const submitting = ref(false)
const submitted = ref(false)

async function handleSubmit(): Promise<void> {
  submitting.value = true
  try {
    await api.auth.forgotPassword(email.value.trim())
    submitted.value = true
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: string } }).response?.data ?? t('common.somethingWentWrong')
    toast.error(typeof msg === 'string' ? msg : t('common.somethingWentWrong'))
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
        <h1 class="font-display text-2xl text-primary">{{ $t('forgotPassword.title') }}</h1>
        <p class="text-secondary text-sm mt-1">{{ $t('forgotPassword.subtitle') }}</p>
      </div>

      <!-- Success state — same message regardless of whether the email exists. -->
      <div v-if="submitted" class="card text-center space-y-3">
        <p class="text-primary">{{ $t('forgotPassword.successMessage') }}</p>
        <p class="text-secondary text-sm">{{ $t('forgotPassword.checkInbox') }}</p>
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="label" for="forgot-email">{{ $t('common.email') }}</label>
          <input
            id="forgot-email"
            v-model="email"
            class="input"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            required
          >
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="submitting">
          <span v-if="submitting" class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin" />
          <span>{{ submitting ? $t('forgotPassword.sending') : $t('forgotPassword.sendLink') }}</span>
        </button>
      </form>

      <p class="text-center text-sm text-muted mt-5">
        {{ $t('forgotPassword.rememberedIt') }}
        <NuxtLink to="/login" class="text-gold-400 hover:underline ml-1">{{ $t('forgotPassword.backToSignIn') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
