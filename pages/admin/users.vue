<script setup lang="ts">
// Admin user accounts management page.
// Table includes role badge, active flag, lockout indicator, and an Unlock
// button visible only when the account is currently locked. See S3.3.
import dayjs from 'dayjs'
import { UserRole } from '~/types'
import type { User, UserRequest } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

// ── Stores ─────────────────────────────────────────────────────────────────

const usersStore = useUsersStore()
const customersStore = useCustomersStore()
const workersStore = useWorkersStore()
const { items, loading } = storeToRefs(usersStore)

// ── Filter ─────────────────────────────────────────────────────────────────

// Free-text search on email.
const searchQuery = ref('')

// Role filter; null means "all roles".
const roleFilter = ref<number | null>(null)

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return items.value.filter((u) => {
    const matchesQuery = !q || u.email.toLowerCase().includes(q)
    const matchesRole = roleFilter.value === null || u.userRole === roleFilter.value
    return matchesQuery && matchesRole
  })
})

// ── Sort state ─────────────────────────────────────────────────────────────

type UserSortKey = 'role' | 'status' | 'lockout'

const sortKey = ref<UserSortKey>('role')
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(key: UserSortKey): void {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

const sorted = computed(() => {
  const d = sortDir.value === 'asc' ? 1 : -1
  return [...filtered.value].sort((a, b) => {
    switch (sortKey.value) {
      case 'role':   return d * (a.userRole - b.userRole)
      case 'status': return d * ((a.isActive ? 1 : 0) - (b.isActive ? 1 : 0))
      case 'lockout': {
        // Null lockouts go last regardless of direction.
        if (!a.lockoutEnd && !b.lockoutEnd) return 0
        if (!a.lockoutEnd) return 1
        if (!b.lockoutEnd) return -1
        return d * (new Date(a.lockoutEnd).getTime() - new Date(b.lockoutEnd).getTime())
      }
      default: return 0
    }
  })
})

// ── Pagination ─────────────────────────────────────────────────────────────

const pageSize = ref(20)

// Reset to first page whenever filter or sort changes.
watch([searchQuery, roleFilter, sortKey, sortDir], () => { pageSize.value = 20 })

const paginated = computed(() => sorted.value.slice(0, pageSize.value))

function loadMore(): void { pageSize.value += 20 }

// ── Create / Edit modal ────────────────────────────────────────────────────

const showModal = ref(false)
const editing = ref<User | null>(null)

const form = reactive({
  email: '',
  password: '',
  userRole: UserRole.Client as UserRole,
  isActive: true,
  customerId: null as number | null,
  workerId: null as number | null,
})

const saving = ref(false)

// Validation: email required; password required + min 8 chars only when creating.
const formValid = computed(() => {
  if (!form.email.trim()) return false
  if (!editing.value && form.password.length < 8) return false
  return true
})

function openCreate(): void {
  editing.value = null
  Object.assign(form, {
    email: '',
    password: '',
    userRole: UserRole.Client,
    isActive: true,
    customerId: null,
    workerId: null,
  })
  showModal.value = true
}

function openEdit(u: User): void {
  editing.value = u
  Object.assign(form, {
    email: u.email,
    password: '',
    userRole: u.userRole,
    isActive: u.isActive,
    customerId: u.customerId ?? null,
    workerId: u.workerId ?? null,
  })
  showModal.value = true
}

async function saveUser(): Promise<void> {
  if (!formValid.value) return
  saving.value = true

  // Backend's AutoMapper hashes whatever lands in PasswordHash, so we send the
  // plain password under that key. On edit, omit the password to keep the
  // existing hash; the backend treats an empty string as "no change" only when
  // it has been configured to, so we just pass the original value.
  const body: UserRequest = {
    email: form.email,
    passwordHash: editing.value ? '' : form.password,
    userRole: form.userRole,
    isActive: form.isActive,
    customerId: form.customerId ?? undefined,
    workerId: form.workerId ?? undefined,
  }

  const ok = editing.value
    ? await usersStore.update(editing.value.id, body)
    : await usersStore.create(body)

  saving.value = false
  if (ok) {
    showModal.value = false
    await usersStore.fetchAll()
  }
}

// ── Delete confirmation ─────────────────────────────────────────────────────

const showDeleteDialog = ref(false)
const deleteTarget = ref<User | null>(null)

function promptDelete(u: User): void {
  deleteTarget.value = u
  showDeleteDialog.value = true
}

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return
  const ok = await usersStore.remove(deleteTarget.value.id)
  if (ok) {
    showDeleteDialog.value = false
    deleteTarget.value = null
    await usersStore.fetchAll()
  }
}

