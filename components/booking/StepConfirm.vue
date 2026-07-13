<script setup lang="ts">
// Step 3 of the booking flow: booking summary + customer contact form.
// Validates the form locally before emitting the confirm event.
import type { Service, Worker } from '~/types'

const { locale } = useI18n()
// Locale-aware paths for the terms/privacy consent links below the submit
// button — anonymous booking is where a visitor first hands over name/email.
const localePath = useLocalePath()

const props = defineProps<{
  // The service selected in step 1.
  service: Service
  // The worker selected in step 2.
  worker: Worker
  // ISO date string of the selected date.
  selectedDate: string
  // HH:mm time string of the selected slot.
  selectedTime: string
  // True while the parent is submitting the booking.
  submitting: boolean
  // Pre-fill values resolved from the logged-in user's customer profile.
  prefill?: { name: string; email: string; phone: string }
}>()

const emit = defineEmits<{
  // Fired with customer details (and, when the repeat toggle is on, the
  // number of weekly occurrences to book) when the form is submitted and valid.
  (e: 'confirm', payload: { name: string; email: string; phone: string; repeatWeeks?: number }): void
}>()

// Customer form fields — seeded from the logged-in user's profile when available.
const name = ref(props.prefill?.name ?? '')
const email = ref(props.prefill?.email ?? '')
const phone = ref(props.prefill?.phone ?? '')

// ── Repeat weekly ────────────────────────────────────────────────────────────

const repeatWeekly = ref(false)
// Total occurrences including the first booking; matches the backend's 1–12 cap.
const repeatWeeks = ref(4)

// Simple client-side validation: name and email are required, email must be valid.
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isValid = computed(
  () => name.value.trim().length > 0 && emailRegex.test(email.value),
)

// Formats an ISO date string as "Month DD, YYYY" (localized to the active locale).
function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(locale.value, { month: 'long', day: '2-digit', year: 'numeric' })
}

// Formats a price value as a dollar-prefixed string.
function fmtPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

// Formats a duration in minutes as a human-readable string.
function fmtDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function submit(): void {
  if (!isValid.value) return
  emit('confirm', {
    name: name.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim(),
    repeatWeeks: repeatWeekly.value ? repeatWeeks.value : undefined,
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Booking summary card. -->
    <div class="card space-y-4">
      <h2 class="font-display text-xl text-primary">{{ $t('bookingConfirm.summaryTitle') }}</h2>

      <!-- Service details. -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs text-muted uppercase tracking-wider font-mono mb-0.5">{{ $t('bookingConfirm.service') }}</p>
          <p class="text-primary font-medium">{{ service.name }}</p>
          <p class="text-secondary text-sm">{{ fmtDuration(service.duration) }}</p>
        </div>
        <span class="font-display text-gold-400 font-bold text-lg shrink-0">
          {{ fmtPrice(service.price) }}
        </span>
      </div>

      <!-- Worker. -->
      <div>
        <p class="text-xs text-muted uppercase tracking-wider font-mono mb-0.5">{{ $t('bookingConfirm.professional') }}</p>
        <p class="text-primary font-medium">{{ worker.name }}</p>
        <p class="text-secondary text-sm">{{ worker.position }}</p>
      </div>

      <!-- Date & time. -->
      <div class="flex gap-6">
        <div>
          <p class="text-xs text-muted uppercase tracking-wider font-mono mb-0.5">{{ $t('bookingConfirm.date') }}</p>
          <p class="text-primary">{{ fmtDate(selectedDate) }}</p>
        </div>
        <div>
          <p class="text-xs text-muted uppercase tracking-wider font-mono mb-0.5">{{ $t('bookingConfirm.time') }}</p>
          <p class="text-primary font-mono">{{ selectedTime }}</p>
        </div>
      </div>

      <!-- Repeat weekly. -->
      <div class="pt-3 border-t border-subtle">
        <label class="flex items-center gap-2 text-sm text-secondary cursor-pointer">
          <input
            id="repeat-weekly"
            v-model="repeatWeekly"
            type="checkbox"
            autocomplete="off"
            class="w-4 h-4 rounded border-border bg-raised text-gold-500
                   focus:ring-gold-500/40 cursor-pointer"
          >
          {{ $t('bookingConfirm.repeatWeekly') }}
        </label>
        <div v-if="repeatWeekly" class="mt-2 flex items-center gap-2">
          <label for="repeat-weeks" class="text-sm text-secondary">{{ $t('bookingConfirm.for') }}</label>
          <input
            id="repeat-weeks"
            v-model.number="repeatWeeks"
            type="number"
            min="2"
            max="12"
            class="input w-20"
          >
          <span class="text-sm text-secondary">{{ $t('bookingConfirm.weeksSameDayTime') }}</span>
        </div>
      </div>
    </div>

    <!-- Customer details form. -->
    <form class="space-y-4" @submit.prevent="submit">
      <h3 class="font-display text-lg text-primary">{{ $t('bookingConfirm.yourDetails') }}</h3>

      <div>
        <label for="customer-name" class="block text-sm text-secondary mb-1">
          {{ $t('bookingConfirm.fullName') }} <span class="text-gold-400">*</span>
        </label>
        <input
          id="customer-name"
          v-model="name"
          type="text"
          required
          autocomplete="name"
          placeholder="John Doe"
          class="input w-full"
        >
      </div>

      <div>
        <label for="customer-email" class="block text-sm text-secondary mb-1">
          {{ $t('common.email') }} <span class="text-gold-400">*</span>
        </label>
        <input
          id="customer-email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          placeholder="john@example.com"
          class="input w-full"
        >
      </div>

      <div>
        <label for="customer-phone" class="block text-sm text-secondary mb-1">
          {{ $t('bookingConfirm.phone') }}
        </label>
        <input
          id="customer-phone"
          v-model="phone"
          type="tel"
          autocomplete="tel"
          placeholder="+1 555 000 0000"
          class="input w-full"
        >
      </div>

      <!-- Submit button: disabled until form is valid or while submitting. -->
      <button
        type="submit"
        class="btn-primary w-full"
        :disabled="!isValid || submitting"
      >
        <span v-if="submitting">{{ $t('bookingConfirm.booking') }}</span>
        <span v-else>{{ $t('bookingConfirm.confirmBooking') }}</span>
      </button>

      <!-- Consent notice — this form is where an anonymous visitor first
           provides personal data (name/email/phone). -->
      <p class="text-center text-xs text-muted">
        {{ $t('legal.agreeBookingPrefix') }}
        <NuxtLink :to="localePath('/terms')" class="text-gold-400 hover:underline">{{ $t('legal.terms.title') }}</NuxtLink>
        {{ $t('legal.agreeAnd') }}
        <NuxtLink :to="localePath('/privacy')" class="text-gold-400 hover:underline">{{ $t('legal.privacy.title') }}</NuxtLink>.
      </p>
    </form>
  </div>
</template>
