<script setup lang="ts">
// Booking flow page: 3-step stepper (service → worker/time → confirm).
// Pre-selects a service when `serviceId` is present in the query string.
// See sprint plan S5.2 for the full specification.
import type { Service, Worker, BusinessSchedule } from '~/types'
import { generateTimeSlots } from '~/utils/timeSlots'
import { AppointmentStatus } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { api } = useApi()
const toast = useToast()

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

// Derived time slots from the fetched schedule.
const timeSlots = computed<string[]>(() => {
  if (!schedule.value || !schedule.value.isOpen) return []
  return generateTimeSlots(
    schedule.value.openTime ?? '09:00',
    schedule.value.closeTime ?? '18:00',
    schedule.value.breakStart ?? null,
    schedule.value.breakEnd ?? null,
  )
})

const selectedTime = ref('')

// ── Step 3 state ──────────────────────────────────────────────────────────────

const submitting = ref(false)

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
    const message =
      (err as { response?: { data?: string } }).response?.data ?? 'Failed to load workers'
    toast.error(typeof message === 'string' ? message : 'Failed to load workers')
  } finally {
    workersLoading.value = false
  }
}

function selectWorker(workerId: number): void {
  selectedWorker.value = workers.value.find((w) => w.id === workerId) ?? null
  // Reset downstream selections when the worker changes.
  selectedDate.value = ''
  selectedTime.value = ''
  schedule.value = null
  dayIsClosed.value = false
}

// ── Date & schedule fetching ──────────────────────────────────────────────────

async function handleDateChange(date: string): Promise<void> {
  selectedDate.value = date
  selectedTime.value = ''
  schedule.value = null
  dayIsClosed.value = false

  if (!date) return

  loadingSchedule.value = true
  try {
    const dow = new Date(date + 'T12:00:00').getDay()
    const result = await api.schedule.getByDay(dow)
    schedule.value = result
    dayIsClosed.value = !result.isOpen
  } catch {
    // Treat a missing schedule as a closed day.
    dayIsClosed.value = true
  } finally {
    loadingSchedule.value = false
  }
}

// ── Booking submission ────────────────────────────────────────────────────────

async function handleConfirm(payload: { name: string; email: string; phone: string }): Promise<void> {
  if (!selectedService.value || !selectedWorker.value || !selectedDate.value || !selectedTime.value) {
    return
  }

  submitting.value = true
  try {
    // 1. Create or retrieve the customer record.
    const customer = await api.customers.create({
      name: payload.name,
      email: payload.email,
      phoneNumber: payload.phone,
    })

    // 2. Build the ISO scheduledFor string from the selected date + time.
    const scheduledFor = `${selectedDate.value}T${selectedTime.value}:00`

    // 3. Create the appointment.
    const appointment = await api.appointments.create({
      customerId: customer.id,
      workerId: selectedWorker.value.id,
      serviceId: selectedService.value.id,
      scheduledFor,
      status: AppointmentStatus.Scheduled,
    })

    await router.push(`/book/success?appointmentId=${appointment.id}`)
  } catch (err: unknown) {
    const message =
      (err as { response?: { data?: string } }).response?.data ?? 'Booking failed. Please try again.'
    toast.error(typeof message === 'string' ? message : 'Booking failed. Please try again.')
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
    const message =
      (err as { response?: { data?: string } }).response?.data ?? 'Failed to load services'
    toast.error(typeof message === 'string' ? message : 'Failed to load services')
  } finally {
    servicesLoading.value = false
  }

  // Pre-select service from query param (e.g. /book?serviceId=3).
  const qId = Number(route.query.serviceId)
  if (qId) {
    const match = services.value.find((s) => s.id === qId)
    if (match) selectedService.value = match
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
        @confirm="handleConfirm"
      />

      <!-- Navigation buttons (not shown on step 3 — the form has its own submit). -->
      <div v-if="step < 3" class="flex items-center justify-between mt-8">
        <button
          v-if="step > 1"
          type="button"
          class="btn-ghost"
          @click="goBack"
        >
          ← Back
        </button>
        <span v-else />

        <button
          type="button"
          class="btn-primary"
          :disabled="!canAdvance"
          @click="goNext"
        >
          Continue →
        </button>
      </div>

      <!-- Back button on step 3 (above the form submit). -->
      <div v-if="step === 3" class="mt-4">
        <button type="button" class="btn-ghost text-sm" @click="goBack">
          ← Back
        </button>
      </div>
    </div>
  </div>
</template>
