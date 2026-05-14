// Unit tests for components/schedule/IsOpenBanner.vue.
// Verifies that the correct badge and text are shown for open and closed states.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockIsOpen = vi.hoisted(() => vi.fn())
const mockGetByDay = vi.hoisted(() => vi.fn())

// Re-apply resolved values after vitest restoreMocks strips them.
beforeEach(() => {
  mockIsOpen.mockResolvedValue({ isOpen: false })
  mockGetByDay.mockResolvedValue({ isOpen: false, openTime: null, closeTime: null })
})

mockNuxtImport('useApi', () => () => ({
  api: {
    schedule: {
      isOpen: mockIsOpen,
      getByDay: mockGetByDay,
    },
  },
}))

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('IsOpenBanner', () => {
  it('shows "Open Now" badge when the shop is open', async () => {
    mockIsOpen.mockResolvedValue({ isOpen: true })
    mockGetByDay.mockResolvedValue({
      isOpen: true,
      openTime: '09:00:00',
      closeTime: '18:00:00',
    })

    const { default: IsOpenBanner } = await import('~/components/schedule/IsOpenBanner.vue')
    const wrapper = mount(IsOpenBanner)
    await flushPromises()

    expect(wrapper.text()).toContain('Open')
    expect(wrapper.text()).not.toContain('Closed')
  })

  it('shows "Closed" badge when the shop is closed', async () => {
    mockIsOpen.mockResolvedValue({ isOpen: false })
    mockGetByDay.mockResolvedValue({
      isOpen: false,
      openTime: '09:00:00',
      closeTime: '18:00:00',
    })

    const { default: IsOpenBanner } = await import('~/components/schedule/IsOpenBanner.vue')
    const wrapper = mount(IsOpenBanner)
    await flushPromises()

    expect(wrapper.text()).toContain('Closed')
    expect(wrapper.text()).not.toContain('Open Now')
  })

  it('shows the skeleton before the first fetch resolves', async () => {
    // Never resolve — component stays in loading state.
    mockIsOpen.mockReturnValue(new Promise(() => {}))

    const { default: IsOpenBanner } = await import('~/components/schedule/IsOpenBanner.vue')
    const wrapper = mount(IsOpenBanner)

    // Before flushPromises: isOpen is still null → skeleton renders.
    expect(wrapper.find('.skeleton').exists()).toBe(true)
  })

  it('clears the interval on unmount', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const { default: IsOpenBanner } = await import('~/components/schedule/IsOpenBanner.vue')
    const wrapper = mount(IsOpenBanner)
    await flushPromises()

    wrapper.unmount()

    expect(clearSpy).toHaveBeenCalled()
  })
})
