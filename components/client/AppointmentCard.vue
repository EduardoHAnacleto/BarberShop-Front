<script setup lang="ts">
// Renders a single appointment in the client portal.
// Shows service, worker, date/time, status badge, and an optional cancel button.
import type { Appointment } from '~/types'
import { AppointmentStatus } from '~/types'
import dayjs from 'dayjs'

defineProps<{
  // The appointment to display.
  appointment: Appointment
  // When true, a "Cancel" button is rendered (active/upcoming appointments only).
  canCancel: boolean
  // True while a cancel request is in-flight for this card.
  cancelling: boolean
}>()

const emit = defineEmits<{
  // Fired when the user confirms they want to cancel this appointment.
  (e: 'cancel', id: number): void
}>()

// Formats an ISO date-time string as "Mon DD, YYYY at HH:mm".
function fmtDateTime(iso: string): string {
  return dayjs(iso).format('MMM DD, YYYY [at] HH:mm')
}

// Maps a numeric status to the badge CSS class and human-readable label.
function statusBadge(status: AppointmentStatus): { cls: string; label: string } {
  switch (status) {
    case AppointmentStatus.Scheduled: return { cls: 'badge-blue', label: 'Scheduled' }
    case AppointmentStatus.OnGoing:   return { cls: 'badge-yellow', label: 'On Going' }
    case AppointmentStatus.Completed: return { cls: 'badge-green', label: 'Completed' }
    case AppointmentStatus.Cancelled: return { cls: 'badge-gray', label: 'Cancelled' }
    default:                          return { cls: 'badge-red', label: 'Deleted' }
  }
}
</script>

<template>
  <div class="card flex flex-col gap-2">
    <!-- Service + status row. -->
    <div class="flex items-start justify-between gap-2">
      <div>
        <p class="text-primary font-medium">{{ appointment.serviceName }}</p>
        <p class="text-secondary text-sm">with {{ appointment.workerName }}</p>
      </div>
      <span class="badge shrink-0" :class="statusBadge(appointment.status).cls">
        {{ statusBadge(appointment.status).label }}
      </span>
    </div>

    <!-- Scheduled date and time. -->
    <p class="font-mono text-xs text-muted">{{ fmtDateTime(appointment.scheduledFor) }}</p>

    <!-- Cancel button — only rendered for upcoming Scheduled appointments. -->
    <button
      v-if="canCancel"
      type="button"
      class="self-start text-sm text-red-400 hover:text-red-300 transition-colors mt-1 disabled:opacity-50"
      :disabled="cancelling"
      @click="emit('cancel', appointment.id)"
    >
      {{ cancelling ? 'Cancelling…' : 'Cancel appointment' }}
    </button>
  </div>
</template>
