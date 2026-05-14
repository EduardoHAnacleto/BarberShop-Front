<script setup lang="ts">
// Admin workers management page.
// Provides a searchable table, create/edit modal with service multi-select,
// and delete confirmation. See sprint plan S2.3 for the full spec.
import type { Worker } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

// ── Stores ─────────────────────────────────────────────────────────────────

const workersStore = useWorkersStore()
const servicesStore = useServicesStore()

const { items, loading } = storeToRefs(workersStore)

// ── Filter ─────────────────────────────────────────────────────────────────

// Free-text search applied across name, position, and email.
const searchQuery = ref('')

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return items.value
  return items.value.filter(
    (w) =>
      w.name.toLowerCase().includes(q) ||
      w.position.toLowerCase().includes(q) ||
      w.email.toLowerCase().includes(q),
  )
})

// ── Sort state ─────────────────────────────────────────────────────────────

type WorkerSortKey = 'name' | 'position' | 'wage' | 'services'

const sortKey = ref<WorkerSortKey>('name')
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(key: WorkerSortKey): void {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

const sorted = computed(() => {
  const d = sortDir.value === 'asc' ? 1 : -1
  return [...filtered.value].sort((a, b) => {
    switch (sortKey.value) {
      case 'name':     return d * a.name.localeCompare(b.name)
      case 'position': return d * a.position.localeCompare(b.position)
      case 'wage':     return d * (a.wagePerHour - b.wagePerHour)
      case 'services': return d * (a.providedServices.length - b.providedServices.length)
      default:         return 0
    }
  })
})

// ── Pagination ─────────────────────────────────────────────────────────────

const pageSize = ref(20)

// Reset to first page whenever filter or sort changes.
watch([searchQuery, sortKey, sortDir], () => { pageSize.value = 20 })

const paginated = computed(() => sorted.value.slice(0, pageSize.value))

function loadMore(): void { pageSize.value += 20 }

// ── Create / Edit modal ────────────────────────────────────────────────────

const showModal = ref(false)
const editing = ref<Worker | null>(null)

// Reactive form state bound to the modal inputs.
const form = reactive({
  name: '',
  email: '',
  phoneNumber: '',
  address: '',
  position: '',
  wagePerHour: 0,
  dateOfBirth: '',
  servicesId: [] as number[],
})

const saving = ref(false)

// Client-side validation: name ≥ 10 chars, salary > 0, email present.
const formValid = computed(
  () => form.name.trim().length >= 10 && form.wagePerHour > 0 && form.email.trim() !== '',
)

function openCreate(): void {
  editing.value = null
  Object.assign(form, {
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    position: '',
    wagePerHour: 0,
    dateOfBirth: '',
    servicesId: [],
  })
  showModal.value = true
}

function openEdit(w: Worker): void {
  editing.value = w
  Object.assign(form, {
    name: w.name,
    email: w.email,
    phoneNumber: w.phoneNumber,
    address: w.address,
    position: w.position,
    wagePerHour: w.wagePerHour,
    dateOfBirth: w.dateOfBirth?.slice(0, 10) ?? '',
    servicesId: w.providedServices.map((s) => s.id),
  })
  showModal.value = true
}

// Toggles a service ID in the servicesId array.
function toggleService(id: number): void {
  if (form.servicesId.includes(id)) {
    form.servicesId = form.servicesId.filter((s) => s !== id)
  } else {
    form.servicesId = [...form.servicesId, id]
  }
}

async function saveWorker(): Promise<void> {
  if (!formValid.value) return
  saving.value = true
  // Empty-string dates break the .NET DateTime deserializer with a 400, so
  // omit dateOfBirth entirely when the user did not fill it.
  const { dateOfBirth, ...rest } = form
  const body: Partial<Worker> = dateOfBirth ? { ...rest, dateOfBirth } : rest
  const ok = editing.value
    ? await workersStore.update(editing.value.id, body)
    : await workersStore.create(body)
  saving.value = false
  if (ok) {
    showModal.value = false
    await workersStore.fetchAll()
  }
}

// ── Delete confirmation ─────────────────────────────────────────────────────

const showDeleteDialog = ref(false)
const deleteTarget = ref<Worker | null>(null)

function promptDelete(w: Worker): void {
  deleteTarget.value = w
  showDeleteDialog.value = true
}

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return
  const ok = await workersStore.remove(deleteTarget.value.id)
  if (ok) {
    showDeleteDialog.value = false
    deleteTarget.value = null
    await workersStore.fetchAll()
  }
}

