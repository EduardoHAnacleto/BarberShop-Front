// Unit tests for stores/schedule.ts.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ClosureType } from '~/types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetSchedule = vi.hoisted(() => vi.fn())
const mockGetClosures = vi.hoisted(() => vi.fn())
const mockUpdateSchedule = vi.hoisted(() => vi.fn())
const mockAddClosure = vi.hoisted(() => vi.fn())
const mockRemoveClosure = vi.hoisted(() => vi.fn())
const mockIsOpen = vi.hoisted(() => vi.fn())
const mockToastSuccess = vi.hoisted(() => vi.fn())
const mockToastError = vi.hoisted(() => vi.fn())
const mockOnScheduleChanged = vi.hoisted(() => vi.fn())

mockNuxtImport('useApi', () => () => ({
  api: {
    schedule: {
      getSchedule: mockGetSchedule,
      getClosures: mockGetClosures,
      updateSchedule: mockUpdateSchedule,
      addClosure: mockAddClosure,
      removeClosure: mockRemoveClosure,
      isOpen: mockIsOpen,
    },
  },
}))

mockNuxtImport('useToast', () => () => ({ success: mockToastSuccess, error: mockToastError }))

mockNuxtImport('useSignalR', () => () => ({
  onScheduleChanged: mockOnScheduleChanged,
}))

const { useScheduleStore } = await import('~/stores/schedule')

beforeEach(() => {
  setActivePinia(createPinia())
  mockGetSchedule.mockReset()
  mockGetClosures.mockReset()
  mockUpdateSchedule.mockReset()
  mockAddClosure.mockReset()
  mockRemoveClosure.mockReset()
  mockIsOpen.mockReset()
  mockToastSuccess.mockReset()
  mockToastError.mockReset()
  mockOnScheduleChanged.mockReset()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('schedule store — fetchSchedule()', () => {
  it('populates schedules from the API', async () => {
    mockGetSchedule.mockResolvedValueOnce([
      { id: 1, dayOfWeek: 1, isOpen: true, openTime: '09:00:00', closeTime: '18:00:00' },
    ])

    const store = useScheduleStore()
    await store.fetchSchedule()

    expect(store.schedules).toHaveLength(1)
    expect(store.schedules[0]!.dayOfWeek).toBe(1)
  })
})

describe('schedule store — fetchClosures()', () => {
  it('populates closures from the API', async () => {
    mockGetClosures.mockResolvedValueOnce([
      {
        id: 7,
        closedFrom: '2026-12-25T00:00:00Z',
        reason: 'Christmas',
        closureType: ClosureType.UntilNextOpening,
      },
    ])

    const store = useScheduleStore()
    await store.fetchClosures()

    expect(store.closures).toHaveLength(1)
    expect(store.closures[0]!.reason).toBe('Christmas')
  })
})

describe('schedule store — updateSchedule()', () => {
  it('calls toast.success and re-fetches the schedule on success', async () => {
    mockUpdateSchedule.mockResolvedValueOnce(null)
    mockGetSchedule.mockResolvedValueOnce([])

    const store = useScheduleStore()
    const result = await store.updateSchedule(3, { isOpen: false })

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('Schedule updated')
    expect(mockGetSchedule).toHaveBeenCalled()
  })
})

describe('schedule store — addClosure()', () => {
  it('returns true and re-fetches closures on success', async () => {
    mockAddClosure.mockResolvedValueOnce(null)
    mockGetClosures.mockResolvedValueOnce([])

    const store = useScheduleStore()
    const result = await store.addClosure({ reason: 'Test', closureType: ClosureType.UntilNextOpening })

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('Closure added')
  })
})

describe('schedule store — removeClosure()', () => {
  it('returns true and re-fetches closures on success', async () => {
    mockRemoveClosure.mockResolvedValueOnce(null)
    mockGetClosures.mockResolvedValueOnce([])

    const store = useScheduleStore()
    const result = await store.removeClosure(5)

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('Closure removed')
  })
})

describe('schedule store — checkIsOpen()', () => {
  it('returns true when API answers { isOpen: true }', async () => {
    mockIsOpen.mockResolvedValueOnce({ isOpen: true })

    const store = useScheduleStore()
    const result = await store.checkIsOpen('2026-05-14T15:00:00Z')

    expect(result).toBe(true)
  })

  it('returns false when API answers { isOpen: false }', async () => {
    mockIsOpen.mockResolvedValueOnce({ isOpen: false })

    const store = useScheduleStore()
    const result = await store.checkIsOpen('2026-05-14T03:00:00Z')

    expect(result).toBe(false)
  })

  it('returns false on API error (safe default)', async () => {
    mockIsOpen.mockRejectedValueOnce(new Error('boom'))

    const store = useScheduleStore()
    const result = await store.checkIsOpen('2026-05-14T15:00:00Z')

    expect(result).toBe(false)
  })
})

describe('schedule store — subscribeRealtime()', () => {
  it('registers a callback via onScheduleChanged', () => {
    const unsubscribe = vi.fn()
    mockOnScheduleChanged.mockReturnValue(unsubscribe)

    const store = useScheduleStore()
    const result = store.subscribeRealtime()

    expect(mockOnScheduleChanged).toHaveBeenCalledTimes(1)
    expect(result).toBe(unsubscribe)
  })

  it('re-fetches both the weekly schedule and closures when the hub fires', async () => {
    mockOnScheduleChanged.mockReturnValue(vi.fn())
    mockGetSchedule.mockResolvedValue([])
    mockGetClosures.mockResolvedValue([])

    const store = useScheduleStore()
    store.subscribeRealtime()

    const callback = mockOnScheduleChanged.mock.calls[0]?.[0] as () => void
    expect(callback).toBeTypeOf('function')
    callback()

    expect(mockGetSchedule).toHaveBeenCalled()
    expect(mockGetClosures).toHaveBeenCalled()
  })
})
