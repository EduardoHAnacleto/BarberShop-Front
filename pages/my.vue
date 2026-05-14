<script setup lang="ts">
// Client portal: profile editor + split-view appointment history.
// Left column: upcoming and ongoing appointments (can be cancelled).
// Right column: past appointments (completed, cancelled, etc.).
import type { Customer, Appointment } from '~/types'
import { AppointmentStatus } from '~/types'

definePageMeta({ layout: 'default', middleware: 'auth' })

const { api } = useApi()
const toast = useToast()
const { userId } = useAuth()

// ── State ─────────────────────────────────────────────────────────────────────

const customer = ref<Customer | null>(null)
const appointments = ref<Appointment[]>([])
const pageLoading = ref(true)
const noProfile = ref(false)

// ID of the appointment currently being cancelled (null = none in flight).
const cancellingId = ref<number | null>(null)

// ── Profile edit ──────────────────────────────────────────────────────────────

const editMode = ref(false)

// Edit form state — mirrors the customer fields.
const editForm = reactive({ name: '', email: '', phoneNumber: '' })

function openEdit(): void {
  if (!customer.value) return
  editForm.name = customer.value.name
  editForm.email = customer.value.email
  editForm.phoneNumber = customer.value.phoneNumber
  editMode.value = true
}

function cancelEdit(): void {
  editMode.value = false
}

const saving = ref(false)

async function saveProfile(): Promise<void> {
  if (!customer.value) return
  saving.value = true
  try {
    const updated = await api.customers.update(customer.value.id, {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phoneNumber: editForm.phoneNumber.trim(),
    })
    customer.value = updated
    editMode.value = false
    toast.success('Profile updated')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: string } }).response?.data ?? 'Update failed'
    toast.error(typeof msg === 'string' ? msg : 'Update failed')
  } finally {
    saving.value = false
  }
}

// ── Appointment classification ────────────────────────────────────────────────

const now = new Date()

// Upcoming: Scheduled status with a future date, OR currently OnGoing.
const activeAppointments = computed(() =>
  appointments.value
    .filter(
      (a) =>
        a.status === AppointmentStatus.OnGoing ||
        (a.status === AppointmentStatus.Scheduled && new Date(a.scheduledFor) > now),
    )
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()),
)

// Past: completed, cancelled, deleted, or scheduled but date already passed.
const pastAppointments = computed(() =>
  appointments.value
    .filter(
      (a) =>
        a.status === AppointmentStatus.Completed ||
        a.status === AppointmentStatus.Cancelled ||
        a.status === AppointmentStatus.Deleted ||
        (a.status === AppointmentStatus.Scheduled && new Date(a.scheduledFor) <= now),
    )
    .sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime()),
)

// ── Cancel ────────────────────────────────────────────────────────────────────

async function cancelAppointment(id: number): Promise<void> {
  cancellingId.value = id
  try {
    await api.appointments.cancel([id])
    // Update the local appointment status so the UI reacts immediately.
    const appt = appointments.value.find((a) => a.id === id)
    if (appt) appt.status = AppointmentStatus.Cancelled
    toast.success('Appointment cancelled')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: string } }).response?.data ?? 'Could not cancel appointment'
    toast.error(typeof msg === 'string' ? msg : 'Could not cancel appointment')
  } finally {
    cancellingId.value = null
  }
}

// ── Data loading ──────────────────────────────────────────────────────────────

