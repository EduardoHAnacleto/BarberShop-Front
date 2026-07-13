// Unit tests for components/booking/StepWorkerTime.vue — focused on the
// star-rating badge added by the reviews feature (Sprint070726 §5.4).
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import type { Worker } from '~/types'
import en from '~/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, 'pt-BR': en } })
const global = { plugins: [i18n] }

function makeWorker(overrides: Partial<Worker> = {}): Worker {
  return {
    id: 1,
    name: 'James Carter',
    email: 'james@barbershop.com',
    phoneNumber: '555-0100',
    address: '',
    position: 'Barber',
    wagePerHour: 25,
    dateOfBirth: '1990-01-01',
    servicesId: [],
    providedServices: [],
    ...overrides,
  }
}

const BASE_PROPS = {
  loadingWorkers: false,
  selectedWorkerId: null,
  selectedDate: '',
  dayIsClosed: false,
  dayIsFullyBooked: false,
  loadingSchedule: false,
  timeSlots: [],
  selectedTime: '',
  onWaitlist: false,
  joiningWaitlist: false,
}

describe('StepWorkerTime — worker rating badges', () => {
  it('shows the average rating and count when the worker has reviews', async () => {
    const { default: StepWorkerTime } = await import('~/components/booking/StepWorkerTime.vue')
    const wrapper = mount(StepWorkerTime, {
      props: {
        ...BASE_PROPS,
        workers: [makeWorker({ id: 1 })],
        ratings: { 1: { workerId: 1, averageRating: 4.5, reviewCount: 8 } },
      },
      global,
    })

    expect(wrapper.text()).toContain('4.5')
    expect(wrapper.text()).toContain('8')
  })

  it('shows "No reviews" for a worker missing from the ratings map', async () => {
    const { default: StepWorkerTime } = await import('~/components/booking/StepWorkerTime.vue')
    const wrapper = mount(StepWorkerTime, {
      props: {
        ...BASE_PROPS,
        workers: [makeWorker({ id: 2, name: 'New Barber' })],
        ratings: {},
      },
      global,
    })

    expect(wrapper.text()).toContain('No reviews')
  })

  it('renders correctly when the ratings prop is omitted entirely', async () => {
    const { default: StepWorkerTime } = await import('~/components/booking/StepWorkerTime.vue')
    const wrapper = mount(StepWorkerTime, {
      props: {
        ...BASE_PROPS,
        workers: [makeWorker({ id: 3 })],
      },
      global,
    })

    expect(wrapper.text()).toContain('No reviews')
  })
})

describe('StepWorkerTime — waitlist (Sprint070726 §5.6)', () => {
  it('shows a "notify me" button on a fully-booked open day', async () => {
    const { default: StepWorkerTime } = await import('~/components/booking/StepWorkerTime.vue')
    const wrapper = mount(StepWorkerTime, {
      props: {
        ...BASE_PROPS,
        workers: [makeWorker({ id: 1 })],
        selectedWorkerId: 1,
        selectedDate: '2026-08-01',
        dayIsFullyBooked: true,
      },
      global,
    })

    const button = wrapper.findAll('button').find((b) => b.text().includes('Notify me'))
    expect(button?.exists()).toBe(true)
  })

  it('emits join-waitlist when the button is clicked', async () => {
    const { default: StepWorkerTime } = await import('~/components/booking/StepWorkerTime.vue')
    const wrapper = mount(StepWorkerTime, {
      props: {
        ...BASE_PROPS,
        workers: [makeWorker({ id: 1 })],
        selectedWorkerId: 1,
        selectedDate: '2026-08-01',
        dayIsFullyBooked: true,
      },
      global,
    })

    const button = wrapper.findAll('button').find((b) => b.text().includes('Notify me'))
    await button?.trigger('click')

    expect(wrapper.emitted('join-waitlist')).toHaveLength(1)
  })

  it('shows a confirmation instead of the button once already on the waitlist', async () => {
    const { default: StepWorkerTime } = await import('~/components/booking/StepWorkerTime.vue')
    const wrapper = mount(StepWorkerTime, {
      props: {
        ...BASE_PROPS,
        workers: [makeWorker({ id: 1 })],
        selectedWorkerId: 1,
        selectedDate: '2026-08-01',
        dayIsFullyBooked: true,
        onWaitlist: true,
      },
      global,
    })

    expect(wrapper.text()).toContain("You're on the waitlist")
    expect(wrapper.findAll('button').some((b) => b.text().includes('Notify me'))).toBe(false)
  })

  it('does not show the waitlist CTA when the day is closed rather than fully booked', async () => {
    const { default: StepWorkerTime } = await import('~/components/booking/StepWorkerTime.vue')
    const wrapper = mount(StepWorkerTime, {
      props: {
        ...BASE_PROPS,
        workers: [makeWorker({ id: 1 })],
        selectedWorkerId: 1,
        selectedDate: '2026-08-02',
        dayIsClosed: true,
        dayIsFullyBooked: false,
      },
      global,
    })

    expect(wrapper.text()).not.toContain('Notify me')
    expect(wrapper.text()).toContain('Closed on this day')
  })
})
