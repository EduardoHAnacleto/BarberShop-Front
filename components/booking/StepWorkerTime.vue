<script setup lang="ts">
// Step 2 of the booking flow: worker selection, date picker, and time slot grid.
// Sequentially reveals the date picker after a worker is chosen, then the time
// grid after a date is chosen (or a closed-day message when applicable).
import type { Worker, WorkerRatingSummary } from '~/types'

const props = defineProps<{
  // Workers that provide the service selected in step 1.
  workers: Worker[]
  // True while the parent is fetching the workers list.
  loadingWorkers: boolean
  // Aggregate rating per worker id — absent entries render "No reviews".
  ratings?: Record<number, WorkerRatingSummary>
  // ID of the currently selected worker (null = not yet chosen).
  selectedWorkerId: number | null
  // ISO date string of the chosen date (empty = not yet chosen).
  selectedDate: string
  // True when the selected date falls outside the shop's schedule.
  dayIsClosed: boolean
  // True when the day is open but every slot is taken — only then can the
  // customer join a waitlist (a closed day will never free one up).
  dayIsFullyBooked: boolean
  // True while the parent is fetching the day's schedule.
  loadingSchedule: boolean
  // Available HH:mm time slots derived from the day's schedule.
  timeSlots: string[]
  // The selected time slot string (empty = not yet chosen).
  selectedTime: string
  // True once the caller has already joined the waitlist for this worker+date.
  onWaitlist: boolean
  // True while the join-waitlist request is in flight.
  joiningWaitlist: boolean
}>()

const emit = defineEmits<{
  // Fired when the user picks a worker card.
  (e: 'select-worker', workerId: number): void
  // Fired when the user changes the date input or picks a time slot.
  (e: 'select-date' | 'select-time', value: string): void
  // Fired when the user asks to be notified if a slot opens up.
  (e: 'join-waitlist'): void
}>()

// ISO date string of today in local time — used as the date picker minimum.
const todayIso = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})

// Selected worker object resolved from the prop list for display purposes.
const selectedWorker = computed(
  () => props.workers.find((w) => w.id === props.selectedWorkerId) ?? null,
)
</script>

<template>
  <div class="space-y-8">
    <!-- Worker selection -->
    <div>
      <h2 class="font-display text-xl text-primary mb-1">{{ $t('bookingStep.chooseProfessional') }}</h2>
      <p class="text-secondary text-sm mb-4">{{ $t('bookingStep.chooseProfessionalSubtitle') }}</p>

      <!-- Skeleton while workers are loading. -->
      <div v-if="loadingWorkers" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div v-for="n in 3" :key="n" class="card text-center space-y-2">
          <UiSkeleton height="h-12" class="w-12 rounded-full mx-auto" />
          <UiSkeleton height="h-4" class="w-24 mx-auto" />
        </div>
      </div>

      <!-- Empty state. -->
      <p v-else-if="workers.length === 0" class="text-muted text-sm">
        {{ $t('bookingStep.noProfessionals') }}
      </p>

      <!-- Worker cards. -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          v-for="worker in workers"
          :key="worker.id"
          type="button"
          class="card flex flex-col items-center text-center gap-2 p-3 transition-all
                 hover:border-gold-500/50 cursor-pointer"
          :class="selectedWorkerId === worker.id
            ? 'border-gold-500 shadow-gold'
            : 'border-border'"
          @click="emit('select-worker', worker.id)"
        >
          <!-- Initial avatar. -->
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center
                   font-display font-bold text-gold-400 bg-gold-500/10 border border-gold-500/20"
          >
            {{ worker.name.charAt(0).toUpperCase() }}
          </div>
          <span class="text-sm text-primary font-medium leading-tight">{{ worker.name }}</span>
          <span class="text-xs text-muted">{{ worker.position }}</span>
          <SharedStarRating
            :rating="ratings?.[worker.id]?.averageRating ?? 0"
            :count="ratings?.[worker.id]?.reviewCount ?? 0"
          />
        </button>
      </div>
    </div>

    <!-- Date picker — only visible once a worker is selected. -->
    <div v-if="selectedWorker">
      <h3 class="font-display text-lg text-primary mb-1">{{ $t('bookingStep.chooseDate') }}</h3>
      <p class="text-secondary text-sm mb-3">{{ $t('bookingStep.chooseDateSubtitle') }}</p>
      <label for="booking-date" class="sr-only">{{ $t('bookingStep.appointmentDate') }}</label>
      <input
        id="booking-date"
        type="date"
        :min="todayIso"
        :value="selectedDate"
        autocomplete="off"
        class="input w-48"
        @change="emit('select-date', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Time slots — only visible once a date is selected. -->
    <div v-if="selectedDate && selectedWorker">
      <h3 class="font-display text-lg text-primary mb-1">{{ $t('bookingStep.chooseTime') }}</h3>

      <!-- Schedule is still loading. -->
      <div v-if="loadingSchedule" class="flex flex-wrap gap-2 mt-3">
        <UiSkeleton v-for="n in 6" :key="n" height="h-9" class="w-16" />
      </div>

      <!-- Day is not in the shop's schedule or is marked closed. -->
      <p v-else-if="dayIsClosed" class="text-yellow-400 text-sm mt-2">
        {{ $t('bookingStep.closedOnThisDay') }}
      </p>

      <!-- Open day, but every slot is taken — offer a waitlist instead. -->
      <div v-else-if="dayIsFullyBooked" class="mt-2 space-y-2">
        <p class="text-muted text-sm">
          {{ $t('bookingStep.fullyBookedOnThisDay') }}
        </p>
        <p v-if="onWaitlist" class="text-emerald-400 text-sm">
          {{ $t('booking.joinedWaitlist') }}
        </p>
        <button
          v-else
          type="button"
          class="btn-outline text-sm"
          :disabled="joiningWaitlist"
          @click="emit('join-waitlist')"
        >
          {{ joiningWaitlist ? $t('bookingStep.joining') : $t('bookingStep.notifyMe') }}
        </button>
      </div>

      <!-- Time slot buttons. -->
      <div v-else class="flex flex-wrap gap-2 mt-3">
        <button
          v-for="slot in timeSlots"
          :key="slot"
          type="button"
          class="px-3 py-1.5 rounded font-mono text-sm border transition-all"
          :class="selectedTime === slot
            ? 'border-gold-500 bg-gold-500/10 text-gold-400'
            : 'border-border text-secondary hover:border-gold-500/40'"
          @click="emit('select-time', slot)"
        >
          {{ slot }}
        </button>
      </div>
    </div>
  </div>
</template>
