<script setup lang="ts">
// Worker portal: shows all appointments for the logged-in worker, split into
// four status categories and filtered by calendar period.
// Categories are ordered closest-to-now first (upcoming ASC, past DESC).
import type { Appointment } from '~/types'
import { AppointmentStatus } from '~/types'
import { isInDateRange, byProximityToNow } from '~/utils/appointmentFilters'
import type { DateFilter } from '~/utils/appointmentFilters'

definePageMeta({ layout: 'default', middleware: 'auth' })

const { api } = useApi()
const toast = useToast()
const { userId } = useAuth()
const { onAppointmentsChanged } = useSignalR()

// ── State ─────────────────────────────────────────────────────────────────────

const appointments = ref<Appointment[]>([])
const pageLoading = ref(true)
const noProfile = ref(false)

// Resolved once from /users/me, then reused by the SignalR refetch below so a
// live update doesn't have to re-resolve the profile.
const workerId = ref<number | null>(null)

// Active date-range filter — 'all' shows every appointment.
const filter = ref<DateFilter>('all')

// ── Derived categories ────────────────────────────────────────────────────────

// Keeps only appointments whose scheduledFor falls inside the selected period.
const filtered = computed(() =>
  appointments.value.filter((a) => isInDateRange(a.scheduledFor, filter.value)),
)

// Upcoming: Scheduled status with a future scheduledFor. Sorted nearest first.
const upcoming = computed(() =>
  filtered.value
    .filter(
      (a) =>
        a.status === AppointmentStatus.Scheduled && new Date(a.scheduledFor) > new Date(),
    )
    .sort((a, b) => byProximityToNow(a, b, 'asc')),
)

// Ongoing: any appointment currently in the OnGoing state. Sorted by start ASC.
const ongoing = computed(() =>
  filtered.value
    .filter((a) => a.status === AppointmentStatus.OnGoing)
    .sort((a, b) => byProximityToNow(a, b, 'asc')),
)

// Completed: finished appointments. Most recent first.
const completed = computed(() =>
  filtered.value
    .filter((a) => a.status === AppointmentStatus.Completed)
    .sort((a, b) => byProximityToNow(a, b, 'desc')),
)

// Cancelled / deleted: dismissed appointments. Most recent first.
const cancelled = computed(() =>
  filtered.value
    .filter(
      (a) =>
        a.status === AppointmentStatus.Cancelled || a.status === AppointmentStatus.Deleted,
    )
    .sort((a, b) => byProximityToNow(a, b, 'desc')),
)

// ── Worker actions (start / complete / no-show) ─────────────────────────────────

// ID of the appointment whose status change is currently in flight.
const updatingId = ref<number | null>(null)

// Transitions an appointment to a new status via the worker-scoped endpoint
// and reflects the change locally so the columns re-sort immediately.
async function changeStatus(id: number, status: AppointmentStatus, label: string): Promise<void> {
  updatingId.value = id
  try {
    await api.appointments.changeStatus(id, status)
    const appt = appointments.value.find((a) => a.id === id)
    if (appt) appt.status = status
    toast.success(label)
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: string } }).response?.data ?? 'Could not update appointment'
    toast.error(typeof msg === 'string' ? msg : 'Could not update appointment')
  } finally {
    updatingId.value = null
  }
}

const startAppointment = (id: number) =>
  changeStatus(id, AppointmentStatus.OnGoing, 'Appointment started')
const completeAppointment = (id: number) =>
  changeStatus(id, AppointmentStatus.Completed, 'Appointment completed')
const noShowAppointment = (id: number) =>
  changeStatus(id, AppointmentStatus.Cancelled, 'Marked as no-show')

// ── Data loading ──────────────────────────────────────────────────────────────

// Silent refetch of this worker's appointments — no skeleton, so a live
// SignalR push doesn't flash the whole page. A background-refresh failure is
// swallowed rather than disrupting the view the worker is already looking at.
async function loadAppointments(): Promise<void> {
  if (!workerId.value) return
  try {
    appointments.value = await api.appointments.byWorker(workerId.value)
  } catch {
    // Keep the current list on a transient refresh error.
  }
}

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  if (!userId.value) { pageLoading.value = false; noProfile.value = true; return }

  try {
    // Resolve the workerId linked to this account via /users/me — the
    // admin-only /users/{id} endpoint 403s for workers.
    const user = await api.users.me()
    if (!user.workerId) { noProfile.value = true; return }

    workerId.value = user.workerId
    appointments.value = await api.appointments.byWorker(user.workerId)
  } catch {
    toast.error('Failed to load your schedule. Please try again.')
  } finally {
    pageLoading.value = false
  }

  // Live-update the schedule when the appointments hub pushes a change — a
  // client booking, rescheduling or cancelling a slot with this worker.
  // (The backend broadcasts AppointmentsChanged on every appointment mutation.)
  unsubscribe = onAppointmentsChanged(loadAppointments)
})

