// Unit tests for components/booking/StepWorkerTime.vue — focused on the
// star-rating badge added by the reviews feature (Sprint070726 §5.4).
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Worker } from '~/types'

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
  loadingSchedule: false,
  timeSlots: [],
  selectedTime: '',
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
    })

    expect(wrapper.text()).toContain('No reviews')
  })
})
