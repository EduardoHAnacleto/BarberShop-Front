// Pinia store for workers. Handles fetching, CRUD, and real-time sync.
// See sprint plan S2.1 for the full spec.
import type { Worker } from '~/types'

export const useWorkersStore = defineStore('workers', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  // The full list of workers returned by the last fetchAll call.
  const items = ref<Worker[]>([])

  // True while any async operation is in flight.
  const loading = ref(false)

  // Set to the error message when the last operation failed; null otherwise.
  const error = ref<string | null>(null)

  // ── Dependencies ───────────────────────────────────────────────────────────

  const { api } = useApi()
  const toast = useToast()
  const signalr = useSignalR()

  // ── Fetch actions ──────────────────────────────────────────────────────────

  // Loads every worker from the API, replacing the local list.
  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      items.value = await api.workers.all()
    } catch (e: unknown) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  // ── Mutating actions ───────────────────────────────────────────────────────

  // Creates a new worker. Returns true on success, false on error.
  async function create(body: Partial<Worker>): Promise<boolean> {
    try {
      await api.workers.create(body)
      toast.success('Worker created')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to create worker'
      toast.error(typeof msg === 'string' ? msg : 'Failed to create worker')
      return false
    }
  }

  // Updates an existing worker. Returns true on success, false on error.
  async function update(id: number, body: Partial<Worker>): Promise<boolean> {
    try {
      await api.workers.update(id, body)
      toast.success('Worker updated')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to update worker'
      toast.error(typeof msg === 'string' ? msg : 'Failed to update worker')
      return false
    }
  }

  // Removes a worker permanently. Returns true on success, false on error.
  async function remove(id: number): Promise<boolean> {
    try {
      await api.workers.delete(id)
      toast.success('Worker removed')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to remove worker'
      toast.error(typeof msg === 'string' ? msg : 'Failed to remove worker')
      return false
    }
  }

  // ── Real-time subscription ─────────────────────────────────────────────────

  // Subscribes to the workers SignalR hub. Returns an unsubscribe function
  // so the calling page can clean up on unmount.
  function subscribeRealtime(): () => void {
    return signalr.onWorkersChanged(() => fetchAll())
  }

  return {
    items,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
    subscribeRealtime,
  }
})