// ── Lifecycle ───────────────────────────────────────────────────────────────

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  await Promise.all([workersStore.fetchAll(), servicesStore.fetchAll()])
  unsubscribe = workersStore.subscribeRealtime()
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <h1 class="font-display text-2xl text-primary">Workers</h1>
      <button class="btn-primary btn-sm" @click="openCreate">
        <SidebarIcon icon="plus" class="w-4 h-4" />
        New worker
      </button>
    </div>

    <!-- Search bar -->
    <div class="card">
      <div class="relative max-w-sm">
        <SidebarIcon icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          v-model="searchQuery"
          class="input pl-9"
          type="search"
          placeholder="Search name, position, email…"
          autocomplete="off"
        >
      </div>
    </div>

    <!-- Workers table + pagination footer -->
    <div class="space-y-3">
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th class="w-12">Avatar</th>
            <th>
              <button type="button" class="flex items-center gap-1.5 hover:text-primary transition-colors" @click="toggleSort('name')">
                Name <UiSortIcon :active="sortKey === 'name'" :dir="sortDir" />
              </button>
            </th>
            <th>
              <button type="button" class="flex items-center gap-1.5 hover:text-primary transition-colors" @click="toggleSort('position')">
                Position <UiSortIcon :active="sortKey === 'position'" :dir="sortDir" />
              </button>
            </th>
            <th>Phone</th>
            <th>
              <button type="button" class="flex items-center gap-1.5 hover:text-primary transition-colors" @click="toggleSort('wage')">
                Wage/h <UiSortIcon :active="sortKey === 'wage'" :dir="sortDir" />
              </button>
            </th>
            <th>
              <button type="button" class="flex items-center gap-1.5 hover:text-primary transition-colors" @click="toggleSort('services')">
                Services <UiSortIcon :active="sortKey === 'services'" :dir="sortDir" />
              </button>
            </th>
            <th class="w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Skeleton while loading -->
          <template v-if="loading">
            <tr v-for="i in 5" :key="i">
              <td colspan="7"><UiSkeleton height="h-12" /></td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else-if="sorted.length === 0">
            <td colspan="7" class="text-center text-muted py-12">No workers found</td>
          </tr>

          <!-- Data rows -->
          <tr v-for="w in paginated" v-else :key="w.id">
            <!-- Avatar: coloured circle with first initial -->
            <td>
              <div
                class="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/30
                       flex items-center justify-center font-display font-bold text-gold-400 text-sm"
              >
                {{ w.name.charAt(0).toUpperCase() }}
              </div>
            </td>
            <td>
              <div class="font-medium text-primary">{{ w.name }}</div>
              <div class="text-xs text-muted">{{ w.email }}</div>
            </td>
            <td class="text-secondary">{{ w.position }}</td>
            <td class="text-secondary font-mono text-sm">{{ w.phoneNumber }}</td>
            <td class="font-mono text-sm text-secondary">
              ${{ w.wagePerHour.toFixed(2) }}/h
            </td>
            <!-- Service tags: show first 3, then +N badge if more -->
            <td>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="s in w.providedServices.slice(0, 3)"
                  :key="s.id"
                  class="badge badge-gold"
                >
                  {{ s.name }}
                </span>
                <span v-if="w.providedServices.length > 3" class="badge badge-gray">
                  +{{ w.providedServices.length - 3 }}
                </span>
              </div>
            </td>
            <td>
              <div class="flex gap-1">
                <button class="btn-icon btn-ghost" aria-label="Edit worker" @click="openEdit(w)">
                  <SidebarIcon icon="edit" class="w-4 h-4" />
                </button>
                <button class="btn-icon btn-ghost text-red-400" aria-label="Remove worker" @click="promptDelete(w)">
                  <SidebarIcon icon="trash" class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination footer -->
    <div v-if="sorted.length > 0" class="flex items-center justify-between px-1">
      <span class="text-xs text-muted font-mono">
        Showing {{ paginated.length }} of {{ sorted.length }}
      </span>
      <button
        v-if="paginated.length < sorted.length"
        type="button"
        class="btn-ghost btn-sm"
        @click="loadMore"
      >
        Show 20 more
      </button>
    </div>
    </div>

    <!-- Create / Edit modal -->
    <UiModal v-model="showModal" :title="editing ? 'Edit worker' : 'New worker'" size="md">
      <form class="space-y-4" @submit.prevent="saveWorker">
        <!-- Name -->
        <div class="form-group">
          <label class="label" for="worker-name">Name <span class="text-muted">(min 10 chars)</span></label>
          <input
            id="worker-name"
            v-model="form.name"
            class="input"
            type="text"
            minlength="10"
            autocomplete="name"
            required
          >
          <p v-if="form.name.length > 0 && form.name.trim().length < 10" class="text-xs text-red-400 mt-1">
            Name must be at least 10 characters
          </p>
        </div>

        <!-- Email -->
        <div class="form-group">
          <label class="label" for="worker-email">Email</label>
          <input id="worker-email" v-model="form.email" class="input" type="email" autocomplete="email" required>
        </div>

        <!-- Phone -->
        <div class="form-group">
          <label class="label" for="worker-phone">Phone</label>
          <input id="worker-phone" v-model="form.phoneNumber" class="input" type="tel" autocomplete="tel">
        </div>

        <!-- Address -->
        <div class="form-group">
          <label class="label" for="worker-address">Address</label>
          <input id="worker-address" v-model="form.address" class="input" type="text" autocomplete="street-address">
        </div>

        <!-- Position -->
        <div class="form-group">
          <label class="label" for="worker-position">Position</label>
          <input id="worker-position" v-model="form.position" class="input" type="text" autocomplete="organization-title">
        </div>

        <!-- Wage per hour -->
        <div class="form-group">
          <label class="label" for="worker-wage">Wage per hour ($)</label>
          <input
            id="worker-wage"
            v-model.number="form.wagePerHour"
            class="input"
            type="number"
            min="0.01"
            step="0.01"
            autocomplete="off"
            required
          >
          <p v-if="form.wagePerHour <= 0 && form.wagePerHour !== 0" class="text-xs text-red-400 mt-1">
            Wage must be greater than 0
          </p>
        </div>

        <!-- Date of birth -->
        <div class="form-group">
          <label class="label" for="worker-dob">Date of birth</label>
          <input id="worker-dob" v-model="form.dateOfBirth" class="input" type="date" autocomplete="bday">
        </div>

        <!-- Services multi-select -->
        <div class="form-group">
          <span class="label">Services provided</span>
          <div class="surface rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
            <label
              v-for="s in servicesStore.items"
              :key="s.id"
              class="flex items-center gap-2 text-sm text-secondary cursor-pointer hover:text-primary"
            >
              <input
                type="checkbox"
                :checked="form.servicesId.includes(s.id)"
                class="accent-gold-500 w-4 h-4"
                @change="toggleService(s.id)"
              >
              {{ s.name }}
            </label>
            <p v-if="servicesStore.items.length === 0" class="text-muted text-xs">No services available</p>
          </div>
        </div>
      </form>

      <template #footer>
        <button class="btn-ghost btn-sm" @click="showModal = false">Cancel</button>
        <button
          class="btn-primary btn-sm"
          :disabled="!formValid || saving"
          @click="saveWorker"
        >
          <span v-if="saving" class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin" />
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </template>
    </UiModal>

    <!-- Delete confirmation -->
    <UiConfirmDialog
      v-model="showDeleteDialog"
      title="Remove worker"
      :message="deleteTarget ? `Remove ${deleteTarget.name} from the team?` : ''"
      confirm-label="Remove"
      :dangerous="true"
      @confirm="confirmDelete"
    />
  </div>
</template>