// ── Unlock action ───────────────────────────────────────────────────────────

const showUnlockDialog = ref(false)
const unlockTarget = ref<User | null>(null)

// Opens the confirmation modal for the given locked user.
function promptUnlock(u: User): void {
  unlockTarget.value = u
  showUnlockDialog.value = true
}

// Called after the admin confirms the modal — clears lockout and refreshes.
async function confirmUnlock(): Promise<void> {
  if (!unlockTarget.value) return
  const ok = await usersStore.unlock(unlockTarget.value.id)
  if (ok) {
    showUnlockDialog.value = false
    unlockTarget.value = null
    await usersStore.fetchAll()
  }
}

// Returns true when the user has an active lockout in the future.
function isLocked(u: User): boolean {
  return !!u.lockoutEnd && new Date(u.lockoutEnd) > new Date()
}

// ── Display helpers ─────────────────────────────────────────────────────────

// Maps a numeric role to its badge class + label.
const ROLE_DISPLAY: Record<UserRole, { cls: string; label: string }> = {
  [UserRole.Admin]: { cls: 'badge-gold', label: 'Admin' },
  [UserRole.User]: { cls: 'badge-blue', label: 'User' },
  [UserRole.Client]: { cls: 'badge-gray', label: 'Client' },
}

function roleBadge(role: UserRole): { cls: string; label: string } {
  return ROLE_DISPLAY[role] ?? { cls: 'badge-gray', label: 'Unknown' }
}

// Formats an ISO date for the "Created at" column.
function formatCreated(iso: string): string {
  return dayjs(iso).format('MMM DD, YYYY')
}

// Formats the lockout end timestamp.
function formatLockout(iso: string): string {
  return dayjs(iso).format('MMM DD, HH:mm')
}

// ── Link select options ─────────────────────────────────────────────────────

// id=0 acts as "no selection"; the @update handler converts 0 back to null.
const customerOptions = computed(() => [
  { id: 0, label: '— None —' },
  ...customersStore.items.map((c) => ({ id: c.id, label: c.name })),
])

const workerOptions = computed(() => [
  { id: 0, label: '— None —' },
  ...workersStore.items.map((w) => ({ id: w.id, label: w.name })),
])

// ── Email auto-fill ─────────────────────────────────────────────────────────

const emailDropdownOpen = ref(false)

// Unique non-empty emails collected from the selected customer and worker.
// Returns 0, 1, or 2 entries. Two entries means the emails differ.
const emailSuggestions = computed<string[]>(() => {
  const emails: string[] = []
  if (form.customerId) {
    const c = customersStore.items.find((x) => x.id === form.customerId)
    if (c?.email) emails.push(c.email)
  }
  if (form.workerId) {
    const w = workersStore.items.find((x) => x.id === form.workerId)
    if (w?.email && !emails.includes(w.email)) emails.push(w.email)
  }
  return emails
})

// Auto-fill the email when there is exactly one unique suggestion.
// When two different emails are available the dropdown lets the user choose.
watch(emailSuggestions, (suggestions) => {
  const [onlySuggestion] = suggestions
  if (suggestions.length === 1 && onlySuggestion !== undefined) form.email = onlySuggestion
})

function onEmailFocus(): void {
  if (emailSuggestions.value.length > 1) emailDropdownOpen.value = true
}

function onEmailBlur(): void {
  emailDropdownOpen.value = false
}

function pickEmail(email: string): void {
  form.email = email
  emailDropdownOpen.value = false
}

