// Unit tests for the white-label identity composable
// (sprint12072026license §4): shop name comes from runtime config with the
// portfolio default as fallback, and the monogram is its first letter.
import { describe, it, expect, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const runtimeConfigMock = vi.hoisted(() =>
  vi.fn(() => ({ public: { shopName: 'BarberShop' } })),
)

mockNuxtImport('useRuntimeConfig', () => runtimeConfigMock)

describe('useShopIdentity', () => {
  it('exposes the configured shop name and derives the monogram', () => {
    runtimeConfigMock.mockReturnValue({ public: { shopName: 'Navalha de Ouro' } })

    const { shopName, monogram } = useShopIdentity()

    expect(shopName.value).toBe('Navalha de Ouro')
    expect(monogram.value).toBe('N')
  })

  it('falls back to the portfolio default when unset', () => {
    runtimeConfigMock.mockReturnValue({ public: { shopName: '' } })

    const { shopName, monogram } = useShopIdentity()

    expect(shopName.value).toBe('BarberShop')
    expect(monogram.value).toBe('B')
  })

  it('uppercases the monogram for lowercase names', () => {
    runtimeConfigMock.mockReturnValue({ public: { shopName: 'barbearia do zé' } })

    const { monogram } = useShopIdentity()

    expect(monogram.value).toBe('B')
  })
})
