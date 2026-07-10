<script setup lang="ts">
// Booking flow page: 3-step stepper (service → worker/time → confirm).
// Pre-selects a service when `serviceId` is present in the query string.
// Bookable slots come from the server-side availability endpoint, which
// accounts for the day's schedule, closures, existing bookings, the service
// duration and same-day lead time — no client-side slot math and no need to
// download other customers' appointments.
// See sprint plan S5.2 / Sprint070726 §3.1 for the full specification.
import type { Service, Worker, WorkerRatingSummary } from '~/types'
import { AppointmentStatus } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { api } = useApi()
const toast = useToast()
const { isLoggedIn, userId, userEmail } = useAuth()
const { onAppointmentsChanged } = useSignalR()

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

// Aggregate rating per worker id, shown as a star badge on each worker card.
// Fetched once on mount — a handful of workers, so a single bulk call beats
// one request per card.
const ratings = ref<Record<number, WorkerRatingSummary>>({})

const selectedDate = ref('')
const loadingSchedule = ref(false)
const dayIsClosed = ref(false)

// Bookable slots for the selected worker+date+service, as returned by the
// server-side availability endpoint.
const timeSlots = ref<string[]>([])

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
  dayIsClosed.value = false
  timeSlots.value = []
}

// ── Availability fetching ──────────────────────────────────────────────────────

// Fetches (or re-fetches) the server-computed availability for the current
// worker/date/service selection. Preserves the chosen time if it is still free.
async function loadAvailability(): Promise<void> {
  if (!selectedDate.value || !selectedWorker.value || !selectedService.value) return

  loadingSchedule.value = true
  try {
    const result = await api.workers.availability(
      selectedWorker.value.id,
      selectedDate.value,
      selectedService.value.id,
    )
    timeSlots.value = result.slots
    // If someone booked the slot this user had selected, clear it so they
    // cannot submit a now-unavailable time.
    if (selectedTime.value && !result.slots.includes(selectedTime.value)) {
      selectedTime.value = ''
    }
    // An open day with no returned slots reads as "fully booked" rather than
    // "closed"; only mark the day closed when the shop is genuinely shut.
    dayIsClosed.value = result.slots.length === 0
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: string } }).response?.data ?? 'Failed to load availability'
    toast.error(typeof msg === 'string' ? msg : 'Failed to load availability')
    dayIsClosed.value = true
  } finally {
    loadingSchedule.value = false
  }
}

async function handleDateChange(date: string): Promise<void> {
  selectedDate.value = date
  selectedTime.value = ''
  dayIsClosed.value = false
  timeSlots.value = []
  if (!date) return
  await loadAvailability()
}

// Live updates: when any appointment changes on the server, refresh the slots
// for the day being viewed so two users cannot grab the same time. The SDK
// already reconnects automatically; the subscription cleans itself up on
// unmount via the returned unsubscribe.
const unsubscribeSlots = onAppointmentsChanged(() => {
  if (selectedDate.value) loadAvailability()
})
onUnmounted(() => unsubscribeSlots())

// ── Booking submission ────────────────────────────────────────────────────────

async function handleConfirm(
  payload: { name: string; email: string; phone: string; repeatWeeks?: number },
): Promise<void> {
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

    // 3. Create the appointment(s). The backend validates worker+customer
    //    conflicts as a final guard; the frontend already filters worker slot
    //    conflicts. A "repeat weekly" request books a whole series in one call.
    let firstAppointmentId: number
    let recurringSummary: { createdCount: number; skippedCount: number } | null = null

    if (payload.repeatWeeks && payload.repeatWeeks > 1) {
      const result = await api.appointments.createRecurring({
        customerId,
        workerId: selectedWorker.value.id,
        serviceId: selectedService.value.id,
        scheduledFor,
        repeatWeeks: payload.repeatWeeks,
      })
      firstAppointmentId = result.created[0]?.id ?? 0
      recurringSummary = { createdCount: result.created.length, skippedCount: result.skippedDates.length }
    } else {
      const appointment = await api.appointments.create({
        customerId,
        workerId: selectedWorker.value.id,
        serviceId: selectedService.value.id,
        scheduledFor,
        status: AppointmentStatus.Scheduled,
      })
      firstAppointmentId = appointment.id
    }

    // Pass the essentials so the success page can offer an "add to calendar"
    // action without an extra fetch.
    await router.push({
      path: '/book/success',
      query: {
        appointmentId: String(firstAppointmentId),
        service: selectedService.value.name,
        worker: selectedWorker.value.name,
        scheduledFor,
        duration: String(selectedService.value.duration),
        ...(recurringSummary
          ? {
              createdCount: String(recurringSummary.createdCount),
              skippedCount: String(recurringSummary.skippedCount),
            }
          : {}),
      },
    })
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

  // Best-effort: star badges are a nice-to-have, never block booking on them.
  try {
    const summary = await api.reviews.summary()
    ratings.value = Object.fromEntries(summary.map((r) => [r.workerId, r]))
  } catch {
    // Ignore — worker cards simply render "No reviews".
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
      const user = await api.users.me()
      if (user.customerId) {
        existingCustomerId.value = user.customerId
        const customer = await api.customers.me()
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
        :ratings="ratings"
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
