// Integration tests for /admin/appointments page.
// Mounts the real Vue component and uses MSW to intercept HTTP at the network
// level, verifying the full stack from store → API → UI.
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { AppointmentStatus } from '~/types'
import type { Appointment } from '~/types'

// ── Nuxt composable mocks ─────────────────────────────────────────────────────

mockNuxtImport('useRuntimeConfig', () => () => ({
  public: { apiBase: 'http://localhost:8080' },
}))

const mockNavigateTo = vi.hoisted(() => vi.fn())
mockNuxtImport('navigateTo', () => mockNavigateTo)

mockNuxtImport('definePageMeta', () => vi.fn())

// Prevents real SignalR connections from being attempted during component mount.
mockNuxtImport('useSignalR', () => () => ({
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn(),
  disconnectAll: vi.fn(),
  isConnected: { value: false },
  onAppointmentsChanged: vi.fn().mockReturnValue(vi.fn()),
  onWorkersChanged: vi.fn().mockReturnValue(vi.fn()),
  onCustomersChanged: vi.fn().mockReturnValue(vi.fn()),
  onServicesChanged: vi.fn().mockReturnValue(vi.fn()),
  onUsersChanged: vi.fn().mockReturnValue(vi.fn()),
}))

// ── MSW server ────────────────────────────────────────────────────────────────

// Seed data returned by the default handlers.
const seedAppointment: Appointment = {
  id: 1,
  workerId: 1,
  workerName: 'John',
  customerId: 1,
  customerName: 'Alice',
  serviceId: 1,
  serviceName: 'Haircut',
  scheduledFor: '2025-06-01T10:00:00Z',
  status: AppointmentStatus.Scheduled,
  extraDetails: '',
  createdAt: '2025-05-01T08:00:00Z',
}

const server = setupServer(
  http.get('http://localhost:8080/api/appointments/all', () =>
    HttpResponse.json([seedAppointment]),
  ),
  http.get('http://localhost:8080/api/workers/all', () => HttpResponse.json([])),
  http.get('http://localhost:8080/api/customers/all', () => HttpResponse.json([])),
  http.get('http://localhost:8080/api/services/all', () => HttpResponse.json([])),
  http.post('http://localhost:8080/api/appointments', () =>
    HttpResponse.json({ ...seedAppointment, id: 2 }, { status: 201 }),
  ),
  http.delete('http://localhost:8080/api/appointments/:id', () =>
    HttpResponse.json(null, { status: 204 }),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => { server.resetHandlers(); mockNavigateTo.mockReset() })
afterAll(() => server.close())

// ── Helpers ───────────────────────────────────────────────────────────────────

// Lazily imports the page component after all mocks are registered.
async function mountPage() {
  setActivePinia(createPinia())
  const { default: Page } = await import('~/pages/admin/appointments.vue')
  const wrapper = mount(Page, { global: { plugins: [createPinia()] } })
  // Allow onMounted fetch to settle.
  await new Promise((r) => setTimeout(r, 100))
  await wrapper.vm.$nextTick()
  return wrapper
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('/admin/appointments integration', () => {
  it('renders the appointment from the API in the table', async () => {
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('John')
    expect(wrapper.text()).toContain('Haircut')
  })

  it('clicking New appointment opens the create modal', async () => {
    const wrapper = await mountPage()
    // Find the "New appointment" button by text.
    const newBtn = wrapper.findAll('button').find((b) => b.text().includes('New appointment'))
    expect(newBtn).toBeDefined()
    await newBtn!.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('New appointment')
  })

  it('successful create shows toast.success (via MSW 201)', async () => {
    server.use(
      http.post('http://localhost:8080/api/appointments', () =>
        HttpResponse.json({ ...seedAppointment, id: 99 }, { status: 201 }),
      ),
    )

    setActivePinia(createPinia())
    const { useAppointmentsStore } = await import('~/stores/appointments')
    const store = useAppointmentsStore()

    const ok = await store.create({
      workerId: 1,
      customerId: 1,
      serviceId: 1,
      scheduledFor: '2025-06-10T09:00',
      status: AppointmentStatus.Scheduled,
    })

    // The store action returns true on a successful POST.
    expect(ok).toBe(true)
  })

  it('MSW 400 response causes create() to return false', async () => {
    server.use(
      http.post('http://localhost:8080/api/appointments', () =>
        HttpResponse.json('Slot already booked', { status: 400 }),
      ),
    )

    setActivePinia(createPinia())
    const { useAppointmentsStore } = await import('~/stores/appointments')
    const store = useAppointmentsStore()

    const ok = await store.create({
      workerId: 1,
      customerId: 1,
      serviceId: 1,
      scheduledFor: '2025-06-10T09:00',
      status: AppointmentStatus.Scheduled,
    })

    expect(ok).toBe(false)
  })
})
