<script setup lang="ts">
// Admin customers management page.
// Provides a searchable table, create/edit modal with date-of-birth picker,
// and delete confirmation. See sprint plan S3.2 for the full spec.
import dayjs from 'dayjs'
import type { Customer } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

// ── Stores ─────────────────────────────────────────────────────────────────

const customersStore = useCustomersStore()
const { items, loading } = storeToRefs(customersStore)

// ── Filter ─────────────────────────────────────────────────────────────────

// Free-text search applied across name and email.
const searchQuery = ref('')

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return items.value
  return items.value.filter(
    (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
  )
})

// ── Sort state ─────────────────────────────────────────────────────────────

type CustomerSortKey = 'name' | 'dob'

const sortKey = ref<CustomerSortKey>('name')
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(key: CustomerSortKey): void {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

const sorted = computed(() => {
  const d = sortDir.value === 'asc' ? 1 : -1
  return [...filtered.value].sort((a, b) => {
    switch (sortKey.value) {
      case 'name': return d * a.name.localeCompare(b.name)
      case 'dob': {
        // Null dates always go last regardless of direction.
        if (!a.dateOfBirth && !b.dateOfBirth) return 0
        if (!a.dateOfBirth) return 1
        if (!b.dateOfBirth) return -1
        return d * (new Date(a.dateOfBirth).getTime() - new Date(b.dateOfBirth).getTime())
      }
      default: return 0
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
const editing = ref<Customer | null>(null)

const form = reactive({
  name: '',
  email: '',
  phoneNumber: '',
  dateOfBirth: '',
})

const saving = ref(false)

// Client-side validation: name required.
const formValid = computed(() => form.name.trim().length > 0)

function openCreate(): void {
  editing.value = null
  Object.assign(form, { name: '', email: '', phoneNumber: '', dateOfBirth: '' })
  showModal.value = true
}

function openEdit(c: Customer): void {
  editing.value = c
  Object.assign(form, {
    name: c.name,
    email: c.email,
    phoneNumber: c.phoneNumber,
    dateOfBirth: c.dateOfBirth?.slice(0, 10) ?? '',
  })
  showModal.value = true
}

async function saveCustomer(): Promise<void> {
  if (!formValid.value) return
  saving.value = true
  // Empty-string dates break the .NET DateTime deserializer with a 400, so
  // omit dateOfBirth entirely when the user did not fill it.
  const { dateOfBirth, ...rest } = form
  const body: Partial<Customer> = dateOfBirth ? { ...rest, dateOfBirth } : rest
  const ok = editing.value
    ? await customersStore.update(editing.value.id, body)
    : await customersStore.create(body)
  saving.value = false
  if (ok) {
    showModal.value = false
    await customersStore.fetchAll()
  }
}

// ── Delete confirmation ─────────────────────────────────────────────────────

const showDeleteDialog = ref(false)
const deleteTarget = ref<Customer | null>(null)

function promptDelete(c: Customer): void {
  deleteTarget.value = c
  showDeleteDialog.value = true
}

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return
  const ok = await customersStore.remove(deleteTarget.value.id)
  if (ok) {
    showDeleteDialog.value = false
    deleteTarget.value = null
    await customersStore.fetchAll()
  }
}

// Formats an ISO date string as "MMM DD, YYYY" — empty string for null/blank.
function formatDob(iso: string | null | undefined): string {
  if (!iso) return '—'
  return dayjs(iso).format('MMM DD, YYYY')
}

// ── Lifecycle ───────────────────────────────────────────────────────────────

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  await customersStore.fetchAll()
  unsubscribe = customersStore.subscribeRealtime()
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <h1 class="font-display text-2xl text-primary">Customers</h1>
      <button class="btn-primary btn-sm" @click="openCreate">
        <SidebarIcon icon="plus" class="w-4 h-4" />
        New customer
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
          placeholder="Search name, email…"
          autocomplete="off"
        >
      </div>
    </div>

    <!-- Customers table + pagination footer -->
    <div class="space-y-3">
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">
              <button type="button" class="flex items-center gap-1.5 hover:text-primary transition-colors" @click="toggleSort('name')">
                Name <UiSortIcon :active="sortKey === 'name'" :dir="sortDir" />
              </button>
            </th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">
              <button type="button" class="flex items-center gap-1.5 hover:text-primary transition-colors" @click="toggleSort('dob')">
                Date of birth <UiSortIcon :active="sortKey === 'dob'" :dir="sortDir" />
              </button>
            </th>
            <th scope="col" class="w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="i in 5" :key="i">
              <td colspan="5"><UiSkeleton height="h-12" /></td>
            </tr>
          </template>

          <tr v-else-if="sorted.length === 0">
            <td colspan="5" class="text-center text-muted py-12">No customers found</td>
          </tr>

          <tr v-for="c in paginated" v-else :key="c.id">
            <td class="font-medium text-primary">{{ c.name }}</td>
            <td class="text-secondary">{{ c.email }}</td>
            <td class="text-secondary font-mono text-sm">{{ c.phoneNumber }}</td>
            <td class="text-secondary font-mono text-sm">{{ formatDob(c.dateOfBirth) }}</td>
            <td>
              <div class="flex gap-1">
                <button class="btn-icon btn-ghost" aria-label="Edit customer" @click="openEdit(c)">
                  <SidebarIcon icon="edit" class="w-4 h-4" />
                </button>
                <button
                  class="btn-icon btn-ghost text-red-400"
                  aria-label="Remove customer"
                  @click="promptDelete(c)"
                >
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
    <UiModal v-model="showModal" :title="editing ? 'Edit customer' : 'New customer'" size="md">
      <form class="space-y-4" @submit.prevent="saveCustomer">
        <div class="form-group">
          <label class="label" for="customer-name">Name</label>
          <input id="customer-name" v-model="form.name" class="input" type="text" autocomplete="name" required>
        </div>

        <div class="form-group">
          <label class="label" for="customer-email">Email</label>
          <input id="customer-email" v-model="form.email" class="input" type="email" autocomplete="email">
        </div>

        <div class="form-group">
          <label class="label" for="customer-phone">Phone</label>
          <input id="customer-phone" v-model="form.phoneNumber" class="input" type="tel" autocomplete="tel">
        </div>

        <div class="form-group">
          <label class="label" for="customer-dob">Date of birth</label>
          <input id="customer-dob" v-model="form.dateOfBirth" class="input" type="date" autocomplete="bday">
        </div>
      </form>

      <template #footer>
        <button class="btn-ghost btn-sm" @click="showModal = false">Cancel</button>
        <button class="btn-primary btn-sm" :disabled="!formValid || saving" @click="saveCustomer">
          <span v-if="saving" class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin" />
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </template>
    </UiModal>

    <!-- Delete confirmation -->
    <UiConfirmDialog
      v-model="showDeleteDialog"
      title="Remove customer"
      :message="deleteTarget ? `Remove ${deleteTarget.name}?` : ''"
      confirm-label="Remove"
      :dangerous="true"
      @confirm="confirmDelete"
    />
  </div>
</template>
