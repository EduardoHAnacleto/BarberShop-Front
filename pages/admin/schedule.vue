<script setup lang="ts">
// Admin schedule management page.
// Section 1: weekly business hours, one row per day-of-week.
// Section 2: exceptional closures (holidays, refurbishments, etc.).
// See sprint plan S3.4 for the full spec.
import dayjs from 'dayjs'
import { ClosureType } from '~/types'
import type { BusinessSchedule, WorkingHours } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

// ── Stores ─────────────────────────────────────────────────────────────────

const scheduleStore = useScheduleStore()
const { schedules, closures, loading } = storeToRefs(scheduleStore)

// ── Weekly schedule ────────────────────────────────────────────────────────

// Maps a numeric day-of-week to its label, JS Date.getDay() convention.
const DAY_LABELS: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

// Local editable copies of each schedule row, keyed by id. We do not mutate
// the store directly so that "Save" sends only the row the user changed.
const draft = reactive<Record<number, BusinessSchedule>>({})

// Per-row saving flag so we only spin the relevant Save button.
const rowSaving = reactive<Record<number, boolean>>({})

// Builds (or rebuilds) the draft state whenever schedules change.
watchEffect(() => {
  for (const s of schedules.value) {
    draft[s.id] = { ...s }
  }
})

// Schedules sorted by dayOfWeek so the table renders Sun → Sat.
const sortedSchedules = computed(() =>
  [...schedules.value].sort((a, b) => a.dayOfWeek - b.dayOfWeek),
)

// Strips seconds from the TimeSpan ("HH:MM:SS") returned by the API so the
// HTML time input can display it as "HH:MM".
function toInputTime(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 5)
}

// Appends ":00" to an "HH:MM" input so the API receives a valid TimeSpan.
function toApiTime(value: string): string | null {
  if (!value) return null
  return value.length === 5 ? `${value}:00` : value
}

async function saveRow(id: number): Promise<void> {
  const row = draft[id]
  if (!row) return

  rowSaving[id] = true
  await scheduleStore.updateSchedule(id, {
    dayOfWeek: row.dayOfWeek,
    isOpen: row.isOpen,
    openTime: toApiTime(row.openTime ?? '') ?? undefined,
    closeTime: toApiTime(row.closeTime ?? '') ?? undefined,
    breakStart: toApiTime(row.breakStart ?? '') ?? undefined,
    breakEnd: toApiTime(row.breakEnd ?? '') ?? undefined,
  })
  rowSaving[id] = false
}

// ── Closures ───────────────────────────────────────────────────────────────

const showClosureModal = ref(false)
const closureForm = reactive({
  closedFrom: '',
  closedUntil: '',
  closureType: ClosureType.UntilNextOpening as ClosureType,
  reason: '',
})

const closureSaving = ref(false)

// Validation: reason + closedFrom required; closedUntil required only when
// the closure type is UntilSpecificDate.
const closureValid = computed(() => {
  if (!closureForm.reason.trim() || !closureForm.closedFrom) return false
  if (closureForm.closureType === ClosureType.UntilSpecificDate && !closureForm.closedUntil) {
    return false
  }
  return true
})

function openClosureModal(): void {
  Object.assign(closureForm, {
    closedFrom: '',
    closedUntil: '',
    closureType: ClosureType.UntilNextOpening,
    reason: '',
  })
  showClosureModal.value = true
}

async function saveClosure(): Promise<void> {
  if (!closureValid.value) return
  closureSaving.value = true

  const body: Partial<WorkingHours> = {
    closedFrom: closureForm.closedFrom,
    reason: closureForm.reason,
    closureType: closureForm.closureType,
  }

  if (closureForm.closureType === ClosureType.UntilSpecificDate) {
    body.closedUntil = closureForm.closedUntil
  }

  const ok = await scheduleStore.addClosure(body)
  closureSaving.value = false
  if (ok) showClosureModal.value = false
}

// Confirm-then-remove flow for a closure row.
const showRemoveDialog = ref(false)
const removeTarget = ref<WorkingHours | null>(null)

function promptRemove(c: WorkingHours): void {
  removeTarget.value = c
  showRemoveDialog.value = true
}

async function confirmRemove(): Promise<void> {
  if (!removeTarget.value) return
  const ok = await scheduleStore.removeClosure(removeTarget.value.id)
  if (ok) {
    showRemoveDialog.value = false
    removeTarget.value = null
  }
}

// Display helpers.
function formatClosureDate(iso: string): string {
  return dayjs(iso).format('MMM DD, YYYY HH:mm')
}

function closureUntilLabel(c: WorkingHours): string {
  if (c.closureType === ClosureType.UntilNextOpening) return 'Until next opening'
  return c.closedUntil ? formatClosureDate(c.closedUntil) : '—'
}

// ── Lifecycle ───────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([scheduleStore.fetchSchedule(), scheduleStore.fetchClosures()])
})
</script>

