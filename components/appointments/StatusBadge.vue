<script setup lang="ts">
// Displays a coloured badge for a given AppointmentStatus value.
import { AppointmentStatus } from '~/types'

// The numeric status value from the Appointment record.
const props = defineProps<{ status: AppointmentStatus }>()

// Badge class and label keyed by status value.
const config: Record<AppointmentStatus, { cls: string; label: string }> = {
  [AppointmentStatus.Scheduled]: { cls: 'badge-blue', label: 'Scheduled' },
  [AppointmentStatus.OnGoing]: { cls: 'badge-yellow', label: 'On Going' },
  [AppointmentStatus.Completed]: { cls: 'badge-green', label: 'Completed' },
  [AppointmentStatus.Cancelled]: { cls: 'badge-gray', label: 'Cancelled' },
  [AppointmentStatus.Deleted]: { cls: 'badge-red', label: 'Deleted' },
}

// Resolves the config entry; falls back gracefully for unknown values.
const current = computed(() => config[props.status] ?? { cls: 'badge-gray', label: 'Unknown' })
</script>

<template>
  <span class="badge" :class="current.cls">{{ current.label }}</span>
</template>
