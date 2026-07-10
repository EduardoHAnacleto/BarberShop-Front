<script setup lang="ts">
// Client portal: profile editor + split-view appointment history.
// Left column: upcoming and ongoing appointments (can be cancelled).
// Right column: past appointments (completed, cancelled, etc.).
import type { Customer, Appointment, Review, LoyaltyStatus } from '~/types'
import { AppointmentStatus } from '~/types'
import { isInDateRange, byProximityToNow } from '~/utils/appointmentFilters'
import type { DateFilter } from '~/utils/appointmentFilters'

definePageMeta({ layout: 'default', middleware: 'auth' })

const { api } = useApi()
const toast = useToast()
const { userId, logout } = useAuth()

// ── Change password ─────────────────────────────────────────────────────────

const showPasswordForm = ref(false)
const passwordForm = reactive({ current: '', next: '', confirm: '' })
const changingPassword = ref(false)

async function changePassword(): Promise<void> {
  if (passwordForm.next.length < 8) {
    toast.error('New password must be at least 8 characters')
    return
  }
  if (passwordForm.next !== passwordForm.confirm) {
    toast.error('New passwords do not match')
    return
  }

  changingPassword.value = true
  try {
    await api.auth.changePassword(passwordForm.current, passwordForm.next)
    toast.success('Password changed. Please sign in again.')
    // The server revoked every session; send the user back to login.
    await logout()
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: string } }).response?.data ?? 'Could not change password'
    toast.error(typeof msg === 'string' ? msg : 'Could not change password')
  } finally {
    changingPassword.value = false
  }
}

// ── State ─────────────────────────────────────────────────────────────────────

const customer = ref<Customer | null>(null)
const appointments = ref<Appointment[]>([])
const reviews = ref<Review[]>([])
const loyalty = ref<LoyaltyStatus | null>(null)
const pageLoading = ref(true)
const noProfile = ref(false)

// Percentage of the current reward cycle completed, for the progress bar.
const loyaltyProgressPercent = computed(() => {
  if (!loyalty.value) return 0
  const { visitsForReward, visitsUntilReward } = loyalty.value
  if (visitsForReward <= 0) return 0
  return Math.round(((visitsForReward - visitsUntilReward) / visitsForReward) * 100)
})

// Appointments the caller has already reviewed — drives the "Leave a
// review" affordance on completed appointments.
const reviewByAppointmentId = computed(() => {
  const map = new Map<number, Review>()
  for (const r of reviews.value) map.set(r.appointmentId, r)
  return map
})

// ID of the appointment currently being cancelled (null = none in flight).
const cancellingId = ref<number | null>(null)

// Active date-range filter — 'all' shows every appointment.
const filter = ref<DateFilter>('all')

// ── Reschedule ──────────────────────────────────────────────────────────────

// The appointment currently being rescheduled (null = modal closed).
const reschedulingAppt = ref<Appointment | null>(null)
const rescheduleDate = ref('')
const rescheduleSlots = ref<string[]>([])
const rescheduleTime = ref('')
const rescheduleLoading = ref(false)
const rescheduleSaving = ref(false)

// Earliest selectable day (today) for the date input.
const todayIso = new Date().toISOString().slice(0, 10)

function openReschedule(appt: Appointment): void {
  reschedulingAppt.value = appt
  rescheduleDate.value = ''
  rescheduleSlots.value = []
  rescheduleTime.value = ''
}

function closeReschedule(): void {
  reschedulingAppt.value = null
}

// Loads the worker's server-computed availability for the chosen day/service.
async function onRescheduleDateChange(): Promise<void> {
  rescheduleTime.value = ''
  rescheduleSlots.value = []
  const appt = reschedulingAppt.value
  if (!appt || !rescheduleDate.value) return

  rescheduleLoading.value = true
  try {
    const result = await api.workers.availability(
      appt.workerId,
      rescheduleDate.value,
      appt.serviceId,
    )
    rescheduleSlots.value = result.slots
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: string } }).response?.data ?? 'Failed to load availability'
    toast.error(typeof msg === 'string' ? msg : 'Failed to load availability')
  } finally {
    rescheduleLoading.value = false
  }
}

