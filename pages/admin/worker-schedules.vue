<script setup lang="ts">
// Admin per-worker schedule management page (sprint plan item 5.3).
// Lets an admin narrow or replace a worker's hours for any weekday; days
// left untouched keep following the shop's shared BusinessSchedule (see
// pages/admin/schedule.vue) — mirrors that page's exact editing pattern but
// scoped to whichever worker is selected, with a "Custom" vs "Shop default"
// indicator per row since this page has a fallback concept the shared
// schedule page doesn't.
import type { BusinessSchedule, WorkerSchedule } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

// ── Stores ─────────────────────────────────────────────────────────────────

const workersStore = useWorkersStore()
const scheduleStore = useScheduleStore()
const workerScheduleStore = useWorkerScheduleStore()

const { items: workers } = storeToRefs(workersStore)
const { schedules: shopSchedules } = storeToRefs(scheduleStore)
const { overrides, loading: overridesLoading } = storeToRefs(workerScheduleStore)

// ── Worker selection ─────────────────────────────────────────────────────────

const selectedWorkerId = ref<number | null>(null)

watch(selectedWorkerId, async (id) => {
  if (id) {
    await workerScheduleStore.fetchByWorker(id)
  } else {
    workerScheduleStore.reset()
  }
})

// ── Day labels ─────────────────────────────────────────────────────────────

const DAY_LABELS: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

// ── Merged view: worker override where present, else shop default ──────────

const shopByDay = computed(() => {
  const map: Record<number, BusinessSchedule> = {}
  for (const s of shopSchedules.value) map[s.dayOfWeek] = s
  return map
})

const overrideByDay = computed(() => {
  const map: Record<number, WorkerSchedule> = {}
  for (const o of overrides.value) map[o.dayOfWeek] = o
  return map
})

interface DayRow {
  day: number
  isCustom: boolean
  isOpen: boolean
  openTime?: string
  closeTime?: string
  breakStart?: string
  breakEnd?: string
}

const rows = computed<DayRow[]>(() =>
  ALL_DAYS.map((day) => {
    const override = overrideByDay.value[day]
    const shop = shopByDay.value[day]
    const effective = override ?? shop
    return {
      day,
      isCustom: !!override,
      isOpen: effective?.isOpen ?? false,
      openTime: effective?.openTime,
      closeTime: effective?.closeTime,
      breakStart: effective?.breakStart,
      breakEnd: effective?.breakEnd,
    }
  }),
)

// Local editable copies, keyed by day-of-week (0–6) rather than an override
// id since a day without an override has no id yet.
const draft = reactive<Record<number, Omit<DayRow, 'day' | 'isCustom'>>>({})
const rowSaving = reactive<Record<number, boolean>>({})

watchEffect(() => {
  for (const row of rows.value) {
    draft[row.day] = {
      isOpen: row.isOpen,
      openTime: row.openTime,
      closeTime: row.closeTime,
      breakStart: row.breakStart,
      breakEnd: row.breakEnd,
    }
  }
})

// Strips seconds from the TimeSpan ("HH:MM:SS") returned by the API so the
// HTML time input can display it as "HH:MM".
function toInputTime(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 5)
}

// Appends ":00" to an "HH:MM" input so the API receives a valid TimeSpan.
function toApiTime(value: string | undefined): string | undefined {
  if (!value) return undefined
  return value.length === 5 ? `${value}:00` : value
}

async function saveRow(day: number): Promise<void> {
  const d = draft[day]
  if (!d || !selectedWorkerId.value) return

  rowSaving[day] = true
  await workerScheduleStore.upsert(selectedWorkerId.value, day, {
    dayOfWeek: day,
    isOpen: d.isOpen,
    openTime: toApiTime(d.openTime),
    closeTime: toApiTime(d.closeTime),
    breakStart: toApiTime(d.breakStart),
    breakEnd: toApiTime(d.breakEnd),
  })
  rowSaving[day] = false
}

async function revertRow(day: number): Promise<void> {
  if (!selectedWorkerId.value) return

  rowSaving[day] = true
  await workerScheduleStore.removeOverride(selectedWorkerId.value, day)
  rowSaving[day] = false
}

