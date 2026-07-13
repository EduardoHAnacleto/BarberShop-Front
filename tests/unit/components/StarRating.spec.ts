// Unit tests for components/shared/StarRating.vue.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import StarRating from '~/components/shared/StarRating.vue'
import en from '~/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, 'pt-BR': en } })
const global = { plugins: [i18n] }

describe('StarRating', () => {
  it('shows "No reviews" when count is 0 or omitted', () => {
    const wrapper = mount(StarRating, { props: { rating: 0 }, global })
    expect(wrapper.text()).toContain('No reviews')
  })

  it('shows the rating and count when reviews exist', () => {
    const wrapper = mount(StarRating, { props: { rating: 4.3, count: 12 }, global })
    expect(wrapper.text()).toContain('4.3')
    expect(wrapper.text()).toContain('12')
  })

  it('fills stars rounded to the nearest whole number', () => {
    const wrapper = mount(StarRating, { props: { rating: 4.3, count: 1 }, global })
    const filled = wrapper.findAll('span.text-gold-400')
    expect(filled).toHaveLength(4)
  })

  it('renders a singular "review" label for exactly one review', () => {
    const wrapper = mount(StarRating, { props: { rating: 5, count: 1 }, global })
    expect(wrapper.attributes('aria-label')).toContain('1 review')
    expect(wrapper.attributes('aria-label')).not.toContain('1 reviews')
  })
})
