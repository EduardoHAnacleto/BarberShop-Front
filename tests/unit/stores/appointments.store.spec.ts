// Unit tests for stores/appointments.ts.
// Mocks useApi, useToast, and useSignalR to isolate store logic.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { AppointmentStatus } from '~/types'
import type { Appointment } from '~/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

// Builds a minimal Appointment fixture for tests.
function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 1,
    workerId: 1,
    workerName: 'John',
    customerId: 1,
    customerName: 'Alice',
    serviceId: 1,
    serviceName: 'Haircut',
    scheduledFor: new Date().toISOString(),
    status: AppointmentStatus.Scheduled,
    extraDetails: '',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Hoisted so the factory can reference them.
const mockApiAll = vi.hoisted(() => vi.fn())
const mockApiCreate = vi.hoisted(() => vi.fn())
const mockApiUpdate = vi.hoisted(() => vi.fn())
const mockApiDelete = vi.hoisted(() => vi.fn())
const mockApiDelay = vi.hoisted(() => vi.fn())
const mockApiCancel = vi.hoisted(() => vi.fn())
const mockApiByStatus = vi.hoisted(() => vi.fn())

const mockToastSuccess = vi.hoisted(() => vi.fn())
const mockToastError = vi.hoisted(() => vi.fn())

const mockOnAppointmentsChanged = vi.hoisted(() => vi.fn())

mockNuxtImport('useApi', () => () => ({
  api: {
    appointments: {
      all: mockApiAll,
      create: mockApiCreate,
      update: mockApiUpdate,
      delete: mockApiDelete,
      delay: mockApiDelay,
      cancel: mockApiCancel,
      byStatus: mockApiByStatus,
    },
  },
}))

mockNuxtImport('useToast', () => () => ({
  success: mockToastSuccess,
  error: mockToastError,
}))

mockNuxtImport('useSignalR', () => () => ({
  onAppointmentsChanged: mockOnAppointmentsChanged,
}))

// ── Import store after mocks ───────────────────────────────────────────────────

const { useAppointmentsStore } = await import('~/stores/appointments')

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  setActivePinia(createPinia())
  mockApiAll.mockReset()
  mockApiCreate.mockReset()
  mockApiUpdate.mockReset()
  mockApiDelete.mockReset()
  mockApiDelay.mockReset()
  mockApiCancel.mockReset()
  mockApiByStatus.mockReset()
  mockToastSuccess.mockReset()
  mockToastError.mockReset()
  mockOnAppointmentsChanged.mockReset()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('appointments store — fetchAll()', () => {
  it('populates items and clears loading on success', async () => {
    const data = [makeAppointment({ id: 1 }), makeAppointment({ id: 2 })]
    mockApiAll.mockResolvedValueOnce(data)

    const store = useAppointmentsStore()
    await store.fetchAll()

    expect(store.items).toEqual(data)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('sets error and clears loading on network failure', async () => {
    mockApiAll.mockRejectedValueOnce(new Error('Network error'))

    const store = useAppointmentsStore()
    await store.fetchAll()

    expect(store.error).toBe('Network error')
    expect(store.loading).toBe(false)
    expect(store.items).toEqual([])
  })
})

describe('appointments store — create()', () => {
  it('calls toast.success and returns true on success', async () => {
    mockApiCreate.mockResolvedValueOnce(makeAppointment())

    const store = useAppointmentsStore()
    const result = await store.create({
      workerId: 1,
      customerId: 1,
      serviceId: 1,
      scheduledFor: '2025-01-01T10:00',
      status: AppointmentStatus.Scheduled,
    })

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('Appointment created')
  })

  it('calls toast.error with API message and returns false on 400', async () => {
    mockApiCreate.mockRejectedValueOnce({ response: { data: 'Slot not available' } })

    const store = useAppointmentsStore()
    const result = await store.create({
      workerId: 1,
      customerId: 1,
      serviceId: 1,
      scheduledFor: '2025-01-01T10:00',
      status: AppointmentStatus.Scheduled,
    })

    expect(result).toBe(false)
    expect(mockToastError).toHaveBeenCalledWith('Slot not available')
  })
})

describe('appointments store — update()', () => {
  it('calls toast.success and returns true on success', async () => {
    mockApiUpdate.mockResolvedValueOnce(makeAppointment())

    const store = useAppointmentsStore()
    const result = await store.update(1, {
      workerId: 1,
      customerId: 1,
      serviceId: 1,
      scheduledFor: '2025-01-01T10:00',
      status: AppointmentStatus.OnGoing,
    })

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('Appointment updated')
  })
})

describe('appointments store — remove()', () => {
  it('calls toast.success("Appointment cancelled") and returns true', async () => {
    mockApiDelete.mockResolvedValueOnce(null)

    const store = useAppointmentsStore()
    const result = await store.remove(1)

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('Appointment cancelled')
  })
})

describe('appointments store — delayMany()', () => {
  it('converts minutes to HH:MM:00 and calls the API with the id list', async () => {
    mockApiDelay.mockResolvedValueOnce(null)

    const store = useAppointmentsStore()
    await store.delayMany([1, 2], 30)

    expect(mockApiDelay).toHaveBeenCalledWith([1, 2], '00:30:00')
  })

  it('correctly formats 90 minutes as 01:30:00', async () => {
    mockApiDelay.mockResolvedValueOnce(null)

    const store = useAppointmentsStore()
    await store.delayMany([3], 90)

    expect(mockApiDelay).toHaveBeenCalledWith([3], '01:30:00')
  })
})

describe('appointments store — cancelMany()', () => {
  it('calls api.appointments.cancel with the correct id list', async () => {
    mockApiCancel.mockResolvedValueOnce(null)

    const store = useAppointmentsStore()
    await store.cancelMany([1, 2])

    expect(mockApiCancel).toHaveBeenCalledWith([1, 2])
  })
})

describe('appointments store — computed filters', () => {
  it('scheduled returns only Scheduled items', async () => {
    mockApiAll.mockResolvedValueOnce([
      makeAppointment({ id: 1, status: AppointmentStatus.Scheduled }),
      makeAppointment({ id: 2, status: AppointmentStatus.Completed }),
    ])

    const store = useAppointmentsStore()
    await store.fetchAll()

    expect(store.scheduled).toHaveLength(1)
    expect(store.scheduled[0]!.id).toBe(1)
  })

  it('todayItems returns only appointments scheduled for today', async () => {
    const todayIso = new Date().toISOString()
    const futureIso = new Date(Date.now() + 86_400_000 * 2).toISOString()
    mockApiAll.mockResolvedValueOnce([
      makeAppointment({ id: 1, scheduledFor: todayIso }),
      makeAppointment({ id: 2, scheduledFor: futureIso }),
    ])

    const store = useAppointmentsStore()
    await store.fetchAll()

    expect(store.todayItems).toHaveLength(1)
    expect(store.todayItems[0]!.id).toBe(1)
  })
})
