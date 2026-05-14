// Unit tests for stores/workers.ts.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { Worker } from '~/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWorker(overrides: Partial<Worker> = {}): Worker {
  return {
    id: 1,
    name: 'John Barber',
    email: 'john@barbershop.com',
    phoneNumber: '555-0001',
    address: '123 Main St',
    position: 'Senior Barber',
    wagePerHour: 25,
    dateOfBirth: '1990-01-01',
    servicesId: [1],
    providedServices: [],
    ...overrides,
  }
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockApiAll = vi.hoisted(() => vi.fn())
const mockApiCreate = vi.hoisted(() => vi.fn())
const mockApiDelete = vi.hoisted(() => vi.fn())
const mockToastSuccess = vi.hoisted(() => vi.fn())
const mockToastError = vi.hoisted(() => vi.fn())
const mockOnWorkersChanged = vi.hoisted(() => vi.fn())

mockNuxtImport('useApi', () => () => ({
  api: {
    workers: {
      all: mockApiAll,
      create: mockApiCreate,
      update: vi.fn().mockResolvedValue(makeWorker()),
      delete: mockApiDelete,
    },
  },
}))

mockNuxtImport('useToast', () => () => ({
  success: mockToastSuccess,
  error: mockToastError,
}))

mockNuxtImport('useSignalR', () => () => ({
  onWorkersChanged: mockOnWorkersChanged,
}))

// ── Import store after mocks ───────────────────────────────────────────────────

const { useWorkersStore } = await import('~/stores/workers')

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  setActivePinia(createPinia())
  mockApiAll.mockReset()
  mockApiCreate.mockReset()
  mockApiDelete.mockReset()
  mockToastSuccess.mockReset()
  mockToastError.mockReset()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('workers store — fetchAll()', () => {
  it('populates items and clears loading on success', async () => {
    const data = [makeWorker({ id: 1 }), makeWorker({ id: 2 })]
    mockApiAll.mockResolvedValueOnce(data)

    const store = useWorkersStore()
    await store.fetchAll()

    expect(store.items).toEqual(data)
    expect(store.loading).toBe(false)
  })
})

describe('workers store — create()', () => {
  it('calls toast.success("Worker created") and returns true on success', async () => {
    mockApiCreate.mockResolvedValueOnce(makeWorker())

    const store = useWorkersStore()
    const result = await store.create({ name: 'Test Worker Long', email: 'w@test.com', wagePerHour: 20 })

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('Worker created')
  })

  it('calls toast.error with API message and returns false on error', async () => {
    mockApiCreate.mockRejectedValueOnce({ response: { data: 'Email already exists' } })

    const store = useWorkersStore()
    const result = await store.create({ name: 'Test Worker Long', email: 'dup@test.com' })

    expect(result).toBe(false)
    expect(mockToastError).toHaveBeenCalledWith('Email already exists')
  })
})

describe('workers store — remove()', () => {
  it('calls toast.success("Worker removed") and returns true', async () => {
    mockApiDelete.mockResolvedValueOnce(null)

    const store = useWorkersStore()
    const result = await store.remove(1)

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('Worker removed')
  })
})
