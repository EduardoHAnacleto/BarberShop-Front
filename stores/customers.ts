// Pinia store for customers. Full CRUD is implemented in Sprint 3.
// Sprint 2 needs the items list to populate appointment selects.
import type { Customer } from '~/types'

export const useCustomersStore = defineStore('customers', () => {
  // The full list of customers returned by the last fetchAll call.
  const items = ref<Customer[]>([])

  // True while the fetch is in flight.
  const loading = ref(false)

  // Set to the error message when the last operation failed; null otherwise.
  const error = ref<string | null>(null)

  const { api } = useApi()
  const toast = useToast()
  const signalr = useSignalR()

  // Loads every customer from the API.
  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      items.value = await api.customers.all()
    } catch (e: unknown) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  // Creates a new customer. Returns true on success.
  async function create(body: Partial<Customer>): Promise<boolean> {
    try {
      await api.customers.create(body)
      toast.success('Customer created')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to create customer'
      toast.error(typeof msg === 'string' ? msg : 'Failed to create customer')
      return false
    }
  }

  // Updates an existing customer. Returns true on success.
  async function update(id: number, body: Partial<Customer>): Promise<boolean> {
    try {
      await api.customers.update(id, body)
      toast.success('Customer updated')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to update customer'
      toast.error(typeof msg === 'string' ? msg : 'Failed to update customer')
      return false
    }
  }

  // Removes a customer. Returns true on success.
  async function remove(id: number): Promise<boolean> {
    try {
      await api.customers.delete(id)
      toast.success('Customer removed')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to remove customer'
      toast.error(typeof msg === 'string' ? msg : 'Failed to remove customer')
      return false
    }
  }

  // Subscribes to the customers SignalR hub.
  function subscribeRealtime(): () => void {
    return signalr.onCustomersChanged(() => fetchAll())
  }

  return { items, loading, error, fetchAll, create, update, remove, subscribeRealtime }
})
