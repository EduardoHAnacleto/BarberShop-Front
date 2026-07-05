<script setup lang="ts">
// Booking flow page: 3-step stepper (service → worker/time → confirm).
// Pre-selects a service when `serviceId` is present in the query string.
// Slots for a worker+date are filtered against existing appointments so no
// double-bookings are possible and service durations are respected.
// See sprint plan S5.2 for the full specification.
import type { Service, Worker, BusinessSchedule, Appointment } from '~/types'
import { AppointmentStatus } from '~/types'
import { generateTimeSlots, filterAvailableSlots, filterPastSlots } from '~/utils/timeSlots'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { api } = useApi()
const toast = useToast()
const { isLoggedIn, userId, userEmail } = useAuth()

// ── Step management ───────────────────────────────────────────────────────────

const STEP_LABELS = ['Service', 'Professional & Time', 'Confirm']
const step = ref(1)

// ── Step 1 state ──────────────────────────────────────────────────────────────

const services = ref<Service[]>([])
const servicesLoading = ref(true)
const selectedService = ref<Service | null>(null)

// ── Step 2 state ──────────────────────────────────────────────────────────────

const workers = ref<Worker[]>([])
const workersLoading = ref(false)
const selectedWorker = ref<Worker | null>(null)

const selectedDate = ref('')
const loadingSchedule = ref(false)
const schedule = ref<BusinessSchedule | null>(null)
const dayIsClosed = ref(false)

// Active (non-cancelled/deleted) appointments for the selected worker on the selected date.
// Used to filter out conflicting time slots.
const workerAppointments = ref<Appointment[]>([])

// Builds the available time slots by generating all possible slots from the
// day's schedule and then removing any that conflict with the worker's existing
// bookings (accounting for the duration of both existing and proposed services).
const timeSlots = computed<string[]>(() => {
  if (!schedule.value || !schedule.value.isOpen) return []

  const rawSlots = generateTimeSlots(
    schedule.value.openTime ?? '09:00',
    schedule.value.closeTime ?? '18:00',
    schedule.value.breakStart ?? null,
    schedule.value.breakEnd ?? null,
  )

  // Drop any slot whose start has already passed for the local "now". This
  // only affects same-day bookings; future dates are unchanged.
  const futureSlots = filterPastSlots(rawSlots, selectedDate.value)

  if (!selectedService.value) return futureSlots

  // Build an occupied period for every active appointment on this day.
  // The period spans [startMinutes, startMinutes + serviceDuration).
  const occupied = workerAppointments.value.map((appt) => {
    const svc = services.value.find((s) => s.id === appt.serviceId)
    const duration = svc?.duration ?? 30
    const timePart = appt.scheduledFor.slice(11, 16) // "HH:mm"
    const [h, m] = timePart.split(':').map(Number)
    const startMinutes = (h ?? 0) * 60 + (m ?? 0)
    return { startMinutes, endMinutes: startMinutes + duration }
  })

  return filterAvailableSlots(futureSlots, occupied, selectedService.value.duration)
})

const selectedTime = ref('')

// ── Step 3 state ──────────────────────────────────────────────────────────────

const submitting = ref(false)

// ID of the logged-in user's linked customer record.
// When set, the booking flow skips customer creation and reuses this record.
const existingCustomerId = ref<number | null>(null)

// Pre-filled contact values resolved from the logged-in customer's profile.
const prefill = reactive({ name: '', email: '', phone: '' })

// ── Navigation helpers ────────────────────────────────────────────────────────

// Whether the user may advance past the current step.
const canAdvance = computed<boolean>(() => {
  if (step.value === 1) return selectedService.value !== null
  if (step.value === 2) {
    return selectedWorker.value !== null && selectedDate.value !== '' && selectedTime.value !== ''
  }
  return false
})

function goNext(): void {
  if (!canAdvance.value) return
  step.value++
}

function goBack(): void {
  if (step.value > 1) step.value--
}

// ── Service selection ─────────────────────────────────────────────────────────

function selectService(serviceId: number): void {
  selectedService.value = services.value.find((s) => s.id === serviceId) ?? null
}

// ── Worker selection ──────────────────────────────────────────────────────────

async function fetchWorkersByService(serviceId: number): Promise<void> {
  workersLoading.value = true
  try {
    workers.value = await api.workers.workersByService(serviceId)
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: string } }).response?.data ?? 'Failed to load workers'
    toast.error(typeof msg === 'string' ? msg : 'Failed to load workers')
  } finally {
    workersLoading.value = false
  }
}

function selectWorker(workerId: number): void {
  selectedWorker.value = workers.value.find((w) => w.id === workerId) ?? null
  // Reset all downstream state when the worker changes.
  selectedDate.value = ''
  selectedTime.value = ''
  schedule.value = null
  dayIsClosed.value = false
  workerAppointments.value = []
}

// ── Date, schedule and conflict fetching ──────────────────────────────────────

async function handleDateChange(date: string): Promise<void> {
  selectedDate.value = date
  selectedTime.value = ''
  schedule.value = null
  dayIsClosed.value = false
  workerAppointments.value = []

  if (!date || !selectedWorker.value) return

  loadingSchedule.value = true
  const workerId = selectedWorker.value.id

  // Fetch the day's schedule and the worker's existing appointments in parallel.
  await Promise.all([
    api.schedule
      .getByDay(new Date(date + 'T12:00:00').getDay())
      .then((result) => {
        schedule.value = result
        dayIsClosed.value = !result.isOpen
      })
      .catch(() => {
        dayIsClosed.value = true
      }),

    // Keep only Scheduled / OnGoing appointments on the selected date.
    // Cancelled and Deleted appointments do not block slots.
    api.appointments
      .byWorker(workerId)
      .then((all) => {
        workerAppointments.value = all.filter(
          (a) =>
            a.scheduledFor.slice(0, 10) === date &&
            a.status !== AppointmentStatus.Cancelled &&
            a.status !== AppointmentStatus.Deleted,
        )
      })
      .catch(() => {
        workerAppointments.value = []
      }),
  ])

  loadingSchedule.value = false
}

