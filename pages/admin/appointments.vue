<script setup lang="ts">
// Admin appointments management page.
// Provides a filterable table, batch delay/cancel, and create/edit modal.
// See sprint plan S2.2 for the full spec.
import dayjs from 'dayjs'
import { AppointmentStatus } from '~/types'
import type { Appointment, AppointmentRequest } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

// ── Stores ─────────────────────────────────────────────────────────────────

const appointmentsStore = useAppointmentsStore()
const workersStore = useWorkersStore()
const customersStore = useCustomersStore()
const servicesStore = useServicesStore()

const { items, loading } = storeToRefs(appointmentsStore)

// ── Filter state ───────────────────────────────────────────────────────────

// Free-text search applied across customerName, workerName, serviceName.
const searchQuery = ref('')

// Status filter; empty string means "show all".
const statusFilter = ref<string>('')

// Worker filter; 0 means "show all".
const workerFilter = ref<number>(0)

// Date range filters; empty string means no boundary.
const dateStart = ref('')
const dateEnd = ref('')

// Computed list after all active filters are applied.
const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return items.value.filter((a) => {
    // Text match across three name fields.
    if (q && !a.customerName.toLowerCase().includes(q) &&
        !a.workerName.toLowerCase().includes(q) &&
        !a.serviceName.toLowerCase().includes(q)) return false

    // Status match.
    if (statusFilter.value !== '' && a.status !== Number(statusFilter.value)) return false

    // Worker match.
    if (workerFilter.value !== 0 && a.workerId !== workerFilter.value) return false

    // Date range lower bound.
    if (dateStart.value && dayjs(a.scheduledFor).isBefore(dayjs(dateStart.value))) return false

    // Date range upper bound.
    if (dateEnd.value && dayjs(a.scheduledFor).isAfter(dayjs(dateEnd.value).endOf('day'))) return false

    return true
  })
})

// ── Batch selection ─────────────────────────────────────────────────────────

// IDs of the currently selected rows.
const selected = ref<number[]>([])

// True when every filtered row is selected.
const allSelected = computed(() =>
  filtered.value.length > 0 && filtered.value.every((a) => selected.value.includes(a.id)),
)

// Toggles the select-all state based on current filter result.
function toggleAll(): void {
  if (allSelected.value) {
    selected.value = []
  } else {
    selected.value = filtered.value.map((a) => a.id)
  }
}

function toggleRow(id: number): void {
  if (selected.value.includes(id)) {
    selected.value = selected.value.filter((x) => x !== id)
  } else {
    selected.value = [...selected.value, id]
  }
}

// ── Create / Edit modal ────────────────────────────────────────────────────

const showModal = ref(false)

// The appointment being edited; null when creating a new one.
const editing = ref<Appointment | null>(null)

// Reactive form bound to the modal inputs.
const form = reactive<AppointmentRequest>({
  workerId: 0,
  customerId: 0,
  serviceId: 0,
  scheduledFor: '',
  status: AppointmentStatus.Scheduled,
  extraDetails: '',
})

const saving = ref(false)

// Opens the modal in create mode with a blank form.
function openCreate(): void {
  editing.value = null
  Object.assign(form, {
    workerId: 0,
    customerId: 0,
    serviceId: 0,
    scheduledFor: '',
    status: AppointmentStatus.Scheduled,
    extraDetails: '',
  })
  showModal.value = true
}

// Opens the modal pre-filled with the given appointment's data.
function openEdit(a: Appointment): void {
  editing.value = a
  Object.assign(form, {
    workerId: a.workerId,
    customerId: a.customerId,
    serviceId: a.serviceId,
    scheduledFor: a.scheduledFor.slice(0, 16),
    status: a.status,
    extraDetails: a.extraDetails ?? '',
  })
  showModal.value = true
}

// Validates required fields before submitting.
const formValid = computed(
  () => form.workerId > 0 && form.customerId > 0 && form.serviceId > 0 && form.scheduledFor !== '',
)

async function saveAppointment(): Promise<void> {
  if (!formValid.value) return
  saving.value = true
  const ok = editing.value
    ? await appointmentsStore.update(editing.value.id, { ...form })
    : await appointmentsStore.create({ ...form })
  saving.value = false
  if (ok) {
    showModal.value = false
    await appointmentsStore.fetchAll()
  }
}

// ── Delay modal ─────────────────────────────────────────────────────────────

const showDelayModal = ref(false)
const delayMinutes = ref(30)
const delaying = ref(false)

async function confirmDelay(): Promise<void> {
  delaying.value = true
  const ok = await appointmentsStore.delayMany([...selected.value], delayMinutes.value)
  delaying.value = false
  if (ok) {
    showDelayModal.value = false
    selected.value = []
    await appointmentsStore.fetchAll()
  }
}

