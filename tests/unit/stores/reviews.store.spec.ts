// Unit tests for stores/reviews.ts.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { Review } from '~/types'

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 1,
    appointmentId: 10,
    customerId: 1,
    customerName: 'Emily Johnson',
    workerId: 2,
    workerName: 'James Carter',
    serviceName: 'Haircut',
    rating: 5,
    comment: 'Great cut!',
    createdAt: '2026-07-01T10:00:00Z',
    ...overrides,
  }
}

const mockApiAll = vi.hoisted(() => vi.fn())
const mockApiDelete = vi.hoisted(() => vi.fn())
const mockToastSuccess = vi.hoisted(() => vi.fn())
const mockToastError = vi.hoisted(() => vi.fn())
const mockOnReviewsChanged = vi.hoisted(() => vi.fn())

mockNuxtImport('useApi', () => () => ({
  api: {
    reviews: {
      all: mockApiAll,
      delete: mockApiDelete,
    },
  },
}))

mockNuxtImport('useToast', () => () => ({ success: mockToastSuccess, error: mockToastError }))

mockNuxtImport('useSignalR', () => () => ({
  onReviewsChanged: mockOnReviewsChanged,
}))

const { useReviewsStore } = await import('~/stores/reviews')

beforeEach(() => {
  setActivePinia(createPinia())
  mockApiAll.mockReset()
  mockApiDelete.mockReset()
  mockToastSuccess.mockReset()
  mockToastError.mockReset()
  mockOnReviewsChanged.mockReset()
})

describe('reviews store — fetchAll()', () => {
  it('populates items on success', async () => {
    mockApiAll.mockResolvedValueOnce([makeReview({ id: 1 }), makeReview({ id: 2 })])

    const store = useReviewsStore()
    await store.fetchAll()

    expect(store.items).toHaveLength(2)
  })

  it('sets error on failure', async () => {
    mockApiAll.mockRejectedValueOnce(new Error('network down'))

    const store = useReviewsStore()
    await store.fetchAll()

    expect(store.error).toBe('network down')
  })
})

describe('reviews store — remove()', () => {
  it('removes the review locally and toasts success', async () => {
    mockApiAll.mockResolvedValueOnce([makeReview({ id: 1 }), makeReview({ id: 2 })])
    mockApiDelete.mockResolvedValueOnce(null)

    const store = useReviewsStore()
    await store.fetchAll()
    const result = await store.remove(1)

    expect(result).toBe(true)
    expect(store.items.map((r) => r.id)).toEqual([2])
    expect(mockToastSuccess).toHaveBeenCalledWith('Review removed')
  })

  it('returns false and toasts the API error on failure', async () => {
    mockApiDelete.mockRejectedValueOnce({ response: { data: 'Review not found' } })

    const store = useReviewsStore()
    const result = await store.remove(99)

    expect(result).toBe(false)
    expect(mockToastError).toHaveBeenCalledWith('Review not found')
  })
})

describe('reviews store — subscribeRealtime()', () => {
  it('registers a callback via onReviewsChanged', () => {
    const unsubscribe = vi.fn()
    mockOnReviewsChanged.mockReturnValue(unsubscribe)

    const store = useReviewsStore()
    const result = store.subscribeRealtime()

    expect(mockOnReviewsChanged).toHaveBeenCalledTimes(1)
    expect(result).toBe(unsubscribe)
  })

  it('refetches the review list when the hub fires', async () => {
    mockOnReviewsChanged.mockReturnValue(vi.fn())
    mockApiAll.mockResolvedValue([])

    const store = useReviewsStore()
    store.subscribeRealtime()

    const callback = mockOnReviewsChanged.mock.calls[0]?.[0] as () => void
    expect(callback).toBeTypeOf('function')
    callback()

    expect(mockApiAll).toHaveBeenCalled()
  })
})
