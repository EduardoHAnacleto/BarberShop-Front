// Integration test for pages/worker.vue.
// Regression guard: the worker's "My Schedule" must live-update when the
// appointments hub pushes a change (e.g. a client books a slot). The page
// must subscribe to onAppointmentsChanged and refetch its own appointments —
// without it the schedule only ever reflects the load-time snapshot.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const meMock = vi.hoisted(() => vi.fn())
const byWorkerMock = vi.hoisted(() => vi.fn())

// Captures the callback worker.vue registers with onAppointmentsChanged so
// the test can fire it like the SignalR hub would.
const signalr = vi.hoisted(() => ({
  callback: null as null | (() => void),
  unsubscribe: vi.fn(),
}))

// worker.vue needs userId; the (un-stubbed, auto-registered) PublicNavbar in
// the layout also reads isLoggedIn/isAdmin/userEmail/logout — provide all so
// its watchEffect can't throw and fail the run with an unhandled error.
mockNuxtImport('useAuth', () => () => ({
  userId: { value: 2 },
  isLoggedIn: { value: true },
  isAdmin: { value: false },
  userEmail: { value: 'james.carter@barbershop.com' },
  logout: vi.fn(),
}))

mockNuxtImport('useApi', () => () => ({
  api: {
    users: { me: meMock },
    appointments: { byWorker: byWorkerMock, changeStatus: vi.fn() },
  },
}))

mockNuxtImport('useToast', () => () => ({ success: vi.fn(), error: vi.fn() }))

mockNuxtImport('useSignalR', () => () => ({
  onAppointmentsChanged: (cb: () => void) => {
    signalr.callback = cb
    return signalr.unsubscribe
  },
}))

// The stubbed LayoutPublicNavbar is auto-registered globally, so the stub does
// not always override it; mock the composables its subtree pulls in so a real
// render can't crash the mount (same approach as publicNavbar.integration).
mockNuxtImport('useShopIdentity', () => () => ({
  shopName: { value: 'BarberShop' },
  monogram: { value: 'B' },
}))

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key,
  locale: { value: 'en' },
  locales: { value: [{ code: 'en', name: 'English' }, { code: 'pt-BR', name: 'Português' }] },
}))

mockNuxtImport('useSwitchLocalePath', () => () => (code: string) => `/${code}`)

mockNuxtImport('useColorMode', () => () => ({ value: 'dark', preference: 'dark' }))

const mountWorker = async () => {
  const { default: WorkerPage } = await import('~/pages/worker.vue')
  const wrapper = mount(WorkerPage, {
    global: {
      // The auto-registered PublicNavbar renders (its `true` stub doesn't
      // override the global registration) and reads the global $t.
      mocks: { $t: (key: string) => key },
      stubs: {
        LayoutPublicNavbar: true,
        SharedDateRangeFilter: true,
        UiSkeleton: true,
        ClientAppointmentCard: true,
        NuxtLink: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

const APPT = {
  id: 1,
  status: 0,
  scheduledFor: '2099-01-01T10:00:00',
  workerId: 1,
  customerId: 1,
  serviceId: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
  signalr.callback = null
  meMock.mockResolvedValue({ id: 2, workerId: 1, customerId: null })
})

describe('worker.vue — live schedule updates', () => {
  it('subscribes to appointment changes on mount', async () => {
    byWorkerMock.mockResolvedValue([])

    await mountWorker()

    expect(signalr.callback).toBeTypeOf('function')
  })

  it('refetches the worker schedule when a booking is pushed', async () => {
    // First load: empty. After the "booking", the refetch returns one appt.
    byWorkerMock.mockResolvedValueOnce([]).mockResolvedValueOnce([APPT])

    await mountWorker()
    expect(byWorkerMock).toHaveBeenCalledTimes(1)

    // Simulate the SignalR AppointmentsChanged push.
    signalr.callback?.()
    await flushPromises()

    expect(byWorkerMock).toHaveBeenCalledTimes(2)
    expect(byWorkerMock).toHaveBeenLastCalledWith(1)
  })

  it('unsubscribes on unmount', async () => {
    byWorkerMock.mockResolvedValue([])

    const wrapper = await mountWorker()
    wrapper.unmount()

    expect(signalr.unsubscribe).toHaveBeenCalledTimes(1)
  })
})
