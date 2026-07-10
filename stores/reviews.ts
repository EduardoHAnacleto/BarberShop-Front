// Pinia store for admin review moderation. No realtime hub — the list only
// needs to be fresh when the admin opens the page.
import type { Review } from '~/types'

export const useReviewsStore = defineStore('reviews', () => {
  const items = ref<Review[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { api } = useApi()
  const toast = useToast()

  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      items.value = await api.reviews.all()
    } catch (e: unknown) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  // Removes a review (moderation). Returns true on success.
  async function remove(id: number): Promise<boolean> {
    try {
      await api.reviews.delete(id)
      items.value = items.value.filter((r) => r.id !== id)
      toast.success('Review removed')
      return true
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } }).response?.data ?? 'Failed to remove review'
      toast.error(typeof msg === 'string' ? msg : 'Failed to remove review')
      return false
    }
  }

  return { items, loading, error, fetchAll, remove }
})