onUnmounted(() => unsubscribe?.())
</script>

<template>
  <div class="min-h-screen">
    <LayoutPublicNavbar />

    <div class="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <!-- Page header + filter bar. -->
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="font-display text-3xl text-primary">My Schedule</h1>
          <p class="text-secondary text-sm mt-1">Your appointments across all statuses.</p>
        </div>
        <SharedDateRangeFilter v-if="!pageLoading && !noProfile" v-model="filter" />
      </div>

      <!-- Loading skeleton. -->
      <div v-if="pageLoading" class="space-y-4">
        <UiSkeleton height="h-24" />
        <UiSkeleton height="h-24" />
        <UiSkeleton height="h-24" />
      </div>

      <!-- Not a worker. -->
      <div v-else-if="noProfile" class="card text-center py-12">
        <p class="text-muted">No worker profile is linked to your account.</p>
        <NuxtLink to="/" class="btn-ghost mt-4 inline-block">Back to home</NuxtLink>
      </div>

      <!-- Appointment grid: left column = active, right column = history. -->
      <template v-else>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left: Upcoming + Ongoing. -->
          <div class="space-y-6">
            <!-- Upcoming section. -->
            <section>
              <div class="flex items-center gap-2 mb-3">
                <h2 class="font-display text-lg text-primary">Upcoming</h2>
                <span class="badge badge-blue text-xs">{{ upcoming.length }}</span>
              </div>
              <p v-if="upcoming.length === 0" class="text-muted text-sm">No upcoming appointments.</p>
              <div v-else class="space-y-3">
                <ClientAppointmentCard
                  v-for="appt in upcoming"
                  :key="appt.id"
                  :appointment="appt"
                  :can-cancel="false"
                  :cancelling="false"
                >
                  <template #actions>
                    <button
                      type="button"
                      class="btn-primary text-xs py-1 px-3 disabled:opacity-50"
                      :disabled="updatingId === appt.id"
                      @click="startAppointment(appt.id)"
                    >
                      Start
                    </button>
                    <button
                      type="button"
                      class="text-xs py-1 px-3 rounded text-red-400 hover:text-red-300 disabled:opacity-50"
                      :disabled="updatingId === appt.id"
                      @click="noShowAppointment(appt.id)"
                    >
                      No-show
                    </button>
                  </template>
                </ClientAppointmentCard>
              </div>
            </section>

            <!-- Ongoing section. -->
            <section>
              <div class="flex items-center gap-2 mb-3">
                <h2 class="font-display text-lg text-primary">Ongoing</h2>
                <span class="badge badge-yellow text-xs">{{ ongoing.length }}</span>
              </div>
              <p v-if="ongoing.length === 0" class="text-muted text-sm">Nothing in progress right now.</p>
              <div v-else class="space-y-3">
                <ClientAppointmentCard
                  v-for="appt in ongoing"
                  :key="appt.id"
                  :appointment="appt"
                  :can-cancel="false"
                  :cancelling="false"
                >
                  <template #actions>
                    <button
                      type="button"
                      class="btn-primary text-xs py-1 px-3 disabled:opacity-50"
                      :disabled="updatingId === appt.id"
                      @click="completeAppointment(appt.id)"
                    >
                      Complete
                    </button>
                  </template>
                </ClientAppointmentCard>
              </div>
            </section>
          </div>

          <!-- Right: Completed + Cancelled. -->
          <div class="space-y-6">
            <!-- Completed section. -->
            <section>
              <div class="flex items-center gap-2 mb-3">
                <h2 class="font-display text-lg text-primary">Completed</h2>
                <span class="badge badge-green text-xs">{{ completed.length }}</span>
              </div>
              <p v-if="completed.length === 0" class="text-muted text-sm">No completed appointments.</p>
              <div v-else class="space-y-3">
                <ClientAppointmentCard
                  v-for="appt in completed"
                  :key="appt.id"
                  :appointment="appt"
                  :can-cancel="false"
                  :cancelling="false"
                />
              </div>
            </section>

            <!-- Cancelled section. -->
            <section>
              <div class="flex items-center gap-2 mb-3">
                <h2 class="font-display text-lg text-primary">Cancelled</h2>
                <span class="badge badge-gray text-xs">{{ cancelled.length }}</span>
              </div>
              <p v-if="cancelled.length === 0" class="text-muted text-sm">No cancelled appointments.</p>
              <div v-else class="space-y-3">
                <ClientAppointmentCard
                  v-for="appt in cancelled"
                  :key="appt.id"
                  :appointment="appt"
                  :can-cancel="false"
                  :cancelling="false"
                />
              </div>
            </section>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
