// Pinia store for a single worker's schedule overrides. Scoped to whichever
// worker is currently selected in the admin UI — a day missing from
// `overrides` means that worker follows the shop's shared schedule for it.
// See sprint plan item 5.3 for the full spec.
import type { WorkerSchedule } from '~/types'

export const useWorkerScheduleStore = defineStore('workerSchedule', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  // Override rows for the currently loaded worker (0–7 entries).
  const overrides = ref<WorkerSchedule[]>([])

  // True while any async operation is in flight.
  const loading = ref(false)

  // Set to the error message when the last operation failed; null otherwise.
  const error = ref<string | null>(null)

  // ── Dependencies ───────────────────────────────────────────────────────────

  const { api } = useApi()
  const toast = useToast()

  // ── Actions ────────────────────────────────────────────────────────────────

  // Loads the override rows for a worker, replacing the local list.
  async function fetchByWorker(workerId: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      overrides.value = await api.workerSchedule.getByWorker(workerId)
    } catch (e: unknown) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  // Creates or replaces the worker's override for a single weekday.
  // Re-fetches on success so the local copy reflects what the server stored.
  async function upsert(
    workerId: number, dayOfWeek: number, body: Partial<WorkerSchedule>,
  ): Promise<boolean> {
    try {
      await api.workerSchedule.upsert(workerId, dayOfWeek, body)
      toast.success('Worker schedule updated')
      await fetchByWorker(workerId)
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to update worker schedule'
      toast.error(typeof msg === 'string' ? msg : 'Failed to update worker schedule')
      return false
    }
  }

  // Deletes the override, reverting that weekday back to the shop default.
  async function removeOverride(workerId: number, dayOfWeek: number): Promise<boolean> {
    try {
      await api.workerSchedule.removeOverride(workerId, dayOfWeek)
      toast.success('Reverted to shop default')
      await fetchByWorker(workerId)
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to revert schedule'
      toast.error(typeof msg === 'string' ? msg : 'Failed to revert schedule')
      return false
    }
  }

  // Clears the loaded overrides — used when the admin UI deselects a worker.
  function reset(): void {
    overrides.value = []
  }

  return {
    overrides,
    loading,
    error,
    fetchByWorker,
    upsert,
    removeOverride,
    reset,
  }
})
