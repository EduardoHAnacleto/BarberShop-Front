<script setup lang="ts">
// Admin layout. Wraps all /admin/* pages with the sidebar, sticky header,
// and real-time SignalR connections for all five hubs.
import dayjs from 'dayjs'

const { connect, disconnectAll, isConnected } = useSignalR()

// Hub names that must be connected while any admin page is mounted.
const HUBS = ['appointments', 'workers', 'customers', 'services', 'users'] as const

// Connect all five hubs in parallel on mount so real-time updates are active
// from the moment the first admin page loads.
onMounted(async () => {
  await Promise.all(HUBS.map((hub) => connect(hub)))
})

// Disconnect all hubs when navigating away from the admin section to free
// resources and stop unnecessary WebSocket traffic.
onUnmounted(() => {
  disconnectAll()
})

// Live timestamp shown in the header — refreshed every minute.
const currentDate = ref(dayjs().format('ddd, MMM DD YYYY'))
let dateInterval: ReturnType<typeof setInterval>

onMounted(() => {
  dateInterval = setInterval(() => {
    currentDate.value = dayjs().format('ddd, MMM DD YYYY')
  }, 60_000)
})

onUnmounted(() => {
  clearInterval(dateInterval)
})
</script>

<template>
  <!-- Side-by-side layout: fixed-width sidebar on the left, flex-column main on the right. -->
  <div class="flex min-h-screen">
    <LayoutAdminSidebar />

    <!-- Main content column: sticky header + scrollable page area. -->
    <div class="flex flex-col flex-1 min-w-0">
      <!-- Sticky header: SignalR status indicator and current date. -->
      <header
        class="h-14 flex items-center justify-between px-6 sticky top-0 z-10 bg-surface border-b border-subtle"
      >
        <!-- SignalR live / reconnecting indicator. -->
        <div
          data-testid="signalr-indicator"
          class="flex items-center gap-2 text-xs font-mono"
        >
          <!-- Green dot when connected; red animated dot when reconnecting. -->
          <span
            class="w-2 h-2 rounded-full"
            :class="isConnected ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'"
          />
          <span :class="isConnected ? 'text-emerald-400' : 'text-red-400'">
            {{ isConnected ? 'Live' : 'Reconnecting...' }}
          </span>
        </div>

        <!-- Current date in human-readable format. -->
        <span class="text-xs text-muted font-mono">{{ currentDate }}</span>
      </header>

      <!-- Scrollable page content area. -->
      <main class="flex-1 p-6 overflow-auto">
        <slot />
      </main>
    </div>

    <!-- Global toasts — ToastContainer uses Teleport to body internally. -->
    <UiToastContainer />
  </div>
</template>
