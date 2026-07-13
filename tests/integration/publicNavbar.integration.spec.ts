// Integration test for components/layout/PublicNavbar.vue.
// Regression guard: the "My Schedule" link (to /worker) must appear for a
// logged-in worker. It is gated on a linked workerId resolved from the API —
// and that lookup must use the self-service /users/me endpoint, NOT the
// Admin-only GET /users/{id}, or the call 403s for the worker and the link
// silently never renders (sprint12072026 follow-up to sprint070726 §1.1).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const meMock = vi.hoisted(() => vi.fn())
const byIdMock = vi.hoisted(() => vi.fn())

const authState = vi.hoisted(() => ({
  isLoggedIn: { value: true },
  isAdmin: { value: false },
  userId: { value: 2 },
  userEmail: { value: 'james.carter@barbershop.com' },
  logout: vi.fn(),
}))

mockNuxtImport('useAuth', () => () => authState)

mockNuxtImport('useApi', () => () => ({
  api: { users: { me: meMock, byId: byIdMock } },
}))

mockNuxtImport('useShopIdentity', () => () => ({
  shopName: { value: 'BarberShop' },
  monogram: { value: 'B' },
}))

// Child components (LocaleSwitcher, ThemeToggle) pull in the Nuxt-i18n and
// color-mode composables — stub just enough that they mount without a full
// Nuxt runtime. The navbar itself uses only the global $t (mocked below).
mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key,
  locale: { value: 'en' },
  locales: { value: [{ code: 'en', name: 'English' }, { code: 'pt-BR', name: 'Português' }] },
}))

mockNuxtImport('useSwitchLocalePath', () => () => (code: string) => `/${code}`)

mockNuxtImport('useColorMode', () => () => ({ value: 'dark', preference: 'dark' }))

const mountNavbar = async () => {
  const { default: PublicNavbar } = await import('~/components/layout/PublicNavbar.vue')
  const wrapper = mount(PublicNavbar, {
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        ClientOnly: { template: '<div><slot /></div>' },
        SidebarIcon: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

const scheduleLink = (wrapper: Awaited<ReturnType<typeof mountNavbar>>) =>
  wrapper.findAll('a').find((a) => a.attributes('href') === '/worker')

beforeEach(() => {
  vi.clearAllMocks()
  authState.isLoggedIn.value = true
  authState.isAdmin.value = false
})

describe('PublicNavbar — worker schedule link', () => {
  it('shows the /worker link for a logged-in worker', async () => {
    meMock.mockResolvedValue({ id: 2, workerId: 1, customerId: null })

    const wrapper = await mountNavbar()

    expect(scheduleLink(wrapper)).toBeTruthy()
  })

  it('resolves the worker profile via /users/me, never the Admin-only byId', async () => {
    meMock.mockResolvedValue({ id: 2, workerId: 1, customerId: null })

    await mountNavbar()

    expect(meMock).toHaveBeenCalled()
    expect(byIdMock).not.toHaveBeenCalled()
  })

  it('hides the /worker link for a client (no linked workerId)', async () => {
    meMock.mockResolvedValue({ id: 7, workerId: null, customerId: 2 })

    const wrapper = await mountNavbar()

    expect(scheduleLink(wrapper)).toBeFalsy()
  })

  it('hides the /worker link when logged out', async () => {
    authState.isLoggedIn.value = false
    meMock.mockResolvedValue({ id: 2, workerId: 1, customerId: null })

    const wrapper = await mountNavbar()

    expect(scheduleLink(wrapper)).toBeFalsy()
  })
})