// Persists the new date/time, keeping the same worker, service and customer.
async function confirmReschedule(): Promise<void> {
  const appt = reschedulingAppt.value
  if (!appt || !rescheduleDate.value || !rescheduleTime.value) return

  rescheduleSaving.value = true
  try {
    const scheduledFor = `${rescheduleDate.value}T${rescheduleTime.value}:00`
    const updated = await api.appointments.update(appt.id, {
      workerId: appt.workerId,
      customerId: appt.customerId,
      serviceId: appt.serviceId,
      scheduledFor,
      status: appt.status,
      extraDetails: appt.extraDetails,
    })
    // Reflect the new time locally so the list re-sorts immediately.
    const local = appointments.value.find((a) => a.id === appt.id)
    if (local) local.scheduledFor = updated.scheduledFor
    toast.success('Appointment rescheduled')
    closeReschedule()
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: string } }).response?.data ?? 'Could not reschedule'
    toast.error(typeof msg === 'string' ? msg : 'Could not reschedule')
  } finally {
    rescheduleSaving.value = false
  }
}

// ── Leave a review ───────────────────────────────────────────────────────────

// The completed appointment currently being reviewed (null = modal closed).
const reviewingAppt = ref<Appointment | null>(null)
const reviewForm = reactive({ rating: 0, comment: '' })
const submittingReview = ref(false)

function openReview(appt: Appointment): void {
  reviewingAppt.value = appt
  reviewForm.rating = 0
  reviewForm.comment = ''
}

function closeReview(): void {
  reviewingAppt.value = null
}