async function loadData(): Promise<void> {
  const uid = Number(userId.value)
  if (!uid) { pageLoading.value = false; noProfile.value = true; return }

  try {
    // Resolve the customerId linked to this user account.
    const user = await api.users.byId(uid)
    if (!user.customerId) { noProfile.value = true; return }

    // Fetch profile and appointments in parallel.
    const [cust, appts] = await Promise.all([
      api.customers.byId(user.customerId),
      api.appointments.byCustomer(user.customerId),
    ])
    customer.value = cust
    appointments.value = appts
  } catch {
    toast.error('Failed to load your profile. Please try again.')
  } finally {
    pageLoading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="min-h-screen">
    <LayoutPublicNavbar />

    <div class="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <!-- Page title. -->
      <div>
        <h1 class="font-display text-3xl text-primary">My Account</h1>
        <p class="text-secondary text-sm mt-1">Manage your profile and appointments.</p>
      </div>

      <!-- Loading skeleton. -->
      <div v-if="pageLoading" class="space-y-4">
        <UiSkeleton height="h-32" />
        <UiSkeleton height="h-64" />
      </div>

      <!-- No customer profile linked to this account. -->
      <div v-else-if="noProfile" class="card text-center py-12">
        <p class="text-muted">No customer profile is linked to this account.</p>
        <NuxtLink to="/book" class="btn-primary mt-4 inline-block">Book your first appointment</NuxtLink>
      </div>

      <template v-else-if="customer">
        <!-- ── Profile card ── -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display text-xl text-primary">Profile</h2>
            <button v-if="!editMode" type="button" class="btn-ghost text-sm" @click="openEdit">
              Edit
            </button>
          </div>

          <!-- View mode. -->
          <dl v-if="!editMode" class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-muted font-mono text-xs uppercase tracking-wider">Name</dt>
              <dd class="text-primary mt-0.5">{{ customer.name }}</dd>
            </div>
            <div>
              <dt class="text-muted font-mono text-xs uppercase tracking-wider">Email</dt>
              <dd class="text-primary mt-0.5">{{ customer.email }}</dd>
            </div>
            <div>
              <dt class="text-muted font-mono text-xs uppercase tracking-wider">Phone</dt>
              <dd class="text-primary mt-0.5">{{ customer.phoneNumber || '—' }}</dd>
            </div>
          </dl>

          <!-- Edit mode. -->
          <form v-else class="space-y-4" @submit.prevent="saveProfile">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="label" for="edit-name">Full Name</label>
                <input id="edit-name" v-model="editForm.name" type="text" required autocomplete="name" class="input w-full">
              </div>
              <div>
                <label class="label" for="edit-email">Email</label>
                <input id="edit-email" v-model="editForm.email" type="email" required autocomplete="email" class="input w-full">
              </div>
              <div>
                <label class="label" for="edit-phone">Phone</label>
                <input id="edit-phone" v-model="editForm.phoneNumber" type="tel" autocomplete="tel" class="input w-full">
              </div>
            </div>
            <div class="flex gap-3">
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Saving…' : 'Save changes' }}
              </button>
              <button type="button" class="btn-ghost" @click="cancelEdit">Cancel</button>
            </div>
          </form>
        </div>

        <!-- ── Appointments split view ── -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left: upcoming and ongoing. -->
          <div>
            <h3 class="font-display text-lg text-primary mb-3">Upcoming & Ongoing</h3>
            <p v-if="activeAppointments.length === 0" class="text-muted text-sm py-4">
              No upcoming appointments.
              <NuxtLink to="/book" class="text-gold-400 hover:underline ml-1">Book one now →</NuxtLink>
            </p>
            <div v-else class="space-y-3">
              <ClientAppointmentCard
                v-for="appt in activeAppointments"
                :key="appt.id"
                :appointment="appt"
                :can-cancel="appt.status === AppointmentStatus.Scheduled"
                :cancelling="cancellingId === appt.id"
                @cancel="cancelAppointment"
              />
            </div>
          </div>

          <!-- Right: past appointments. -->
          <div>
            <h3 class="font-display text-lg text-primary mb-3">Past Appointments</h3>
            <p v-if="pastAppointments.length === 0" class="text-muted text-sm py-4">
              No past appointments yet.
            </p>
            <div v-else class="space-y-3">
              <ClientAppointmentCard
                v-for="appt in pastAppointments"
                :key="appt.id"
                :appointment="appt"
                :can-cancel="false"
                :cancelling="false"
              />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
