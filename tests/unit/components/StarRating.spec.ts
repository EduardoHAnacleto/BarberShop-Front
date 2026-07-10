// Unit tests for components/shared/StarRating.vue.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StarRating from '~/components/shared/StarRating.vue'

describe('StarRating', () => {
  it('shows "No reviews" when count is 0 or omitted', () => {
    const wrapper = mount(StarRating, { props: { rating: 0 } })
    expect(wrapper.text()).toContain('No reviews')
  })

  it('shows the rating and count when reviews exist', () => {
    const wrapper = mount(StarRating, { props: { rating: 4.3, count: 12 } })
    expect(wrapper.text()).toContain('4.3')
    expect(wrapper.text()).toContain('12')
  })

  it('fills stars rounded to the nearest whole number', () => {
    const wrapper = mount(StarRating, { props: { rating: 4.3, count: 1 } })
    const filled = wrapper.findAll('span.text-gold-400')
    expect(filled).toHaveLength(4)
  })

  it('renders a singular "review" label for exactly one review', () => {
    const wrapper = mount(StarRating, { props: { rating: 5, count: 1 } })
    expect(wrapper.attributes('aria-label')).toContain('1 review')
    expect(wrapper.attributes('aria-label')).not.toContain('1 reviews')
  })
})
