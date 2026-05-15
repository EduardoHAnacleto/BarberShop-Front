<script setup lang="ts">
// Step 3 of the booking flow: booking summary + customer contact form.
// Validates the form locally before emitting the confirm event.
import type { Service, Worker } from '~/types'

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
  // Fired with customer details when the form is submitted and valid.
  (e: 'confirm', payload: { name: string; email: string; phone: string }): void
}>()

// Customer form fields — seeded from the logged-in user's profile when available.
const name = ref(props.prefill?.name ?? '')
const email = ref(props.prefill?.email ?? '')
const phone = ref(props.prefill?.phone ?? '')

// Simple client-side validation: name and email are required, email must be valid.
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isValid = computed(
  () => name.value.trim().length > 0 && emailRegex.test(email.value),
)

// Formats an ISO date string as "Month DD, YYYY".
function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
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
  emit('confirm', { name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim() })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Booking summary card. -->
    <div class="card space-y-4">
      <h2 class="font-display text-xl text-primary">Booking Summary</h2>

      <!-- Service details. -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs text-muted uppercase tracking-wider font-mono mb-0.5">Service</p>
          <p class="text-primary font-medium">{{ service.name }}</p>
          <p class="text-secondary text-sm">{{ fmtDuration(service.duration) }}</p>
        </div>
        <span class="font-display text-gold-400 font-bold text-lg shrink-0">
          {{ fmtPrice(service.price) }}
        </span>
      </div>

      <!-- Worker. -->
      <div>
        <p class="text-xs text-muted uppercase tracking-wider font-mono mb-0.5">Professional</p>
        <p class="text-primary font-medium">{{ worker.name }}</p>
        <p class="text-secondary text-sm">{{ worker.position }}</p>
      </div>

      <!-- Date & time. -->
      <div class="flex gap-6">
        <div>
          <p class="text-xs text-muted uppercase tracking-wider font-mono mb-0.5">Date</p>
          <p class="text-primary">{{ fmtDate(selectedDate) }}</p>
        </div>
        <div>
          <p class="text-xs text-muted uppercase tracking-wider font-mono mb-0.5">Time</p>
          <p class="text-primary font-mono">{{ selectedTime }}</p>
        </div>
      </div>
    </div>

    <!-- Customer details form. -->
    <form class="space-y-4" @submit.prevent="submit">
      <h3 class="font-display text-lg text-primary">Your Details</h3>

      <div>
        <label for="customer-name" class="block text-sm text-secondary mb-1">
          Full Name <span class="text-gold-400">*</span>
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
          Email <span class="text-gold-400">*</span>
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
          Phone
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
        <span v-if="submitting">Booking…</span>
        <span v-else>Confirm Booking</span>
      </button>
    </form>
  </div>
</template>
