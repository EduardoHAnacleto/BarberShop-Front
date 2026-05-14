<script setup lang="ts">
// Admin dashboard. KPI cards, shop status badge, two charts and two tables.
// See sprint plan S4.2 for the full spec.
import dayjs from 'dayjs'
import type { Appointment } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

// ── Stores ─────────────────────────────────────────────────────────────────

const appointmentsStore = useAppointmentsStore()
const workersStore = useWorkersStore()
const customersStore = useCustomersStore()
const scheduleStore = useScheduleStore()

const { items: appointments, loading: apptLoading, scheduled, ongoing, todayItems } = storeToRefs(appointmentsStore)
const { items: workers, loading: workersLoading } = storeToRefs(workersStore)
const { items: customers, loading: customersLoading } = storeToRefs(customersStore)

// ── Shop open / closed banner ──────────────────────────────────────────────

const isOpen = ref<boolean | null>(null)

async function refreshOpenStatus(): Promise<void> {
  isOpen.value = await scheduleStore.checkIsOpen(new Date().toISOString())
}

// ── Today's appointments — sorted by scheduledFor ASC ──────────────────────

const todaySorted = computed(() =>
  [...todayItems.value].sort(
    (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
  ),
)

// ── Recent activity — newest 8 by createdAt ────────────────────────────────

const recentActivity = computed(() =>
  [...appointments.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8),
)

// Aggregate loading flag — drives KPI skeletons. Charts and tables tolerate
// empty arrays already, so they render their own empty states.
const loading = computed(() => apptLoading.value || workersLoading.value || customersLoading.value)

// ── Display helpers ────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  return dayjs(iso).format('HH:mm')
}

function fmtDate(iso: string): string {
  return dayjs(iso).format('MMM DD, YYYY')
}

// Maps a numeric status to its badge + label, mirroring StatusBadge but inline
// so the dashboard renders without an extra component round-trip.
function statusBadge(status: Appointment['status']): { cls: string; label: string } {
  switch (status) {
    case 0:
      return { cls: 'badge-blue', label: 'Scheduled' }
    case 1:
      return { cls: 'badge-yellow', label: 'On Going' }
    case 2:
      return { cls: 'badge-green', label: 'Completed' }
    case 3:
      return { cls: 'badge-gray', label: 'Cancelled' }
    default:
      return { cls: 'badge-red', label: 'Deleted' }
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────

let unsubAppointments: (() => void) | null = null
let unsubWorkers: (() => void) | null = null
let unsubCustomers: (() => void) | null = null

onMounted(async () => {
  await Promise.all([
    appointmentsStore.fetchAll(),
    workersStore.fetchAll(),
    customersStore.fetchAll(),
    refreshOpenStatus(),
  ])
  // Real-time KPI updates: when appointments/workers/customers change,
  // the stores fetchAll() automatically; computeds refresh.
  unsubAppointments = appointmentsStore.subscribeRealtime()
  unsubWorkers = workersStore.subscribeRealtime()
  unsubCustomers = customersStore.subscribeRealtime()
})

onUnmounted(() => {
  unsubAppointments?.()
  unsubWorkers?.()
  unsubCustomers?.()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header: title + shop status badge -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl text-primary">Dashboard</h1>
        <p class="text-secondary text-sm">Snapshot of today's barbershop activity.</p>
      </div>
      <span
        v-if="isOpen !== null"
        class="badge"
        :class="isOpen ? 'badge-green' : 'badge-red'"
      >
        {{ isOpen ? 'Shop Open' : 'Shop Closed' }}
      </span>
    </div>

    <!-- KPI cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      <div class="card">
        <p class="text-xs text-muted font-mono uppercase tracking-wider">Today</p>
        <p v-if="loading" class="mt-2"><UiSkeleton height="h-8" class="w-10" /></p>
        <p v-else class="mt-1 font-display text-3xl text-gold-400">{{ todayItems.length }}</p>
      </div>

      <div class="card">
        <p class="text-xs text-muted font-mono uppercase tracking-wider">Scheduled</p>
        <p v-if="loading" class="mt-2"><UiSkeleton height="h-8" class="w-10" /></p>
        <p v-else class="mt-1 font-display text-3xl text-blue-400">{{ scheduled.length }}</p>
      </div>

      <div class="card">
        <p class="text-xs text-muted font-mono uppercase tracking-wider">On Going</p>
        <p v-if="loading" class="mt-2"><UiSkeleton height="h-8" class="w-10" /></p>
        <p v-else class="mt-1 font-display text-3xl text-yellow-400">{{ ongoing.length }}</p>
      </div>

      <div class="card">
        <p class="text-xs text-muted font-mono uppercase tracking-wider">Workers</p>
        <p v-if="loading" class="mt-2"><UiSkeleton height="h-8" class="w-10" /></p>
        <p v-else class="mt-1 font-display text-3xl text-emerald-400">{{ workers.length }}</p>
      </div>

      <div class="card">
        <p class="text-xs text-muted font-mono uppercase tracking-wider">Customers</p>
        <p v-if="loading" class="mt-2"><UiSkeleton height="h-8" class="w-10" /></p>
        <p v-else class="mt-1 font-display text-3xl text-violet-400">{{ customers.length }}</p>
      </div>
    </div>

    <!-- Charts row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DashboardAppointmentsByDayChart :appointments="appointments" />
      <DashboardServiceDistributionChart :appointments="appointments" />
    </div>

    <!-- Tables row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Today's appointments -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-display text-lg text-primary">Today's appointments</h3>
          <NuxtLink to="/admin/appointments" class="text-xs text-gold-400 hover:underline">
            View all →
          </NuxtLink>
        </div>

        <div v-if="todaySorted.length === 0" class="text-center text-muted py-6 text-sm">
          No appointments scheduled for today.
        </div>

        <table v-else class="table">
          <thead>
            <tr>
              <th class="w-20">Time</th>
              <th>Customer</th>
              <th>Worker</th>
              <th>Service</th>
              <th class="w-28">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in todaySorted" :key="a.id">
              <td class="font-mono text-sm text-secondary">{{ fmtTime(a.scheduledFor) }}</td>
              <td class="text-primary">{{ a.customerName }}</td>
              <td class="text-secondary">{{ a.workerName }}</td>
              <td class="text-secondary">{{ a.serviceName }}</td>
              <td><span class="badge" :class="statusBadge(a.status).cls">{{ statusBadge(a.status).label }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Recent activity -->
      <div class="card">
        <h3 class="font-display text-lg text-primary mb-3">Recent activity</h3>

        <div v-if="recentActivity.length === 0" class="text-center text-muted py-6 text-sm">
          No appointments yet.
        </div>

        <table v-else class="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Service</th>
              <th>Date</th>
              <th class="w-28">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in recentActivity" :key="a.id">
              <td class="text-primary">{{ a.customerName }}</td>
              <td class="text-secondary">{{ a.serviceName }}</td>
              <td class="text-secondary font-mono text-sm">{{ fmtDate(a.createdAt) }}</td>
              <td><span class="badge" :class="statusBadge(a.status).cls">{{ statusBadge(a.status).label }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
