// Verifies that subscribeRealtime() wires the SignalR callback to fetchAll()
// and that the returned unsubscribe function removes both the change listener
// and the reconnect listener (the typed shortcuts subscribe to both).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockApiAll = vi.hoisted(() => vi.fn().mockResolvedValue([]))
const mockOn = vi.hoisted(() => vi.fn())

mockNuxtImport('useApi', () => () => ({
  api: { workers: { all: mockApiAll, create: vi.fn(), update: vi.fn(), delete: vi.fn() } },
}))

mockNuxtImport('useToast', () => () => ({ success: vi.fn(), error: vi.fn() }))

// useSignalR returns the on/typed shortcuts. We model onWorkersChanged
// faithfully — it subscribes to BOTH 'WorkersChanged' and 'reconnected', and
// returns a single unsubscribe that tears down both subscriptions.
mockNuxtImport('useSignalR', () => () => ({
  onWorkersChanged: (cb: () => void) => {
    const unsub1 = mockOn('workers', 'WorkersChanged', cb)
    const unsub2 = mockOn('workers', 'reconnected', cb)
    return () => {
      unsub1?.()
      unsub2?.()
    }
  },
}))

const { useWorkersStore } = await import('~/stores/workers')

beforeEach(() => {
  setActivePinia(createPinia())
  mockOn.mockReset()
})

describe('subscribeRealtime — wiring', () => {
  it('registers a callback for both the change event and reconnect', () => {
    const store = useWorkersStore()
    store.subscribeRealtime()

    const calls = mockOn.mock.calls.map(([hub, event]) => `${hub}:${event}`)
    expect(calls).toContain('workers:WorkersChanged')
    expect(calls).toContain('workers:reconnected')
  })

  it('the SignalR callback invokes fetchAll', async () => {
    const store = useWorkersStore()
    store.subscribeRealtime()

    // Pull the callback the store registered with the SignalR mock and fire it.
    const callback = mockOn.mock.calls[0]?.[2] as () => void
    expect(callback).toBeTypeOf('function')
    callback()

    // fetchAll calls api.workers.all under the hood.
    expect(mockApiAll).toHaveBeenCalled()
  })

  it('the function returned by subscribeRealtime invokes the inner unsubscribers', () => {
    // Each `mockOn` call returns its own unsubscribe spy. The composite
    // unsubscribe from subscribeRealtime must call all of them.
    const unsubSpies: Array<ReturnType<typeof vi.fn>> = []
    mockOn.mockImplementation(() => {
      const s = vi.fn()
      unsubSpies.push(s)
      return s
    })

    const store = useWorkersStore()
    const unsub = store.subscribeRealtime()

    // Two subscriptions were created (change + reconnect).
    expect(unsubSpies.length).toBe(2)

    unsub()

    expect(unsubSpies[0]).toHaveBeenCalled()
    expect(unsubSpies[1]).toHaveBeenCalled()
  })
})
