<script setup lang="ts">
// Booking confirmation page — shown after a successful booking submission.
// Reads the appointment essentials from the query string for display and for
// the "add to calendar" actions.
import { buildIcs, googleCalendarUrl } from '~/utils/calendar'
import type { CalendarEvent } from '~/utils/calendar'

definePageMeta({ layout: 'default' })

const route = useRoute()
const config = useRuntimeConfig()

// appointmentId is passed as a query param from the booking flow.
const appointmentId = computed(() => route.query.appointmentId ?? null)

// Present only when the booking flow submitted a "repeat weekly" series.
const recurringSummary = computed(() => {
  const created = Number(route.query.createdCount)
  const skipped = Number(route.query.skippedCount)
  if (!created) return null
  return { created, skipped }
})

// Full details are present when arriving from the booking flow; when absent
// (e.g. a shared link) the calendar actions are hidden.
const calendarEvent = computed<CalendarEvent | null>(() => {
  const service = route.query.service as string | undefined
  const worker = route.query.worker as string | undefined
  const scheduledFor = route.query.scheduledFor as string | undefined
  const duration = Number(route.query.duration)

  if (!service || !scheduledFor || !duration) return null

  return {
    title: `${service} at BarberShop`,
    description: worker ? `with ${worker}` : 'BarberShop appointment',
    location: (config.public.shopAddress as string) ?? '',
    start: scheduledFor,
    durationMinutes: duration,
  }
})

const googleUrl = computed(() =>
  calendarEvent.value ? googleCalendarUrl(calendarEvent.value) : '#',
)

// Downloads the appointment as an .ics file (reusing the blob-download helper).
function downloadIcs(): void {
  if (!calendarEvent.value) return
  const ics = buildIcs(calendarEvent.value)
  if (typeof document === 'undefined') return
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'appointment.ics'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="min-h-screen">
    <!-- Sticky navigation. -->
    <LayoutPublicNavbar />

    <!-- Centred confirmation panel. -->
    <div class="flex flex-col items-center justify-center px-4 py-24 text-center">
      <!-- Large animated checkmark circle. -->
      <div
        class="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500
               flex items-center justify-center mb-6 animate-fade-in"
      >
        <svg class="w-10 h-10 text-emerald-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414
               0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </div>

      <h1 class="font-display text-4xl text-primary mb-2">Booking Confirmed!</h1>
      <p class="text-secondary text-lg mb-4">Your appointment has been scheduled.</p>

      <!-- Recurring series summary — only present for "repeat weekly" bookings. -->
      <p v-if="recurringSummary" class="text-secondary text-sm mb-4">
        Booked {{ recurringSummary.created }} weekly visit{{ recurringSummary.created === 1 ? '' : 's' }}.
        <span v-if="recurringSummary.skipped > 0">
          {{ recurringSummary.skipped }} date{{ recurringSummary.skipped === 1 ? ' was' : 's were' }}
          already taken and skipped.
        </span>
      </p>

      <!-- Appointment reference number. -->
      <div v-if="appointmentId" class="card inline-block px-6 py-3 mb-8">
        <p class="text-xs text-muted uppercase tracking-wider font-mono mb-1">Appointment #</p>
        <p class="font-mono text-2xl text-gold-400 font-bold">{{ appointmentId }}</p>
      </div>

      <!-- Add to calendar — only when we have the event details. -->
      <div v-if="calendarEvent" class="flex flex-wrap items-center justify-center gap-3 mb-6">
        <button type="button" class="btn-outline text-sm" @click="downloadIcs">
          Download .ics
        </button>
        <a :href="googleUrl" target="_blank" rel="noopener" class="btn-outline text-sm">
          Add to Google Calendar
        </a>
      </div>

      <!-- Navigation CTAs. -->
      <div class="flex flex-wrap items-center justify-center gap-4">
        <NuxtLink to="/book" class="btn-primary">Book another</NuxtLink>
        <NuxtLink to="/" class="btn-outline">Back to Home</NuxtLink>
      </div>

      <!-- Shop location — compact map so the customer knows where to go. -->
      <div class="w-full max-w-md mt-10">
        <ShopLocationCard :compact="true" />
      </div>
    </div>
  </div>
</template>
