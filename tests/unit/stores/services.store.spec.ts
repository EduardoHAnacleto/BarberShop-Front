// Unit tests for stores/services.ts.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { Service } from '~/types'

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: 1,
    name: 'Haircut',
    description: 'Standard cut',
    duration: 30,
    price: 25,
    ...overrides,
  }
}

const mockApiAll = vi.hoisted(() => vi.fn())
const mockApiCreate = vi.hoisted(() => vi.fn())
const mockApiDelete = vi.hoisted(() => vi.fn())
const mockToastSuccess = vi.hoisted(() => vi.fn())
const mockToastError = vi.hoisted(() => vi.fn())
const mockOnServicesChanged = vi.hoisted(() => vi.fn())

mockNuxtImport('useApi', () => () => ({
  api: {
    services: {
      all: mockApiAll,
      create: mockApiCreate,
      update: vi.fn().mockResolvedValue(makeService()),
      delete: mockApiDelete,
    },
  },
}))

mockNuxtImport('useToast', () => () => ({ success: mockToastSuccess, error: mockToastError }))
mockNuxtImport('useSignalR', () => () => ({ onServicesChanged: mockOnServicesChanged }))

const { useServicesStore } = await import('~/stores/services')

beforeEach(() => {
  setActivePinia(createPinia())
  mockApiAll.mockReset()
  mockApiCreate.mockReset()
  mockApiDelete.mockReset()
  mockToastSuccess.mockReset()
  mockToastError.mockReset()
})

describe('services store — fetchAll()', () => {
  it('populates items on success', async () => {
    mockApiAll.mockResolvedValueOnce([makeService({ id: 1 }), makeService({ id: 2 })])

    const store = useServicesStore()
    await store.fetchAll()

    expect(store.items).toHaveLength(2)
  })
})

describe('services store — create()', () => {
  it('toasts "Service created" on success', async () => {
    mockApiCreate.mockResolvedValueOnce(makeService())

    const store = useServicesStore()
    const result = await store.create({ name: 'Beard', duration: 20, price: 15 })

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('Service created')
  })
})

describe('services store — remove()', () => {
  it('toasts "Service removed" on success', async () => {
    mockApiDelete.mockResolvedValueOnce(null)

    const store = useServicesStore()
    const result = await store.remove(1)

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('Service removed')
  })
})
