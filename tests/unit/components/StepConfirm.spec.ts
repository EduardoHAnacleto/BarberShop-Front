// Unit tests for components/booking/StepConfirm.vue — focused on the
// "repeat weekly" toggle added by the recurring-appointments feature
// (Sprint070726 §5.8). Existing summary/form rendering is exercised by the
// booking flow's Playwright E2E coverage.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Service, Worker } from '~/types'

const SERVICE: Service = { id: 1, name: 'Haircut', description: '', duration: 30, price: 25 }
const WORKER: Worker = {
  id: 1,
  name: 'James Carter',
  email: 'james@barbershop.com',
  phoneNumber: '',
  address: '',
  position: 'Barber',
  wagePerHour: 25,
  dateOfBirth: '1990-01-01',
  servicesId: [],
  providedServices: [],
}

const BASE_PROPS = {
  service: SERVICE,
  worker: WORKER,
  selectedDate: '2026-08-01',
  selectedTime: '14:00',
  submitting: false,
  prefill: { name: 'Emily Johnson', email: 'emily@example.com', phone: '555-0100' },
}

describe('StepConfirm — repeat weekly', () => {
  it('omits repeatWeeks from the confirm payload when the toggle is off', async () => {
    const { default: StepConfirm } = await import('~/components/booking/StepConfirm.vue')
    const wrapper = mount(StepConfirm, { props: BASE_PROPS })

    await wrapper.find('form').trigger('submit.prevent')

    const emitted = wrapper.emitted('confirm')
    expect(emitted).toBeTruthy()
    expect(emitted![0]![0]).toMatchObject({ repeatWeeks: undefined })
  })

  it('includes the chosen week count when the toggle is on', async () => {
    const { default: StepConfirm } = await import('~/components/booking/StepConfirm.vue')
    const wrapper = mount(StepConfirm, { props: BASE_PROPS })

    await wrapper.find('#repeat-weekly').setValue(true)
    await wrapper.find('#repeat-weeks').setValue(6)
    await wrapper.find('form').trigger('submit.prevent')

    const emitted = wrapper.emitted('confirm')
    expect(emitted![0]![0]).toMatchObject({ repeatWeeks: 6 })
  })

  it('hides the week-count input until the toggle is checked', async () => {
    const { default: StepConfirm } = await import('~/components/booking/StepConfirm.vue')
    const wrapper = mount(StepConfirm, { props: BASE_PROPS })

    expect(wrapper.find('#repeat-weeks').exists()).toBe(false)

    await wrapper.find('#repeat-weekly').setValue(true)

    expect(wrapper.find('#repeat-weeks').exists()).toBe(true)
  })
})
