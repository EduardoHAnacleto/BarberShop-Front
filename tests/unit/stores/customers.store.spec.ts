// Unit tests for stores/customers.ts.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { Customer } from '~/types'

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1,
    name: 'Alice Smith',
    email: 'alice@test.com',
    phoneNumber: '555-0001',
    ...overrides,
  }
}

const mockApiAll = vi.hoisted(() => vi.fn())
const mockApiCreate = vi.hoisted(() => vi.fn())
const mockApiDelete = vi.hoisted(() => vi.fn())
const mockToastSuccess = vi.hoisted(() => vi.fn())
const mockToastError = vi.hoisted(() => vi.fn())
const mockOnCustomersChanged = vi.hoisted(() => vi.fn())

mockNuxtImport('useApi', () => () => ({
  api: {
    customers: {
      all: mockApiAll,
      create: mockApiCreate,
      update: vi.fn().mockResolvedValue(makeCustomer()),
      delete: mockApiDelete,
    },
  },
}))

mockNuxtImport('useToast', () => () => ({ success: mockToastSuccess, error: mockToastError }))
mockNuxtImport('useSignalR', () => () => ({ onCustomersChanged: mockOnCustomersChanged }))

const { useCustomersStore } = await import('~/stores/customers')

beforeEach(() => {
  setActivePinia(createPinia())
  mockApiAll.mockReset()
  mockApiCreate.mockReset()
  mockApiDelete.mockReset()
  mockToastSuccess.mockReset()
  mockToastError.mockReset()
})

describe('customers store — fetchAll()', () => {
  it('populates items on success', async () => {
    mockApiAll.mockResolvedValueOnce([makeCustomer({ id: 1 }), makeCustomer({ id: 2 })])

    const store = useCustomersStore()
    await store.fetchAll()

    expect(store.items).toHaveLength(2)
  })
})

describe('customers store — create()', () => {
  it('toasts "Customer created" on success', async () => {
    mockApiCreate.mockResolvedValueOnce(makeCustomer())

    const store = useCustomersStore()
    const result = await store.create({ name: 'Bob', email: 'b@test.com' })

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('Customer created')
  })

  it('returns false and toasts API error', async () => {
    mockApiCreate.mockRejectedValueOnce({ response: { data: 'Duplicate email' } })

    const store = useCustomersStore()
    const result = await store.create({ name: 'Bob', email: 'dup@test.com' })

    expect(result).toBe(false)
    expect(mockToastError).toHaveBeenCalledWith('Duplicate email')
  })
})

describe('customers store — remove()', () => {
  it('toasts "Customer removed" on success', async () => {
    mockApiDelete.mockResolvedValueOnce(null)

    const store = useCustomersStore()
    const result = await store.remove(1)

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('Customer removed')
  })
})