// ── Booking submission ────────────────────────────────────────────────────────

async function handleConfirm(payload: { name: string; email: string; phone: string }): Promise<void> {
  if (!selectedService.value || !selectedWorker.value || !selectedDate.value || !selectedTime.value) {
    return
  }

  submitting.value = true
  try {
    // 1. Reuse the logged-in customer's record when available; otherwise create one.
    let customerId: number
    if (existingCustomerId.value !== null) {
      customerId = existingCustomerId.value
    } else {
      const customer = await api.customers.create({
        name: payload.name,
        email: payload.email,
        phoneNumber: payload.phone,
      })
      customerId = customer.id
    }

    // 2. Build the ISO scheduledFor string from the selected date + time.
    const scheduledFor = `${selectedDate.value}T${selectedTime.value}:00`

    // 3. Create the appointment. The backend validates worker+customer conflicts
    //    as a final guard; the frontend already filters worker slot conflicts.
    const appointment = await api.appointments.create({
      customerId,
      workerId: selectedWorker.value.id,
      serviceId: selectedService.value.id,
      scheduledFor,
      status: AppointmentStatus.Scheduled,
    })

    await router.push(`/book/success?appointmentId=${appointment.id}`)
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: string } }).response?.data ?? 'Booking failed. Please try again.'
    toast.error(typeof msg === 'string' ? msg : 'Booking failed. Please try again.')
  } finally {
    submitting.value = false
  }
}

// ── Watch step transitions ────────────────────────────────────────────────────

// When step advances to 2, load workers for the selected service.
watch(step, async (newStep) => {
  if (newStep === 2 && selectedService.value) {
    await fetchWorkersByService(selectedService.value.id)
  }
})

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    services.value = await api.services.all()
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: string } }).response?.data ?? 'Failed to load services'
    toast.error(typeof msg === 'string' ? msg : 'Failed to load services')
  } finally {
    servicesLoading.value = false
  }

  // Pre-select service from query param (e.g. /book?serviceId=3).
  const qId = Number(route.query.serviceId)
  if (qId) {
    const match = services.value.find((s) => s.id === qId)
    if (match) selectedService.value = match
  }

  // Resolve the logged-in customer's profile to pre-fill step 3.
  // Non-fatal: if this fails the form is left empty for manual input.
  if (isLoggedIn.value && userId.value) {
    try {
      const user = await api.users.byId(Number(userId.value))
      if (user.customerId) {
        existingCustomerId.value = user.customerId
        const customer = await api.customers.byId(user.customerId)
        prefill.name = customer.name
        prefill.email = customer.email
        prefill.phone = customer.phoneNumber
      } else {
        // No linked customer yet — at least pre-fill the email from the JWT.
        prefill.email = userEmail.value ?? ''
      }
    } catch {
      // Silently ignore; the user can fill in the form manually.
    }
  }
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Sticky navigation. -->
    <LayoutPublicNavbar />

    <div class="max-w-2xl mx-auto px-4 py-12">
      <!-- Page header. -->
      <div class="mb-8">
        <h1 class="font-display text-3xl text-primary mb-1">Book an Appointment</h1>
        <p class="text-secondary text-sm">Complete the steps below to schedule your visit.</p>
      </div>

      <!-- Step indicator. -->
      <div class="mb-10">
        <BookingStepper :current-step="step" :steps="STEP_LABELS" />
      </div>

      <!-- Step panels. -->
      <BookingStepService
        v-if="step === 1"
        :services="services"
        :selected-id="selectedService?.id ?? null"
        :loading="servicesLoading"
        @select="selectService"
      />

      <BookingStepWorkerTime
        v-else-if="step === 2"
        :workers="workers"
        :loading-workers="workersLoading"
        :selected-worker-id="selectedWorker?.id ?? null"
        :selected-date="selectedDate"
        :day-is-closed="dayIsClosed"
        :loading-schedule="loadingSchedule"
        :time-slots="timeSlots"
        :selected-time="selectedTime"
        @select-worker="selectWorker"
        @select-date="handleDateChange"
        @select-time="(t) => (selectedTime = t)"
      />

      <BookingStepConfirm
        v-else-if="step === 3 && selectedService && selectedWorker"
        :service="selectedService"
        :worker="selectedWorker"
        :selected-date="selectedDate"
        :selected-time="selectedTime"
        :submitting="submitting"
        :prefill="prefill"
        @confirm="handleConfirm"
      />

      <!-- Navigation buttons (not shown on step 3 — the form has its own submit). -->
      <div v-if="step < 3" class="flex items-center justify-between mt-8">
        <button v-if="step > 1" type="button" class="btn-ghost" @click="goBack">
          ← Back
        </button>
        <span v-else />
        <button type="button" class="btn-primary" :disabled="!canAdvance" @click="goNext">
          Continue →
        </button>
      </div>

      <!-- Back button on step 3 (sits above the form's own Confirm submit). -->
      <div v-if="step === 3" class="mt-4">
        <button type="button" class="btn-ghost text-sm" @click="goBack">← Back</button>
      </div>
    </div>
  </div>
</template>
