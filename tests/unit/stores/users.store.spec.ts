// Unit tests for stores/users.ts.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { UserRole } from '~/types'
import type { User } from '~/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'test@barbershop.com',
    userRole: UserRole.Client,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockApiAll = vi.hoisted(() => vi.fn())
const mockApiCreate = vi.hoisted(() => vi.fn())
const mockApiUpdate = vi.hoisted(() => vi.fn())
const mockApiDelete = vi.hoisted(() => vi.fn())
const mockApiUnlock = vi.hoisted(() => vi.fn())
const mockToastSuccess = vi.hoisted(() => vi.fn())
const mockToastError = vi.hoisted(() => vi.fn())
const mockOnUsersChanged = vi.hoisted(() => vi.fn())

mockNuxtImport('useApi', () => () => ({
  api: {
    users: {
      all: mockApiAll,
      create: mockApiCreate,
      update: mockApiUpdate,
      delete: mockApiDelete,
    },
    auth: { unlock: mockApiUnlock },
  },
}))

mockNuxtImport('useToast', () => () => ({ success: mockToastSuccess, error: mockToastError }))
mockNuxtImport('useSignalR', () => () => ({ onUsersChanged: mockOnUsersChanged }))

const { useUsersStore } = await import('~/stores/users')

beforeEach(() => {
  setActivePinia(createPinia())
  mockApiAll.mockReset()
  mockApiCreate.mockReset()
  mockApiUpdate.mockReset()
  mockApiDelete.mockReset()
  mockApiUnlock.mockReset()
  mockToastSuccess.mockReset()
  mockToastError.mockReset()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('users store — fetchAll()', () => {
  it('populates items and clears loading on success', async () => {
    mockApiAll.mockResolvedValueOnce([makeUser({ id: 1 }), makeUser({ id: 2 })])

    const store = useUsersStore()
    await store.fetchAll()

    expect(store.items).toHaveLength(2)
    expect(store.loading).toBe(false)
  })
})

describe('users store — create()', () => {
  it('calls toast.success("User created") and returns true', async () => {
    mockApiCreate.mockResolvedValueOnce(makeUser())

    const store = useUsersStore()
    const result = await store.create({
      email: 'new@test.com',
      passwordHash: 'plaintext-password',
      userRole: UserRole.User,
      isActive: true,
    })

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('User created')
  })
})

describe('users store — unlock()', () => {
  it('calls api.auth.unlock(userId), toasts success, returns true', async () => {
    mockApiUnlock.mockResolvedValueOnce(null)

    const store = useUsersStore()
    const result = await store.unlock(42)

    expect(result).toBe(true)
    expect(mockApiUnlock).toHaveBeenCalledWith(42)
    expect(mockToastSuccess).toHaveBeenCalledWith('User unlocked')
  })

  it('returns false and toasts API error on failure', async () => {
    mockApiUnlock.mockRejectedValueOnce({ response: { data: 'User not found' } })

    const store = useUsersStore()
    const result = await store.unlock(99)

    expect(result).toBe(false)
    expect(mockToastError).toHaveBeenCalledWith('User not found')
  })
})

describe('users store — remove()', () => {
  it('calls toast.success("User removed") and returns true', async () => {
    mockApiDelete.mockResolvedValueOnce(null)

    const store = useUsersStore()
    const result = await store.remove(1)

    expect(result).toBe(true)
    expect(mockToastSuccess).toHaveBeenCalledWith('User removed')
  })
})
