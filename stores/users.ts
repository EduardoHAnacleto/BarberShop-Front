// Pinia store for user accounts. Adds the unlock action on top of the standard
// CRUD pattern so an admin can clear an account lockout after failed login
// attempts. See sprint plan S3.1 for the full spec.
import type { User, UserRequest } from '~/types'

export const useUsersStore = defineStore('users', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  // The full list of users returned by the last fetchAll call.
  const items = ref<User[]>([])

  // True while any async operation is in flight.
  const loading = ref(false)

  // Set to the error message when the last fetch failed; null otherwise.
  const error = ref<string | null>(null)

  // ── Dependencies ───────────────────────────────────────────────────────────

  const { api } = useApi()
  const toast = useToast()
  const signalr = useSignalR()

  // ── Actions ────────────────────────────────────────────────────────────────

  // Loads every user from the API.
  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const result = await api.users.all()
      items.value = Array.isArray(result) ? result : []
    } catch (e: unknown) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  // Creates a new user. Returns true on success.
  async function create(body: UserRequest): Promise<boolean> {
    try {
      await api.users.create(body)
      toast.success('User created')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to create user'
      toast.error(typeof msg === 'string' ? msg : 'Failed to create user')
      return false
    }
  }

  // Updates an existing user. Returns true on success.
  async function update(id: number, body: UserRequest): Promise<boolean> {
    try {
      await api.users.update(id, body)
      toast.success('User updated')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to update user'
      toast.error(typeof msg === 'string' ? msg : 'Failed to update user')
      return false
    }
  }

  // Removes a user. Returns true on success.
  async function remove(id: number): Promise<boolean> {
    try {
      await api.users.delete(id)
      toast.success('User removed')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to remove user'
      toast.error(typeof msg === 'string' ? msg : 'Failed to remove user')
      return false
    }
  }

  // Clears the account lockout for the given user. Calls the auth.unlock
  // endpoint (admin-only on the backend).
  async function unlock(userId: number): Promise<boolean> {
    try {
      await api.auth.unlock(userId)
      toast.success('User unlocked')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to unlock user'
      toast.error(typeof msg === 'string' ? msg : 'Failed to unlock user')
      return false
    }
  }

  // Subscribes to the users SignalR hub.
  function subscribeRealtime(): () => void {
    return signalr.onUsersChanged(() => fetchAll())
  }

  return { items, loading, error, fetchAll, create, update, remove, unlock, subscribeRealtime }
})