// ── Lifecycle ───────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([
    workers.value.length === 0 ? workersStore.fetchAll() : Promise.resolve(),
    shopSchedules.value.length === 0 ? scheduleStore.fetchSchedule() : Promise.resolve(),
  ])
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Page header -->
    <div>
      <h1 class="font-display text-2xl text-primary">Worker schedules</h1>
      <p class="text-secondary text-sm mt-1">
        Override a worker's hours for individual weekdays. Days left as "Shop default" follow the
        shared business schedule.
      </p>
    </div>

    <!-- Worker selector -->
    <div class="form-group max-w-sm">
      <label class="label" for="worker-select">Worker</label>
      <select id="worker-select" v-model.number="selectedWorkerId" class="input">
        <option :value="null">Select a worker…</option>
        <option v-for="w in workers" :key="w.id" :value="w.id">{{ w.name }}</option>
      </select>
    </div>

    <p v-if="!selectedWorkerId" class="text-muted text-sm py-8 text-center">
      Select a worker to view or edit their schedule.
    </p>

    <div v-else class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th class="w-32">Day</th>
            <th class="w-28">Status</th>
            <th class="w-24">Open</th>
            <th>Open time</th>
            <th>Close time</th>
            <th>Break start</th>
            <th>Break end</th>
            <th class="w-40">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="overridesLoading && rows.length === 0">
            <tr v-for="i in 7" :key="i">
              <td colspan="8"><UiSkeleton height="h-12" /></td>
            </tr>
          </template>

          <tr v-for="row in rows" v-else :key="row.day">
            <td class="font-medium text-primary">{{ DAY_LABELS[row.day] }}</td>
            <td>
              <span
                class="text-xs font-mono px-2 py-0.5 rounded"
                :class="row.isCustom ? 'bg-gold-500/10 text-gold-400' : 'text-muted'"
              >
                {{ row.isCustom ? 'Custom' : 'Shop default' }}
              </span>
            </td>
            <td>
              <input
                v-model="draft[row.day]!.isOpen"
                type="checkbox"
                class="accent-gold-500 w-4 h-4"
                :aria-label="`Toggle ${DAY_LABELS[row.day]} open`"
              >
            </td>
            <td :class="{ 'opacity-50 pointer-events-none': !draft[row.day]?.isOpen }">
              <input
                :value="toInputTime(draft[row.day]?.openTime)"
                class="input input-sm font-mono"
                type="time"
                @input="(e) => draft[row.day]!.openTime = (e.target as HTMLInputElement).value"
              >
            </td>
            <td :class="{ 'opacity-50 pointer-events-none': !draft[row.day]?.isOpen }">
              <input
                :value="toInputTime(draft[row.day]?.closeTime)"
                class="input input-sm font-mono"
                type="time"
                @input="(e) => draft[row.day]!.closeTime = (e.target as HTMLInputElement).value"
              >
            </td>
            <td :class="{ 'opacity-50 pointer-events-none': !draft[row.day]?.isOpen }">
              <input
                :value="toInputTime(draft[row.day]?.breakStart)"
                class="input input-sm font-mono"
                type="time"
                @input="(e) => draft[row.day]!.breakStart = (e.target as HTMLInputElement).value"
              >
            </td>
            <td :class="{ 'opacity-50 pointer-events-none': !draft[row.day]?.isOpen }">
              <input
                :value="toInputTime(draft[row.day]?.breakEnd)"
                class="input input-sm font-mono"
                type="time"
                @input="(e) => draft[row.day]!.breakEnd = (e.target as HTMLInputElement).value"
              >
            </td>
            <td class="flex gap-2">
              <button
                class="btn-primary btn-sm"
                :disabled="rowSaving[row.day]"
                @click="saveRow(row.day)"
              >
                {{ rowSaving[row.day] ? '…' : 'Save' }}
              </button>
              <button
                v-if="row.isCustom"
                class="btn-ghost btn-sm"
                :disabled="rowSaving[row.day]"
                @click="revertRow(row.day)"
              >
                Revert
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
