// Pinia store for appointments. Manages the full lifecycle of appointment
// records: fetching, filtering, CRUD actions, and batch operations.
// See sprint plan S2.1 for the full spec.
import dayjs from 'dayjs'
import type { Appointment, AppointmentRequest } from '~/types'
import { AppointmentStatus } from '~/types'

export const useAppointmentsStore = defineStore('appointments', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  // The full list of appointments returned by the last fetchAll / fetchBy* call.
  const items = ref<Appointment[]>([])

  // True while any async operation is in flight.
  const loading = ref(false)

  // Set to the error message when the last operation failed; null otherwise.
  const error = ref<string | null>(null)

  // ── Dependencies ───────────────────────────────────────────────────────────

  const { api } = useApi()
  const toast = useToast()
  const signalr = useSignalR()

  // ── Fetch actions ──────────────────────────────────────────────────────────

  // Loads every appointment from the API, replacing the local list.
  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      items.value = await api.appointments.all()
    } catch (e: unknown) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  // Replaces the local list with appointments matching a specific status.
  async function fetchByStatus(status: AppointmentStatus): Promise<void> {
    loading.value = true
    error.value = null
    try {
      items.value = await api.appointments.byStatus(status)
    } catch (e: unknown) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  // Replaces the local list with appointments inside the given date range.
  async function fetchByRange(start: string, end: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      items.value = await api.appointments.byRange(start, end)
    } catch (e: unknown) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  // ── Mutating actions ───────────────────────────────────────────────────────

  // Creates a new appointment. Returns true on success, false on error.
  async function create(body: AppointmentRequest): Promise<boolean> {
    try {
      await api.appointments.create(body)
      toast.success('Appointment created')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to create appointment'
      toast.error(typeof msg === 'string' ? msg : 'Failed to create appointment')
      return false
    }
  }

  // Updates an existing appointment. Returns true on success, false on error.
  async function update(id: number, body: AppointmentRequest): Promise<boolean> {
    try {
      await api.appointments.update(id, body)
      toast.success('Appointment updated')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to update appointment'
      toast.error(typeof msg === 'string' ? msg : 'Failed to update appointment')
      return false
    }
  }

  // Cancels (deletes) a single appointment. Returns true on success.
  async function remove(id: number): Promise<boolean> {
    try {
      await api.appointments.delete(id)
      toast.success('Appointment cancelled')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to cancel appointment'
      toast.error(typeof msg === 'string' ? msg : 'Failed to cancel appointment')
      return false
    }
  }

  // Delays a batch of appointments by the given number of minutes.
  // Converts minutes to HH:MM:00 timespan format expected by the API.
  async function delayMany(idList: number[], minutes: number): Promise<boolean> {
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
    const mins = String(minutes % 60).padStart(2, '0')
    const timeSpan = `${hours}:${mins}:00`
    try {
      await api.appointments.delay(idList, timeSpan)
      toast.success(`Delayed ${idList.length} appointment(s) by ${minutes} min`)
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to delay appointments'
      toast.error(typeof msg === 'string' ? msg : 'Failed to delay appointments')
      return false
    }
  }

  // Cancels a batch of appointments in one API call.
  async function cancelMany(idList: number[]): Promise<boolean> {
    try {
      await api.appointments.cancel(idList)
      toast.success(`Cancelled ${idList.length} appointment(s)`)
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to cancel appointments'
      toast.error(typeof msg === 'string' ? msg : 'Failed to cancel appointments')
      return false
    }
  }

  // ── Computed filters ───────────────────────────────────────────────────────

  // All appointments with status Scheduled.
  const scheduled = computed(() =>
    items.value.filter((a) => a.status === AppointmentStatus.Scheduled),
  )

  // All appointments currently in progress.
  const ongoing = computed(() =>
    items.value.filter((a) => a.status === AppointmentStatus.OnGoing),
  )

  // All appointments that have been completed.
  const completed = computed(() =>
    items.value.filter((a) => a.status === AppointmentStatus.Completed),
  )

  // Appointments scheduled for today (UTC date comparison).
  const todayItems = computed(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return items.value.filter((a) => dayjs(a.scheduledFor).format('YYYY-MM-DD') === today)
  })

  // ── Real-time subscription ─────────────────────────────────────────────────

  // Subscribes to the appointments SignalR hub. Returns an unsubscribe function
  // so the calling page can clean up on unmount.
  function subscribeRealtime(): () => void {
    return signalr.onAppointmentsChanged(() => fetchAll())
  }

  return {
    items,
    loading,
    error,
    fetchAll,
    fetchByStatus,
    fetchByRange,
    create,
    update,
    remove,
    delayMany,
    cancelMany,
    scheduled,
    ongoing,
    completed,
    todayItems,
    subscribeRealtime,
  }
})
