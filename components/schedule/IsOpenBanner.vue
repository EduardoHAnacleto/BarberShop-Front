<script setup lang="ts">
// Displays real-time shop open/closed status by polling the API every 5 minutes.
// Emits no events — purely presentational with its own data lifecycle.
import type { BusinessSchedule } from '~/types'

const { api } = useApi()

// null indicates the first fetch has not completed yet (show skeleton).
const isOpen = ref<boolean | null>(null)
const scheduleToday = ref<BusinessSchedule | null>(null)

// Fetches both the open-state flag and today's schedule for the time text.
async function checkStatus(): Promise<void> {
  try {
    const now = new Date().toISOString()
    const result = await api.schedule.isOpen(now)
    isOpen.value = result.isOpen

    // Fetch today's schedule so we can display open/close times.
    const dayOfWeek = new Date().getDay()
    scheduleToday.value = await api.schedule.getByDay(dayOfWeek)
  } catch {
    // Fail silently — the banner remains in its current state.
  }
}

// Strips the seconds portion from a TimeSpan string (HH:mm:ss → HH:mm).
function fmtTime(t: string | undefined): string {
  return t ? t.slice(0, 5) : ''
}

let intervalId: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // Initial check immediately, then repeat every 5 minutes.
  checkStatus()
  intervalId = setInterval(checkStatus, 5 * 60 * 1_000)
})

onUnmounted(() => {
  // Always clear the interval to prevent memory leaks.
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
})
</script>

<template>
  <!-- Inline flex container — the parent controls layout/alignment. -->
  <div class="flex items-center gap-3">
    <!-- Loading skeleton while the first fetch is in-flight. -->
    <template v-if="isOpen === null">
      <UiSkeleton height="h-7" class="w-28" />
    </template>

    <!-- Open state: green badge + closing time. -->
    <template v-else-if="isOpen">
      <span class="badge badge-green">Open Now</span>
      <span v-if="scheduleToday?.closeTime" class="text-sm text-secondary">
        Closes at {{ fmtTime(scheduleToday.closeTime) }}
      </span>
    </template>

    <!-- Closed state: red badge + next opening time. -->
    <template v-else>
      <span class="badge badge-red">Closed</span>
      <span v-if="scheduleToday?.openTime" class="text-sm text-secondary">
        Opens at {{ fmtTime(scheduleToday.openTime) }}
      </span>
      <span v-else class="text-sm text-secondary">Check back later</span>
    </template>
  </div>
</template>
