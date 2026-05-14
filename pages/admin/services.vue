<script setup lang="ts">
// Admin services management page.
// Provides a searchable table, create/edit modal with duration/price inputs,
// and delete confirmation. See sprint plan S3.2 for the full spec.
import type { Service } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

// ── Stores ─────────────────────────────────────────────────────────────────

const servicesStore = useServicesStore()
const { items, loading } = storeToRefs(servicesStore)

// ── Filter ─────────────────────────────────────────────────────────────────

// Free-text search applied across name and description.
const searchQuery = ref('')

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return items.value
  return items.value.filter(
    (s) =>
      s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
  )
})

// ── Create / Edit modal ────────────────────────────────────────────────────

const showModal = ref(false)
const editing = ref<Service | null>(null)

const form = reactive({
  name: '',
  description: '',
  duration: 0,
  price: 0,
})

const saving = ref(false)

// Client-side validation: name ≥ 3 chars, duration > 0, price > 0.
const formValid = computed(
  () => form.name.trim().length >= 3 && form.duration > 0 && form.price > 0,
)

function openCreate(): void {
  editing.value = null
  Object.assign(form, { name: '', description: '', duration: 0, price: 0 })
  showModal.value = true
}

function openEdit(s: Service): void {
  editing.value = s
  Object.assign(form, {
    name: s.name,
    description: s.description,
    duration: s.duration,
    price: s.price,
  })
  showModal.value = true
}

async function saveService(): Promise<void> {
  if (!formValid.value) return
  saving.value = true
  const body: Partial<Service> = { ...form }
  const ok = editing.value
    ? await servicesStore.update(editing.value.id, body)
    : await servicesStore.create(body)
  saving.value = false
  if (ok) {
    showModal.value = false
    await servicesStore.fetchAll()
  }
}

// ── Delete confirmation ─────────────────────────────────────────────────────

const showDeleteDialog = ref(false)
const deleteTarget = ref<Service | null>(null)

function promptDelete(s: Service): void {
  deleteTarget.value = s
  showDeleteDialog.value = true
}

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return
  const ok = await servicesStore.remove(deleteTarget.value.id)
  if (ok) {
    showDeleteDialog.value = false
    deleteTarget.value = null
    await servicesStore.fetchAll()
  }
}

// Truncates a string to N characters, appending an ellipsis when cut.
function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

// ── Lifecycle ───────────────────────────────────────────────────────────────

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  await servicesStore.fetchAll()
  unsubscribe = servicesStore.subscribeRealtime()
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <h1 class="font-display text-2xl text-primary">Services</h1>
      <button class="btn-primary btn-sm" @click="openCreate">
        <SidebarIcon icon="plus" class="w-4 h-4" />
        New service
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
          placeholder="Search name, description…"
          autocomplete="off"
        >
      </div>
    </div>

    <!-- Services table -->
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Duration</th>
            <th>Price</th>
            <th class="w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="i in 5" :key="i">
              <td colspan="5"><UiSkeleton height="h-12" /></td>
            </tr>
          </template>

          <tr v-else-if="filtered.length === 0">
            <td colspan="5" class="text-center text-muted py-12">No services found</td>
          </tr>

          <tr v-for="s in filtered" v-else :key="s.id">
            <td class="font-medium text-primary">{{ s.name }}</td>
            <td class="text-secondary text-sm">{{ truncate(s.description, 60) }}</td>
            <td class="text-secondary font-mono text-sm">{{ s.duration }}min</td>
            <td class="text-secondary font-mono text-sm">${{ s.price.toFixed(2) }}</td>
            <td>
              <div class="flex gap-1">
                <button class="btn-icon btn-ghost" aria-label="Edit service" @click="openEdit(s)">
                  <SidebarIcon icon="edit" class="w-4 h-4" />
                </button>
                <button
                  class="btn-icon btn-ghost text-red-400"
                  aria-label="Remove service"
                  @click="promptDelete(s)"
                >
                  <SidebarIcon icon="trash" class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / Edit modal -->
    <UiModal v-model="showModal" :title="editing ? 'Edit service' : 'New service'" size="md">
      <form class="space-y-4" @submit.prevent="saveService">
        <div class="form-group">
          <label class="label" for="service-name">Name <span class="text-muted">(min 3 chars)</span></label>
          <input id="service-name" v-model="form.name" class="input" type="text" minlength="3" autocomplete="off" required>
          <p v-if="form.name.length > 0 && form.name.trim().length < 3" class="text-xs text-red-400 mt-1">
            Name must be at least 3 characters
          </p>
        </div>

        <div class="form-group">
          <label class="label" for="service-description">Description</label>
          <textarea id="service-description" v-model="form.description" class="input min-h-[80px]" autocomplete="off" />
        </div>

        <div class="form-group">
          <label class="label" for="service-duration">Duration (minutes)</label>
          <input
            id="service-duration"
            v-model.number="form.duration"
            class="input"
            type="number"
            min="1"
            step="1"
            autocomplete="off"
            required
          >
          <p v-if="form.duration <= 0 && form.duration !== 0" class="text-xs text-red-400 mt-1">
            Duration must be greater than 0
          </p>
        </div>

        <div class="form-group">
          <label class="label" for="service-price">Price ($)</label>
          <input
            id="service-price"
            v-model.number="form.price"
            class="input"
            type="number"
            min="0.01"
            step="0.01"
            autocomplete="off"
            required
          >
          <p v-if="form.price <= 0 && form.price !== 0" class="text-xs text-red-400 mt-1">
            Price must be greater than 0
          </p>
        </div>
      </form>

      <template #footer>
        <button class="btn-ghost btn-sm" @click="showModal = false">Cancel</button>
        <button class="btn-primary btn-sm" :disabled="!formValid || saving" @click="saveService">
          <span v-if="saving" class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin" />
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </template>
    </UiModal>

    <!-- Delete confirmation -->
    <UiConfirmDialog
      v-model="showDeleteDialog"
      title="Remove service"
      :message="deleteTarget ? `Remove ${deleteTarget.name}?` : ''"
      confirm-label="Remove"
      :dangerous="true"
      @confirm="confirmDelete"
    />
  </div>
</template>
