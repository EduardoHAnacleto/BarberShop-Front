// Integration test for pages/admin/index.vue.
// Regression guard: "Revenue (30d)" and the top-services/top-workers panels
// come from GET /api/reports/summary, fetched once in onMounted. Unlike the
// KPI counts (Today/Scheduled/On Going), which are computed from the
// appointmentsStore and live-update because the store subscribes to the
// appointments SignalR hub, the reports summary was never refetched — so
// marking a booking Completed changed revenue on the server but the
// dashboard kept showing the load-time snapshot until a manual page reload.
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

mockNuxtImport('useRuntimeConfig', () => () => ({
  public: { apiBase: 'http://localhost:8080' },
}))

mockNuxtImport('definePageMeta', () => vi.fn())

// Captures every onAppointmentsChanged registration (both the appointments
// store's own subscription and the dashboard's new reports subscription)
// so the test can fire them like the SignalR hub would.
const appointmentsCallbacks: Array<() => void> = []

mockNuxtImport('useSignalR', () => () => ({
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn(),
  disconnectAll: vi.fn(),
  isConnected: { value: false },
  onAppointmentsChanged: (cb: () => void) => {
    appointmentsCallbacks.push(cb)
    return vi.fn()
  },
  onWorkersChanged: vi.fn().mockReturnValue(vi.fn()),
  onCustomersChanged: vi.fn().mockReturnValue(vi.fn()),
  onServicesChanged: vi.fn().mockReturnValue(vi.fn()),
  onUsersChanged: vi.fn().mockReturnValue(vi.fn()),
}))

// ── MSW server ────────────────────────────────────────────────────────────────

let reportsCallCount = 0

const server = setupServer(
  http.get('http://localhost:8080/api/appointments/all', () => HttpResponse.json([])),
  http.get('http://localhost:8080/api/workers/all', () => HttpResponse.json([])),
  http.get('http://localhost:8080/api/customers/all', () => HttpResponse.json([])),
  http.get('http://localhost:8080/api/working-hours/is-open', () =>
    HttpResponse.json({ isOpen: true }),
  ),
  http.get('http://localhost:8080/api/reports/summary', () => {
    reportsCallCount += 1
    const revenue = reportsCallCount === 1 ? 100 : 250
    return HttpResponse.json({
      totalRevenue: revenue,
      revenueLast30Days: revenue,
      completedCount: reportsCallCount,
      cancelledCount: 0,
      cancellationRate: 0,
      topServicesByRevenue: [],
      topWorkersByRevenue: [],
    })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  appointmentsCallbacks.length = 0
  reportsCallCount = 0
})
afterAll(() => server.close())

// ── Helpers ───────────────────────────────────────────────────────────────────

async function mountDashboard() {
  setActivePinia(createPinia())
  const { default: Page } = await import('~/pages/admin/index.vue')
  const wrapper = mount(Page, { global: { plugins: [createPinia()] } })
  await flushPromises()
  return wrapper
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('/admin dashboard — revenue live updates', () => {
  it('loads the revenue summary on mount', async () => {
    const wrapper = await mountDashboard()

    expect(wrapper.text()).toContain('$100.00')
  })

  it('refetches revenue when the appointments hub pushes a change (e.g. a completed booking)', async () => {
    const wrapper = await mountDashboard()
    expect(wrapper.text()).toContain('$100.00')
    expect(reportsCallCount).toBe(1)

    // Simulate the backend's AppointmentsChanged broadcast, fired on every
    // appointment mutation including ChangeStatus → Completed.
    appointmentsCallbacks.forEach((cb) => cb())
    await flushPromises()

    expect(reportsCallCount).toBe(2)
    expect(wrapper.text()).toContain('$250.00')
  })
})
