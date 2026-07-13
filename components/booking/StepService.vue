<script setup lang="ts">
// Step 1 of the booking flow: service selection grid.
// Emits the selected service ID so the parent can advance to step 2.
import type { Service } from '~/types'

defineProps<{
  // All available services fetched by the parent.
  services: Service[]
  // ID of the currently selected service (null = nothing chosen yet).
  selectedId: number | null
  // True while the parent is fetching the services list.
  loading: boolean
}>()

const emit = defineEmits<{
  // Fired when the user clicks a service card.
  (e: 'select', serviceId: number): void
}>()

// Formats a price value as a dollar-prefixed string with 2 decimal places.
function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

// Formats a duration in minutes as a human-readable string.
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
</script>

<template>
  <div>
    <h2 class="font-display text-xl text-primary mb-1">{{ $t('bookingStep.chooseService') }}</h2>
    <p class="text-secondary text-sm mb-6">{{ $t('bookingStep.chooseServiceSubtitle') }}</p>

    <!-- Skeleton grid while services are loading. -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div v-for="n in 4" :key="n" class="card space-y-2">
        <UiSkeleton height="h-6" class="w-36" />
        <UiSkeleton height="h-4" class="w-full" />
        <UiSkeleton height="h-4" class="w-20" />
      </div>
    </div>

    <!-- Empty state. -->
    <p v-else-if="services.length === 0" class="text-center text-muted py-12">
      {{ $t('home.noServices') }}
    </p>

    <!-- Selectable service cards. -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        v-for="svc in services"
        :key="svc.id"
        type="button"
        class="card text-left flex flex-col gap-2 transition-all duration-150 hover:border-gold-500/50 cursor-pointer"
        :class="selectedId === svc.id
          ? 'border-gold-500 shadow-gold-glow'
          : 'border-border'"
        @click="emit('select', svc.id)"
      >
        <h3 class="font-display text-lg text-primary">{{ svc.name }}</h3>
        <p class="text-secondary text-sm line-clamp-2 flex-1">{{ svc.description }}</p>
        <div class="flex items-center justify-between mt-1">
          <span class="font-mono text-xs text-muted">{{ formatDuration(svc.duration) }}</span>
          <span class="font-display text-gold-400 font-semibold">{{ formatPrice(svc.price) }}</span>
        </div>
      </button>
    </div>
  </div>
</template>
