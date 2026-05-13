// Pinia store for services. Full CRUD is implemented in Sprint 3.
// Sprint 2 needs the items list to populate appointment and worker selects.
import type { Service } from '~/types'

export const useServicesStore = defineStore('services', () => {
  // The full list of services returned by the last fetchAll call.
  const items = ref<Service[]>([])

  // True while the fetch is in flight.
  const loading = ref(false)

  // Set to the error message when the last operation failed; null otherwise.
  const error = ref<string | null>(null)

  const { api } = useApi()
  const toast = useToast()
  const signalr = useSignalR()

  // Loads every service from the API.
  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      items.value = await api.services.all()
    } catch (e: unknown) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  // Creates a new service. Returns true on success.
  async function create(body: Partial<Service>): Promise<boolean> {
    try {
      await api.services.create(body)
      toast.success('Service created')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to create service'
      toast.error(typeof msg === 'string' ? msg : 'Failed to create service')
      return false
    }
  }

  // Updates an existing service. Returns true on success.
  async function update(id: number, body: Partial<Service>): Promise<boolean> {
    try {
      await api.services.update(id, body)
      toast.success('Service updated')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to update service'
      toast.error(typeof msg === 'string' ? msg : 'Failed to update service')
      return false
    }
  }

  // Removes a service. Returns true on success.
  async function remove(id: number): Promise<boolean> {
    try {
      await api.services.delete(id)
      toast.success('Service removed')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to remove service'
      toast.error(typeof msg === 'string' ? msg : 'Failed to remove service')
      return false
    }
  }

  // Subscribes to the services SignalR hub.
  function subscribeRealtime(): () => void {
    return signalr.onServicesChanged(() => fetchAll())
  }

  return { items, loading, error, fetchAll, create, update, remove, subscribeRealtime }
})
