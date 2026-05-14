// Unit tests for components/BookingStepper.vue.
// Verifies that step states (completed / active / future) render correctly.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

const STEPS = ['Service', 'Professional & Time', 'Confirm']

describe('BookingStepper', () => {
  it('renders the correct number of step indicators', async () => {
    const { default: BookingStepper } = await import('~/components/BookingStepper.vue')
    const wrapper = mount(BookingStepper, {
      props: { currentStep: 1, steps: STEPS },
    })
    // Each step has a div with a step number or check inside it.
    const stepBubbles = wrapper.findAll('.rounded-full')
    expect(stepBubbles.length).toBe(STEPS.length)
  })

  it('shows a checkmark for steps before currentStep', async () => {
    const { default: BookingStepper } = await import('~/components/BookingStepper.vue')
    // currentStep=2 → step 1 should have a check.
    const wrapper = mount(BookingStepper, {
      props: { currentStep: 2, steps: STEPS },
    })
    // The first bubble contains an SVG (checkmark) instead of a number.
    const firstBubble = wrapper.findAll('.rounded-full')[0]
    expect(firstBubble?.find('svg').exists()).toBe(true)
  })

  it('highlights the current step with gold border class', async () => {
    const { default: BookingStepper } = await import('~/components/BookingStepper.vue')
    const wrapper = mount(BookingStepper, {
      props: { currentStep: 2, steps: STEPS },
    })
    // Step 2 (index 1) should carry the gold active class.
    const secondBubble = wrapper.findAll('.rounded-full')[1]
    expect(secondBubble?.classes()).toContain('border-gold-500')
  })

  it('renders future steps without the gold or emerald active classes', async () => {
    const { default: BookingStepper } = await import('~/components/BookingStepper.vue')
    const wrapper = mount(BookingStepper, {
      props: { currentStep: 2, steps: STEPS },
    })
    // Step 3 (index 2) is in the future — should use the muted style.
    const thirdBubble = wrapper.findAll('.rounded-full')[2]
    expect(thirdBubble?.classes()).not.toContain('border-gold-500')
    expect(thirdBubble?.classes()).not.toContain('border-emerald-500')
  })
})