// ── Cancel confirmation ────────────────────────────────────────────────────

const showCancelDialog = ref(false)
const cancelTarget = ref<Appointment | null>(null)

function promptCancel(a: Appointment): void {
  cancelTarget.value = a
  showCancelDialog.value = true
}

async function confirmCancel(): Promise<void> {
  if (!cancelTarget.value) return
  const ok = await appointmentsStore.remove(cancelTarget.value.id)
  if (ok) {
    showCancelDialog.value = false
    cancelTarget.value = null
    await appointmentsStore.fetchAll()
  }
}

// ── Batch cancel ────────────────────────────────────────────────────────────

const showBatchCancelDialog = ref(false)
const cancelling = ref(false)

async function confirmBatchCancel(): Promise<void> {
  cancelling.value = true
  const ok = await appointmentsStore.cancelMany([...selected.value])
  cancelling.value = false
  if (ok) {
    showBatchCancelDialog.value = false
    selected.value = []
    await appointmentsStore.fetchAll()
  }
}

// ── Lifecycle ───────────────────────────────────────────────────────────────

// Load all data in parallel on mount; subscribe to real-time updates.
let unsubscribe: (() => void) | null = null

onMounted(async () => {
  await Promise.all([
    appointmentsStore.fetchAll(),
    workersStore.fetchAll(),
    customersStore.fetchAll(),
    servicesStore.fetchAll(),
  ])
  unsubscribe = appointmentsStore.subscribeRealtime()
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <h1 class="font-display text-2xl text-primary">Appointments</h1>
      <button class="btn-primary btn-sm" @click="openCreate">
        <SidebarIcon icon="plus" class="w-4 h-4" />
        New appointment
      </button>
    </div>

    <!-- Filter bar -->
    <div class="card flex flex-wrap gap-3">
      <!-- Text search -->
      <div class="relative flex-1 min-w-[180px]">
        <SidebarIcon icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          v-model="searchQuery"
          class="input pl-9"
          type="search"
          placeholder="Search customer, worker, service…"
          autocomplete="off"
        >
      </div>

      <!-- Status filter -->
      <select v-model="statusFilter" class="input w-40">
        <option value="">All statuses</option>
        <option value="0">Scheduled</option>
        <option value="1">On Going</option>
        <option value="2">Completed</option>
        <option value="3">Cancelled</option>
        <option value="4">Deleted</option>
      </select>

      <!-- Worker filter -->
      <select v-model="workerFilter" class="input w-44">
        <option :value="0">All workers</option>
        <option v-for="w in workersStore.items" :key="w.id" :value="w.id">{{ w.name }}</option>
      </select>

      <!-- Date range -->
      <div class="flex items-center gap-2">
        <label class="label whitespace-nowrap">From</label>
        <input v-model="dateStart" class="input w-36" type="date">
        <label class="label whitespace-nowrap">To</label>
        <input v-model="dateEnd" class="input w-36" type="date">
      </div>
    </div>

    <!-- Batch action bar (slides in when rows are selected) -->
    <Transition name="slide-up">
      <div v-if="selected.length > 0" class="surface raised rounded-lg px-4 py-3 flex items-center gap-4">
        <span class="text-sm text-secondary font-mono">{{ selected.length }} selected</span>
        <button class="btn-outline btn-sm" @click="showDelayModal = true">
          <SidebarIcon icon="clock" class="w-4 h-4" />
          Delay
        </button>
        <button class="btn-danger btn-sm" @click="showBatchCancelDialog = true">
          <SidebarIcon icon="x" class="w-4 h-4" />
          Cancel all
        </button>
        <button class="btn-ghost btn-sm ml-auto" @click="selected = []">Clear</button>
      </div>
    </Transition>

    <!-- Appointments table -->
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <!-- Select-all checkbox -->
            <th class="w-10">
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="selected.length > 0 && !allSelected"
                class="accent-gold-500 w-4 h-4 cursor-pointer"
                @change="toggleAll"
              >
            </th>
            <th>Customer</th>
            <th>Worker</th>
            <th>Service</th>
            <th>Scheduled</th>
            <th>Status</th>
            <th class="w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Skeleton rows while loading -->
          <template v-if="loading">
            <tr v-for="i in 6" :key="i">
              <td colspan="7"><UiSkeleton height="h-12" /></td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else-if="filtered.length === 0">
            <td colspan="7" class="text-center text-muted py-12">No appointments found</td>
          </tr>

          <!-- Data rows -->
          <tr v-for="a in filtered" v-else :key="a.id">
            <td>
              <input
                type="checkbox"
                :checked="selected.includes(a.id)"
                class="accent-gold-500 w-4 h-4 cursor-pointer"
                @change="toggleRow(a.id)"
              >
            </td>
            <td>{{ a.customerName }}</td>
            <td>{{ a.workerName }}</td>
            <td>{{ a.serviceName }}</td>
            <td class="font-mono text-sm">{{ dayjs(a.scheduledFor).format('MMM DD, HH:mm') }}</td>
            <td><AppointmentsStatusBadge :status="a.status" /></td>
            <td>
              <div class="flex gap-1">
                <button class="btn-icon btn-ghost" aria-label="Edit appointment" @click="openEdit(a)">
                  <SidebarIcon icon="edit" class="w-4 h-4" />
                </button>
                <button class="btn-icon btn-ghost text-red-400" aria-label="Cancel appointment" @click="promptCancel(a)">
                  <SidebarIcon icon="trash" class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / Edit modal -->
    <UiModal v-model="showModal" :title="editing ? 'Edit appointment' : 'New appointment'" size="md">
      <form class="space-y-4" @submit.prevent="saveAppointment">
        <!-- Customer select -->
        <div class="form-group">
          <label class="label" for="appt-customer">Customer</label>
          <select id="appt-customer" v-model="form.customerId" class="input" autocomplete="off" required>
            <option :value="0" disabled>Select customer…</option>
            <option v-for="c in customersStore.items" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <!-- Worker select -->
        <div class="form-group">
          <label class="label" for="appt-worker">Worker</label>
          <select id="appt-worker" v-model="form.workerId" class="input" autocomplete="off" required>
            <option :value="0" disabled>Select worker…</option>
            <option v-for="w in workersStore.items" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>

        <!-- Service select -->
        <div class="form-group">
          <label class="label" for="appt-service">Service</label>
          <select id="appt-service" v-model="form.serviceId" class="input" autocomplete="off" required>
            <option :value="0" disabled>Select service…</option>
            <option v-for="s in servicesStore.items" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <!-- Date & time -->
        <div class="form-group">
          <label class="label" for="appt-date">Date & time</label>
          <input id="appt-date" v-model="form.scheduledFor" class="input" type="datetime-local" autocomplete="off" required>
        </div>

        <!-- Status (edit only) -->
        <div v-if="editing" class="form-group">
          <label class="label" for="appt-status">Status</label>
          <select id="appt-status" v-model="form.status" class="input" autocomplete="off">
            <option :value="AppointmentStatus.Scheduled">Scheduled</option>
            <option :value="AppointmentStatus.OnGoing">On Going</option>
            <option :value="AppointmentStatus.Completed">Completed</option>
            <option :value="AppointmentStatus.Cancelled">Cancelled</option>
          </select>
        </div>

        <!-- Extra details -->
        <div class="form-group">
          <label class="label" for="appt-details">Extra details</label>
          <textarea id="appt-details" v-model="form.extraDetails" class="input" rows="3" autocomplete="off" />
        </div>
      </form>

      <template #footer>
        <button class="btn-ghost btn-sm" @click="showModal = false">Cancel</button>
        <button
          class="btn-primary btn-sm"
          :disabled="!formValid || saving"
          @click="saveAppointment"
        >
          <span v-if="saving" class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin" />
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </template>
    </UiModal>

    <!-- Delay modal -->
    <UiModal v-model="showDelayModal" title="Delay appointments" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-secondary">
          Shift {{ selected.length }} selected appointment(s) forward by:
        </p>
        <div class="form-group">
          <label class="label" for="delay-minutes">Minutes (5–480)</label>
          <input
            id="delay-minutes"
            v-model.number="delayMinutes"
            class="input"
            type="number"
            min="5"
            max="480"
            autocomplete="off"
          >
        </div>
      </div>

      <template #footer>
        <button class="btn-ghost btn-sm" @click="showDelayModal = false">Cancel</button>
        <button class="btn-primary btn-sm" :disabled="delaying" @click="confirmDelay">
          <span v-if="delaying" class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin" />
          {{ delaying ? 'Delaying…' : 'Confirm' }}
        </button>
      </template>
    </UiModal>

    <!-- Single cancel confirmation -->
    <UiConfirmDialog
      v-model="showCancelDialog"
      title="Cancel appointment"
      :message="cancelTarget
        ? `This will cancel ${cancelTarget.customerName}'s appointment with ${cancelTarget.workerName}.`
        : ''"
      confirm-label="Cancel appointment"
      :dangerous="true"
      @confirm="confirmCancel"
    />

    <!-- Batch cancel confirmation -->
    <UiConfirmDialog
      v-model="showBatchCancelDialog"
      title="Cancel all selected"
      :message="`This will cancel ${selected.length} appointment(s). This action cannot be undone.`"
      confirm-label="Cancel all"
      :dangerous="true"
      @confirm="confirmBatchCancel"
    />
  </div>
</template>
