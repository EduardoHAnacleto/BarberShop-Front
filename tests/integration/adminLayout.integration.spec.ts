// Integration test for layouts/admin.vue.
// Verifies that mounting the admin layout connects all 5 SignalR hubs and
// unmounting calls disconnectAll().
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const mockConnect = vi.hoisted(() => vi.fn())
const mockDisconnectAll = vi.hoisted(() => vi.fn())

// Vitest restoreMocks=true strips the impl between tests, so reapply the
// resolved-promise behaviour here. Without this, connect(hub).catch(...)
// throws "Cannot read properties of undefined (reading 'catch')".
beforeEach(() => {
  mockConnect.mockResolvedValue(undefined)
  mockDisconnectAll.mockResolvedValue(undefined)
})

mockNuxtImport('useSignalR', () => () => ({
  connect: mockConnect,
  disconnectAll: mockDisconnectAll,
  isConnected: { value: false },
}))

mockNuxtImport('useAuth', () => () => ({
  userEmail: { value: 'admin@b.com' },
  logout: vi.fn(),
}))

mockNuxtImport('useRoute', () => () => ({ path: '/admin' }))

describe('admin layout', () => {
  it('calls connect() once for each of the 5 hubs on mount', async () => {
    const { default: AdminLayout } = await import('~/layouts/admin.vue')
    mount(AdminLayout, { slots: { default: '<div>page</div>' } })

    // Wait a tick for onMounted to run.
    await new Promise((r) => setTimeout(r, 50))

    const hubsCalled = mockConnect.mock.calls.map((c) => c[0]).sort()
    expect(hubsCalled).toEqual(
      ['appointments', 'customers', 'services', 'users', 'workers'],
    )
    expect(mockConnect).toHaveBeenCalledTimes(5)
  })

  it('calls disconnectAll() on unmount', async () => {
    mockDisconnectAll.mockClear()
    const { default: AdminLayout } = await import('~/layouts/admin.vue')
    const wrapper = mount(AdminLayout, { slots: { default: '<div>page</div>' } })

    wrapper.unmount()
    expect(mockDisconnectAll).toHaveBeenCalledTimes(1)
  })
})