<template>
  <div class="p-6 space-y-8">
    <!-- Page header -->
    <div>
      <h1 class="font-display text-2xl text-primary">Schedule</h1>
      <p class="text-secondary text-sm mt-1">Weekly business hours and exceptional closures.</p>
    </div>

    <!-- ── Section 1: Weekly schedule ──────────────────────────────────── -->
    <section class="space-y-3">
      <h2 class="font-display text-lg text-primary">Weekly hours</h2>

      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th class="w-32">Day</th>
              <th class="w-24">Open</th>
              <th>Open time</th>
              <th>Close time</th>
              <th>Break start</th>
              <th>Break end</th>
              <th class="w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading && sortedSchedules.length === 0">
              <tr v-for="i in 7" :key="i">
                <td colspan="7"><UiSkeleton height="h-12" /></td>
              </tr>
            </template>

            <tr v-for="row in sortedSchedules" v-else :key="row.id">
              <td class="font-medium text-primary">{{ DAY_LABELS[row.dayOfWeek] }}</td>
              <td>
                <input
                  v-model="draft[row.id]!.isOpen"
                  type="checkbox"
                  class="accent-gold-500 w-4 h-4"
                  :aria-label="`Toggle ${DAY_LABELS[row.dayOfWeek]} open`"
                >
              </td>
              <td :class="{ 'opacity-50 pointer-events-none': !draft[row.id]?.isOpen }">
                <input
                  :value="toInputTime(draft[row.id]?.openTime)"
                  class="input input-sm font-mono"
                  type="time"
                  @input="(e) => draft[row.id]!.openTime = (e.target as HTMLInputElement).value"
                >
              </td>
              <td :class="{ 'opacity-50 pointer-events-none': !draft[row.id]?.isOpen }">
                <input
                  :value="toInputTime(draft[row.id]?.closeTime)"
                  class="input input-sm font-mono"
                  type="time"
                  @input="(e) => draft[row.id]!.closeTime = (e.target as HTMLInputElement).value"
                >
              </td>
              <td :class="{ 'opacity-50 pointer-events-none': !draft[row.id]?.isOpen }">
                <input
                  :value="toInputTime(draft[row.id]?.breakStart)"
                  class="input input-sm font-mono"
                  type="time"
                  @input="(e) => draft[row.id]!.breakStart = (e.target as HTMLInputElement).value"
                >
              </td>
              <td :class="{ 'opacity-50 pointer-events-none': !draft[row.id]?.isOpen }">
                <input
                  :value="toInputTime(draft[row.id]?.breakEnd)"
                  class="input input-sm font-mono"
                  type="time"
                  @input="(e) => draft[row.id]!.breakEnd = (e.target as HTMLInputElement).value"
                >
              </td>
              <td>
                <button
                  class="btn-primary btn-sm"
                  :disabled="rowSaving[row.id]"
                  @click="saveRow(row.id)"
                >
                  <span
                    v-if="rowSaving[row.id]"
                    class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin"
                  />
                  {{ rowSaving[row.id] ? '…' : 'Save' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ── Section 2: Closures ─────────────────────────────────────────── -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-display text-lg text-primary">Exceptional closures</h2>
        <button class="btn-primary btn-sm" @click="openClosureModal">
          <SidebarIcon icon="plus" class="w-4 h-4" />
          Add closure
        </button>
      </div>

      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>From</th>
              <th>Until</th>
              <th>Reason</th>
              <th class="w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="closures.length === 0">
              <td colspan="4" class="text-center text-muted py-8">No closures scheduled</td>
            </tr>

            <tr v-for="c in closures" v-else :key="c.id">
              <td class="text-secondary font-mono text-sm">{{ formatClosureDate(c.closedFrom) }}</td>
              <td class="text-secondary font-mono text-sm">{{ closureUntilLabel(c) }}</td>
              <td class="text-secondary">{{ c.reason }}</td>
              <td>
                <button
                  class="btn-icon btn-ghost text-red-400"
                  aria-label="Remove closure"
                  @click="promptRemove(c)"
                >
                  <SidebarIcon icon="trash" class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Closure creation modal -->
    <UiModal v-model="showClosureModal" title="Add closure" size="md">
      <form class="space-y-4" @submit.prevent="saveClosure">
        <div class="form-group">
          <label class="label" for="closure-from">Closed from</label>
          <input id="closure-from" v-model="closureForm.closedFrom" class="input" type="datetime-local" required>
        </div>

        <div class="form-group">
          <span class="label">Type</span>
          <div class="flex gap-4 text-sm">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model.number="closureForm.closureType"
                type="radio"
                :value="ClosureType.UntilNextOpening"
                class="accent-gold-500"
              >
              Until next opening
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model.number="closureForm.closureType"
                type="radio"
                :value="ClosureType.UntilSpecificDate"
                class="accent-gold-500"
              >
              Until specific date
            </label>
          </div>
        </div>

        <div v-if="closureForm.closureType === ClosureType.UntilSpecificDate" class="form-group">
          <label class="label" for="closure-until">Closed until</label>
          <input id="closure-until" v-model="closureForm.closedUntil" class="input" type="datetime-local" required>
        </div>

        <div class="form-group">
          <label class="label" for="closure-reason">Reason</label>
          <input id="closure-reason" v-model="closureForm.reason" class="input" type="text" autocomplete="off" required>
        </div>
      </form>

      <template #footer>
        <button class="btn-ghost btn-sm" @click="showClosureModal = false">Cancel</button>
        <button class="btn-primary btn-sm" :disabled="!closureValid || closureSaving" @click="saveClosure">
          <span v-if="closureSaving" class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin" />
          {{ closureSaving ? 'Saving…' : 'Save' }}
        </button>
      </template>
    </UiModal>

    <!-- Closure removal confirmation -->
    <UiConfirmDialog
      v-model="showRemoveDialog"
      title="Remove closure"
      :message="removeTarget ? `Remove this closure?` : ''"
      confirm-label="Remove"
      :dangerous="true"
      @confirm="confirmRemove"
    />
  </div>
</template>
