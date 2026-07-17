// Pinia store for business schedule and exceptional closures. Holds the
// weekly schedule (one row per day-of-week) and a list of closures, and
// exposes a checkIsOpen helper that asks the API whether a given timestamp
// falls inside business hours. See sprint plan S3.1 for the full spec.
import type { BusinessSchedule, WorkingHours } from '~/types'

export const useScheduleStore = defineStore('schedule', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  // Standard weekly business hours; one entry per day-of-week.
  const schedules = ref<BusinessSchedule[]>([])

  // Exceptional closures (holidays, refurbishments, etc.).
  const closures = ref<WorkingHours[]>([])

  // True while any async operation is in flight.
  const loading = ref(false)

  // Set to the error message when the last operation failed; null otherwise.
  const error = ref<string | null>(null)

  // ── Dependencies ───────────────────────────────────────────────────────────

  const { api } = useApi()
  const toast = useToast()
  const signalr = useSignalR()

  // ── Actions ────────────────────────────────────────────────────────────────

  // Loads the weekly schedule from the API.
  async function fetchSchedule(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      schedules.value = await api.schedule.getSchedule()
    } catch (e: unknown) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  // Loads exceptional closures from the API.
  async function fetchClosures(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      closures.value = await api.schedule.getClosures()
    } catch (e: unknown) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  // Updates a single day's schedule entry. Re-fetches on success so the local
  // copy reflects whatever the server actually stored.
  async function updateSchedule(id: number, body: Partial<BusinessSchedule>): Promise<boolean> {
    try {
      await api.schedule.updateSchedule(id, body)
      toast.success('Schedule updated')
      await fetchSchedule()
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to update schedule'
      toast.error(typeof msg === 'string' ? msg : 'Failed to update schedule')
      return false
    }
  }

  // Adds a new exceptional closure.
  async function addClosure(body: Partial<WorkingHours>): Promise<boolean> {
    try {
      await api.schedule.addClosure(body)
      toast.success('Closure added')
      await fetchClosures()
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to add closure'
      toast.error(typeof msg === 'string' ? msg : 'Failed to add closure')
      return false
    }
  }

  // Removes an existing closure by id.
  async function removeClosure(id: number): Promise<boolean> {
    try {
      await api.schedule.removeClosure(id)
      toast.success('Closure removed')
      await fetchClosures()
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to remove closure'
      toast.error(typeof msg === 'string' ? msg : 'Failed to remove closure')
      return false
    }
  }

  // Asks the API whether the shop is open at the given timestamp. Returns
  // false on any error so callers can render a "closed" state safely.
  async function checkIsOpen(dateTime: string): Promise<boolean> {
    try {
      const result = await api.schedule.isOpen(dateTime)
      return result.isOpen
    } catch {
      return false
    }
  }

  // Subscribes to the schedule SignalR hub. A single ScheduleChanged event
  // covers both the weekly schedule and exceptional closures, so both are
  // re-fetched — either can change what "shop is open" means.
  function subscribeRealtime(): () => void {
    return signalr.onScheduleChanged(() => {
      fetchSchedule()
      fetchClosures()
    })
  }

  return {
    schedules,
    closures,
    loading,
    error,
    fetchSchedule,
    fetchClosures,
    updateSchedule,
    addClosure,
    removeClosure,
    checkIsOpen,
    subscribeRealtime,
  }
})
