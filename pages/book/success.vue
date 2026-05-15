<script setup lang="ts">
// Booking confirmation page — shown after a successful booking submission.
// Reads the appointmentId from the query string for display purposes.
definePageMeta({ layout: 'default' })

const route = useRoute()

// appointmentId is passed as a query param from the booking flow.
const appointmentId = computed(() => route.query.appointmentId ?? null)
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

      <!-- Appointment reference number. -->
      <div v-if="appointmentId" class="card inline-block px-6 py-3 mb-8">
        <p class="text-xs text-muted uppercase tracking-wider font-mono mb-1">Appointment #</p>
        <p class="font-mono text-2xl text-gold-400 font-bold">{{ appointmentId }}</p>
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
