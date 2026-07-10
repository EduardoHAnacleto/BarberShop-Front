<script setup lang="ts">
// Admin review moderation page. Read-only list of every customer review with
// a delete action for removing inappropriate content. See Sprint070726 §5.4.
import dayjs from 'dayjs'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const reviewsStore = useReviewsStore()
const { items, loading } = storeToRefs(reviewsStore)

// ── Filter ─────────────────────────────────────────────────────────────────

// Free-text search applied across worker, customer and service names.
const searchQuery = ref('')

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return items.value
  return items.value.filter(
    (r) =>
      r.workerName.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.serviceName.toLowerCase().includes(q),
  )
})

// Formats an ISO date string as "MMM DD, YYYY".
function formatDate(iso: string): string {
  return dayjs(iso).format('MMM DD, YYYY')
}

// ── Delete confirmation ─────────────────────────────────────────────────────

const showDeleteDialog = ref(false)
const deleteTarget = ref<{ id: number; workerName: string; customerName: string } | null>(null)

function promptDelete(r: { id: number; workerName: string; customerName: string }): void {
  deleteTarget.value = r
  showDeleteDialog.value = true
}

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return
  const ok = await reviewsStore.remove(deleteTarget.value.id)
  if (ok) {
    showDeleteDialog.value = false
    deleteTarget.value = null
  }
}

onMounted(() => reviewsStore.fetchAll())
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <h1 class="font-display text-2xl text-primary">Reviews</h1>
    </div>

    <!-- Search bar -->
    <div class="card">
      <div class="relative max-w-sm">
        <SidebarIcon icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          v-model="searchQuery"
          class="input pl-9 w-full"
          type="search"
          placeholder="Search customer, worker, service…"
          autocomplete="off"
        >
      </div>
    </div>

    <!-- Reviews table -->
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Customer</th>
            <th scope="col">Worker</th>
            <th scope="col">Service</th>
            <th scope="col">Rating</th>
            <th scope="col">Comment</th>
            <th scope="col">Date</th>
            <th scope="col" class="w-16">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="i in 5" :key="i">
              <td colspan="7"><UiSkeleton height="h-10" /></td>
            </tr>
          </template>

          <tr v-else-if="filtered.length === 0">
            <td colspan="7" class="text-center text-muted py-12">No reviews found</td>
          </tr>

          <tr v-for="r in filtered" v-else :key="r.id">
            <td class="text-primary">{{ r.customerName }}</td>
            <td class="text-secondary">{{ r.workerName }}</td>
            <td class="text-secondary">{{ r.serviceName }}</td>
            <td><SharedStarRating :rating="r.rating" :count="1" /></td>
            <td class="text-secondary text-sm max-w-xs truncate">{{ r.comment || '—' }}</td>
            <td class="text-secondary font-mono text-sm">{{ formatDate(r.createdAt) }}</td>
            <td>
              <button
                class="btn-icon btn-ghost text-red-400"
                aria-label="Remove review"
                @click="promptDelete(r)"
              >
                <SidebarIcon icon="trash" class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete confirmation -->
    <UiConfirmDialog
      v-model="showDeleteDialog"
      title="Remove review"
      :message="deleteTarget ? `Remove ${deleteTarget.customerName}'s review of ${deleteTarget.workerName}?` : ''"
      confirm-label="Remove"
      :dangerous="true"
      @confirm="confirmDelete"
    />
  </div>
</template>
