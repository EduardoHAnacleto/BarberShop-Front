// Unit tests for stores/workerSchedule.ts.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetByWorker = vi.hoisted(() => vi.fn())
const mockUpsert = vi.hoisted(() => vi.fn())
const mockRemoveOverride = vi.hoisted(() => vi.fn())
const mockToastSuccess = vi.hoisted(() => vi.fn())
const mockToastError = vi.hoisted(() => vi.fn())
const mockOnWorkerSchedulesChanged = vi.hoisted(() => vi.fn())

mockNuxtImport('useApi', () => () => ({
  api: {
    workerSchedule: {
      getByWorker: mockGetByWorker,
      upsert: mockUpsert,
      removeOverride: mockRemoveOverride,
    },
  },
}))

mockNuxtImport('useToast', () => () => ({ success: mockToastSuccess, error: mockToastError }))

mockNuxtImport('useSignalR', () => () => ({
  onWorkerSchedulesChanged: mockOnWorkerSchedulesChanged,
}))

const { useWorkerScheduleStore } = await import('~/stores/workerSchedule')

beforeEach(() => {
  setActivePinia(createPinia())
  mockGetByWorker.mockReset()
  mockUpsert.mockReset()
  mockRemoveOverride.mockReset()
  mockToastSuccess.mockReset()
  mockToastError.mockReset()
  mockOnWorkerSchedulesChanged.mockReset()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('workerSchedule store — fetchByWorker()', () => {
  it('populates overrides from the API', async () => {
    mockGetByWorker.mockResolvedValueOnce([
      { id: 1, workerId: 2, dayOfWeek: 1, isOpen: true, openTime: '09:00:00', closeTime: '12:00:00' },
    ])

    const store = useWorkerScheduleStore()
    await store.fetchByWorker(2)

    expect(store.overrides).toHaveLength(1)
    expect(store.overrides[0]!.workerId).toBe(2)
  })

  it('sets error on API failure', async () => {
    mockGetByWorker.mockRejectedValueOnce(new Error('boom'))

    const store = useWorkerScheduleStore()
    await store.fetchByWorker(2)

    expect(store.error).toBe('boom')
  })
})

describe('workerSchedule store — upsert()', () => {
  it('calls toast.success and re-fetches on success', async () => {
    mockUpsert.mockResolvedValueOnce(null)
    mockGetByWorker.mockResolvedValueOnce([])

    const store = useWorkerScheduleStore()
    const result = await store.upsert(2, 1, { isOpen: true, openTime: '09:00:00', closeTime: '12:00:00' })

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('Worker schedule updated')
    expect(mockGetByWorker).toHaveBeenCalledWith(2)
  })

  it('shows the server error message and returns false on failure', async () => {
    mockUpsert.mockRejectedValueOnce({ response: { data: 'CloseTime must be after OpenTime.' } })

    const store = useWorkerScheduleStore()
    const result = await store.upsert(2, 1, { isOpen: true })

    expect(result).toBe(false)
    expect(mockToastError).toHaveBeenCalledWith('CloseTime must be after OpenTime.')
  })
})

describe('workerSchedule store — removeOverride()', () => {
  it('calls toast.success and re-fetches on success', async () => {
    mockRemoveOverride.mockResolvedValueOnce(null)
    mockGetByWorker.mockResolvedValueOnce([])

    const store = useWorkerScheduleStore()
    const result = await store.removeOverride(2, 1)

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('Reverted to shop default')
  })
})

describe('workerSchedule store — reset()', () => {
  it('clears the loaded overrides', async () => {
    mockGetByWorker.mockResolvedValueOnce([
      { id: 1, workerId: 2, dayOfWeek: 1, isOpen: true },
    ])

    const store = useWorkerScheduleStore()
    await store.fetchByWorker(2)
    expect(store.overrides).toHaveLength(1)

    store.reset()

    expect(store.overrides).toHaveLength(0)
  })
})

describe('workerSchedule store — subscribeRealtime()', () => {
  it('registers a callback via onWorkerSchedulesChanged', () => {
    const unsubscribe = vi.fn()
    mockOnWorkerSchedulesChanged.mockReturnValue(unsubscribe)

    const store = useWorkerScheduleStore()
    const result = store.subscribeRealtime()

    expect(mockOnWorkerSchedulesChanged).toHaveBeenCalledTimes(1)
    expect(result).toBe(unsubscribe)
  })

  it('re-fetches the currently selected worker when the hub fires', async () => {
    mockOnWorkerSchedulesChanged.mockReturnValue(vi.fn())
    mockGetByWorker.mockResolvedValue([])

    const store = useWorkerScheduleStore()
    await store.fetchByWorker(2)
    mockGetByWorker.mockClear()

    store.subscribeRealtime()
    const callback = mockOnWorkerSchedulesChanged.mock.calls[0]?.[0] as () => void
    callback()

    expect(mockGetByWorker).toHaveBeenCalledWith(2)
  })

  it('does nothing when no worker has been selected yet', () => {
    mockOnWorkerSchedulesChanged.mockReturnValue(vi.fn())

    const store = useWorkerScheduleStore()
    store.subscribeRealtime()
    const callback = mockOnWorkerSchedulesChanged.mock.calls[0]?.[0] as () => void
    callback()

    expect(mockGetByWorker).not.toHaveBeenCalled()
  })
})