async function submitReview(): Promise<void> {
  const appt = reviewingAppt.value
  if (!appt || reviewForm.rating < 1) return

  submittingReview.value = true
  try {
    const created = await api.reviews.create({
      appointmentId: appt.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
    })
    reviews.value.push(created)
    toast.success('Thanks for your feedback!')
    closeReview()
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: string } }).response?.data ?? 'Could not submit review'
    toast.error(typeof msg === 'string' ? msg : 'Could not submit review')
  } finally {
    submittingReview.value = false
  }
}

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
    const updated = await api.customers.updateMe({
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

// Reactive "now" (refreshed every 60s) so an appointment crossing its start
// time while the page is open moves from Upcoming to Past without a reload.
const now = useNow({ interval: 60_000 })

// Keeps only appointments whose scheduledFor falls inside the selected period.
const filtered = computed(() =>
  appointments.value.filter((a) => isInDateRange(a.scheduledFor, filter.value)),
)

// Upcoming: Scheduled status with a future date, OR currently OnGoing.
const activeAppointments = computed(() =>
  filtered.value
    .filter(
      (a) =>
        a.status === AppointmentStatus.OnGoing ||
        (a.status === AppointmentStatus.Scheduled && new Date(a.scheduledFor) > now.value),
    )
    .sort((a, b) => byProximityToNow(a, b, 'asc')),
)

// Past: completed, cancelled, deleted, or scheduled but date already passed.
const pastAppointments = computed(() =>
  filtered.value
    .filter(
      (a) =>
        a.status === AppointmentStatus.Completed ||
        a.status === AppointmentStatus.Cancelled ||
        a.status === AppointmentStatus.Deleted ||
        (a.status === AppointmentStatus.Scheduled && new Date(a.scheduledFor) <= now.value),
    )
    .sort((a, b) => byProximityToNow(a, b, 'desc')),
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
  if (!userId.value) { pageLoading.value = false; noProfile.value = true; return }

  try {
    // Resolve the customerId linked to this account via /users/me — the
    // admin-only /users/{id} endpoint 403s for clients.
    const user = await api.users.me()
    if (!user.customerId) { noProfile.value = true; return }

    // Fetch profile and appointments in parallel. Both use self-service
    // endpoints that a client is authorized to call.
    const [cust, appts] = await Promise.all([
      api.customers.me(),
      api.appointments.byCustomer(user.customerId),
    ])
    customer.value = cust
    appointments.value = appts
  } catch {
    toast.error('Failed to load your profile. Please try again.')
  } finally {
    pageLoading.value = false
  }

  // Best-effort: only gates the "Leave a review" affordance, never the
  // profile itself.
  try {
    reviews.value = await api.reviews.mine()
  } catch {
    // Ignore — completed appointments simply keep showing "Leave a review".
  }

  // Best-effort: the loyalty card simply stays hidden on failure.
  try {
    loyalty.value = await api.customers.myLoyalty()
  } catch {
    // Ignore.
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

          <!-- ── Loyalty progress ── -->
          <div v-if="loyalty" class="mb-4 p-3 rounded-lg border border-gold-500/20 bg-gold-500/5">
            <div class="flex items-center justify-between text-sm">
              <span class="text-secondary">Loyalty progress</span>
              <span class="font-mono text-xs text-muted">{{ loyalty.completedVisits }} completed visits</span>
            </div>
            <div class="mt-2 h-2 rounded-full bg-obsidian-700 overflow-hidden">
              <div
                class="h-full bg-gold-400 transition-all"
                :style="{ width: `${loyaltyProgressPercent}%` }"
              />
            </div>
            <p v-if="loyalty.rewardReady" class="mt-2 text-sm text-gold-400 font-medium">
              Reward ready! Ask your barber about your free visit.
            </p>
            <p v-else class="mt-2 text-xs text-muted">
              {{ loyalty.visitsUntilReward }} more visit{{ loyalty.visitsUntilReward === 1 ? '' : 's' }} until your next reward.
            </p>
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

          <!-- ── Change password ── -->
          <div class="mt-5 pt-5 border-t border-subtle">
            <button
              v-if="!showPasswordForm"
              type="button"
              class="btn-ghost text-sm"
              @click="showPasswordForm = true"
            >
              Change password
            </button>

            <form v-else class="space-y-3 max-w-sm" @submit.prevent="changePassword">
              <div>
                <label class="label" for="pw-current">Current password</label>
                <input id="pw-current" v-model="passwordForm.current" type="password" required autocomplete="current-password" class="input w-full">
              </div>
              <div>
                <label class="label" for="pw-next">New password</label>
                <input id="pw-next" v-model="passwordForm.next" type="password" required autocomplete="new-password" class="input w-full">
              </div>
              <div>
                <label class="label" for="pw-confirm">Confirm new password</label>
                <input id="pw-confirm" v-model="passwordForm.confirm" type="password" required autocomplete="new-password" class="input w-full">
              </div>
              <div class="flex gap-3">
                <button type="submit" class="btn-primary" :disabled="changingPassword">
                  {{ changingPassword ? 'Changing…' : 'Update password' }}
                </button>
                <button type="button" class="btn-ghost" @click="showPasswordForm = false">Cancel</button>
              </div>
            </form>
          </div>
        </div>

        <!-- ── Appointments split view ── -->
        <div class="space-y-4">
          <!-- Filter bar header row. -->
          <div class="flex flex-wrap items-center justify-between gap-4">
            <h2 class="font-display text-xl text-primary">Appointments</h2>
            <SharedDateRangeFilter v-model="filter" />
          </div>

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
              >
                <template v-if="appt.status === AppointmentStatus.Scheduled" #actions>
                  <button
                    type="button"
                    class="text-xs py-1 px-3 rounded text-gold-400 hover:text-gold-300"
                    @click="openReschedule(appt)"
                  >
                    Reschedule
                  </button>
                </template>
              </ClientAppointmentCard>
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
              >
                <template v-if="appt.status === AppointmentStatus.Completed" #actions>
                  <SharedStarRating
                    v-if="reviewByAppointmentId.has(appt.id)"
                    :rating="reviewByAppointmentId.get(appt.id)!.rating"
                    :count="1"
                  />
                  <button
                    v-else
                    type="button"
                    class="text-xs py-1 px-3 rounded text-gold-400 hover:text-gold-300"
                    @click="openReview(appt)"
                  >
                    Leave a review
                  </button>
                </template>
              </ClientAppointmentCard>
            </div>
          </div>
        </div>
        </div>
      </template>
    </div>

    <!-- ── Reschedule modal ── -->
    <UiModal
      :model-value="reschedulingAppt !== null"
      title="Reschedule appointment"
      size="sm"
      @update:model-value="(v) => { if (!v) closeReschedule() }"
    >
      <div v-if="reschedulingAppt" class="space-y-4">
        <p class="text-secondary text-sm">
          {{ reschedulingAppt.serviceName }} with {{ reschedulingAppt.workerName }}
        </p>

        <!-- New date. -->
        <div>
          <label class="label" for="reschedule-date">New date</label>
          <input
            id="reschedule-date"
            v-model="rescheduleDate"
            type="date"
            :min="todayIso"
            autocomplete="off"
            class="input w-full"
            @change="onRescheduleDateChange"
          >
        </div>

        <!-- Available slots. -->
        <div v-if="rescheduleLoading" class="text-muted text-sm">Loading availability…</div>
        <div v-else-if="rescheduleDate && rescheduleSlots.length === 0" class="text-muted text-sm">
          No available times on this day.
        </div>
        <div v-else-if="rescheduleSlots.length > 0">
          <span class="label">New time</span>
          <div class="grid grid-cols-4 gap-2 mt-1">
            <button
              v-for="slot in rescheduleSlots"
              :key="slot"
              type="button"
              class="text-sm py-1 rounded border transition-colors"
              :class="rescheduleTime === slot
                ? 'border-gold-500 text-gold-300 bg-gold-500/10'
                : 'border-border text-secondary hover:border-gold-500/50'"
              @click="rescheduleTime = slot"
            >
              {{ slot }}
            </button>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn-ghost" @click="closeReschedule">Cancel</button>
        <button
          type="button"
          class="btn-primary"
          :disabled="!rescheduleTime || rescheduleSaving"
          @click="confirmReschedule"
        >
          {{ rescheduleSaving ? 'Saving…' : 'Confirm' }}
        </button>
      </template>
    </UiModal>

    <!-- ── Leave a review modal ── -->
    <UiModal
      :model-value="reviewingAppt !== null"
      title="Leave a review"
      size="sm"
      @update:model-value="(v) => { if (!v) closeReview() }"
    >
      <div v-if="reviewingAppt" class="space-y-4">
        <p class="text-secondary text-sm">
          {{ reviewingAppt.serviceName }} with {{ reviewingAppt.workerName }}
        </p>

        <!-- Star picker. -->
        <div>
          <span class="label">Rating</span>
          <div class="flex gap-1 mt-1" role="radiogroup" aria-label="Rating">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="text-2xl leading-none transition-colors"
              :class="n <= reviewForm.rating ? 'text-gold-400' : 'text-obsidian-700 hover:text-gold-500/50'"
              :aria-pressed="n <= reviewForm.rating"
              :aria-label="`${n} star${n === 1 ? '' : 's'}`"
              @click="reviewForm.rating = n"
            >★</button>
          </div>
        </div>

        <!-- Comment. -->
        <div>
          <label class="label" for="review-comment">Comment (optional)</label>
          <textarea
            id="review-comment"
            v-model="reviewForm.comment"
            rows="3"
            maxlength="1000"
            class="input w-full"
            placeholder="How was your visit?"
          />
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn-ghost" @click="closeReview">Cancel</button>
        <button
          type="button"
          class="btn-primary"
          :disabled="reviewForm.rating < 1 || submittingReview"
          @click="submitReview"
        >
          {{ submittingReview ? 'Submitting…' : 'Submit review' }}
        </button>
      </template>
    </UiModal>
  </div>
</template>