// ── Lifecycle ───────────────────────────────────────────────────────────────

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  await Promise.all([
    usersStore.fetchAll(),
    customersStore.fetchAll(),
    workersStore.fetchAll(),
  ])
  unsubscribe = usersStore.subscribeRealtime()
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <h1 class="font-display text-2xl text-primary">Users</h1>
      <button class="btn-primary btn-sm" @click="openCreate">
        <SidebarIcon icon="plus" class="w-4 h-4" />
        New user
      </button>
    </div>

    <!-- Filter bar -->
    <div class="card flex flex-wrap gap-3">
      <div class="relative max-w-sm flex-1 min-w-[200px]">
        <SidebarIcon icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          v-model="searchQuery"
          class="input pl-9"
          type="search"
          placeholder="Search email…"
          autocomplete="off"
        >
      </div>

      <select v-model="roleFilter" class="input max-w-[180px]">
        <option :value="null">All roles</option>
        <option :value="UserRole.Admin">Admin</option>
        <option :value="UserRole.User">User</option>
        <option :value="UserRole.Client">Client</option>
      </select>
    </div>

    <!-- Users table + pagination footer -->
    <div class="space-y-3">
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Email</th>
            <th scope="col">
              <button type="button" class="flex items-center gap-1.5 hover:text-primary transition-colors" @click="toggleSort('role')">
                Role <UiSortIcon :active="sortKey === 'role'" :dir="sortDir" />
              </button>
            </th>
            <th scope="col">
              <button type="button" class="flex items-center gap-1.5 hover:text-primary transition-colors" @click="toggleSort('status')">
                Status <UiSortIcon :active="sortKey === 'status'" :dir="sortDir" />
              </button>
            </th>
            <th scope="col">Created</th>
            <th scope="col">
              <button type="button" class="flex items-center gap-1.5 hover:text-primary transition-colors" @click="toggleSort('lockout')">
                Lockout <UiSortIcon :active="sortKey === 'lockout'" :dir="sortDir" />
              </button>
            </th>
            <th scope="col" class="w-32">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="i in 5" :key="i">
              <td colspan="6"><UiSkeleton height="h-12" /></td>
            </tr>
          </template>

          <tr v-else-if="sorted.length === 0">
            <td colspan="6" class="text-center text-muted py-12">No users found</td>
          </tr>

          <tr v-for="u in paginated" v-else :key="u.id">
            <td class="font-medium text-primary">{{ u.email }}</td>
            <td>
              <span class="badge" :class="roleBadge(u.userRole).cls">{{ roleBadge(u.userRole).label }}</span>
            </td>
            <td>
              <span class="badge" :class="u.isActive ? 'badge-green' : 'badge-red'">
                {{ u.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="text-secondary font-mono text-sm">{{ formatCreated(u.createdAt) }}</td>
            <td>
              <span v-if="isLocked(u)" class="text-xs text-red-400 font-mono">
                Locked until {{ formatLockout(u.lockoutEnd!) }}
              </span>
              <span v-else class="text-muted text-xs">—</span>
            </td>
            <td>
              <div class="flex gap-1">
                <button
                  v-if="isLocked(u)"
                  class="btn-icon btn-ghost text-emerald-400"
                  aria-label="Remove lockout"
                  title="Remove lockout"
                  @click="promptUnlock(u)"
                >
                  <SidebarIcon icon="shield" class="w-4 h-4" />
                </button>
                <button class="btn-icon btn-ghost" aria-label="Edit user" @click="openEdit(u)">
                  <SidebarIcon icon="edit" class="w-4 h-4" />
                </button>
                <button
                  class="btn-icon btn-ghost text-red-400"
                  aria-label="Remove user"
                  @click="promptDelete(u)"
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
    <UiModal v-model="showModal" :title="editing ? 'Edit user' : 'New user'" size="md">
      <form class="space-y-4" @submit.prevent="saveUser">
        <!-- Linked customer — selecting one auto-fills the email field -->
        <div class="form-group">
          <label class="label" for="user-customer">Linked customer <span class="text-muted">(optional)</span></label>
          <UiSearchSelect
            :model-value="form.customerId ?? 0"
            :options="customerOptions"
            placeholder="Search customer…"
            input-id="user-customer"
            @update:model-value="(v) => { form.customerId = v === 0 ? null : v }"
          />
        </div>

        <!-- Linked worker — selecting one auto-fills the email field -->
        <div class="form-group">
          <label class="label" for="user-worker">Linked worker <span class="text-muted">(optional)</span></label>
          <UiSearchSelect
            :model-value="form.workerId ?? 0"
            :options="workerOptions"
            placeholder="Search worker…"
            input-id="user-worker"
            @update:model-value="(v) => { form.workerId = v === 0 ? null : v }"
          />
        </div>

        <!-- Email — auto-filled from the linked record.
             When both links have different emails a dropdown lets the user pick. -->
        <div class="form-group">
          <label class="label" for="user-email">Email</label>
          <div class="relative">
            <input
              id="user-email"
              v-model="form.email"
              class="input"
              type="email"
              autocomplete="email"
              required
              @focus="onEmailFocus"
              @blur="onEmailBlur"
            >
            <ul
              v-if="emailDropdownOpen"
              class="absolute z-50 w-full mt-1 surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              <li
                v-for="email in emailSuggestions"
                :key="email"
                class="px-3 py-2 text-sm cursor-pointer transition-colors"
                :class="email === form.email
                  ? 'text-primary font-medium bg-gold-500/10'
                  : 'text-secondary hover:bg-gold-500/10 hover:text-primary'"
                @mousedown.prevent="pickEmail(email)"
              >
                {{ email }}
              </li>
            </ul>
          </div>
          <p v-if="emailSuggestions.length > 1 && !form.email" class="text-xs text-gold-400 mt-1">
            Two emails available — focus the field to choose.
          </p>
        </div>

        <!-- Password (create only) -->
        <div v-if="!editing" class="form-group">
          <label class="label" for="user-password">Password <span class="text-muted">(min 8 chars)</span></label>
          <input
            id="user-password"
            v-model="form.password"
            class="input"
            type="password"
            minlength="8"
            autocomplete="new-password"
            required
          >
          <p v-if="form.password.length > 0 && form.password.length < 8" class="text-xs text-red-400 mt-1">
            Password must be at least 8 characters
          </p>
        </div>

        <!-- Role -->
        <div class="form-group">
          <label class="label" for="user-role">Role</label>
          <select id="user-role" v-model.number="form.userRole" class="input">
            <option :value="UserRole.Client">Client</option>
            <option :value="UserRole.User">User</option>
            <option :value="UserRole.Admin">Admin</option>
          </select>
        </div>

        <!-- Active toggle -->
        <div class="form-group">
          <label class="label flex items-center gap-2">
            <input v-model="form.isActive" type="checkbox" class="accent-gold-500 w-4 h-4">
            Active
          </label>
        </div>
      </form>

      <template #footer>
        <button class="btn-ghost btn-sm" @click="showModal = false">Cancel</button>
        <button class="btn-primary btn-sm" :disabled="!formValid || saving" @click="saveUser">
          <span v-if="saving" class="w-4 h-4 border-2 border-obsidian-950/40 border-t-obsidian-950 rounded-full animate-spin" />
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </template>
    </UiModal>

    <!-- Delete confirmation -->
    <UiConfirmDialog
      v-model="showDeleteDialog"
      title="Remove user"
      :message="deleteTarget ? `Remove ${deleteTarget.email}?` : ''"
      confirm-label="Remove"
      :dangerous="true"
      @confirm="confirmDelete"
    />

    <!-- Unlock / remove lockout confirmation -->
    <UiConfirmDialog
      v-model="showUnlockDialog"
      title="Remove lockout"
      :message="unlockTarget
        ? `Remove the lockout on ${unlockTarget.email}? The account will be accessible immediately.`
        : ''"
      confirm-label="Remove lockout"
      :dangerous="false"
      @confirm="confirmUnlock"
    />
  </div>
</template>
