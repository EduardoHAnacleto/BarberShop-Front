// White-label shop identity (sprint12072026license §4).
// A rented client instance sets NUXT_PUBLIC_SHOP_NAME; the portfolio demo
// keeps the "BarberShop" default. The monogram (logo letter shown in the
// navbar, admin sidebar and auth pages) is derived from the first character.
export function useShopIdentity() {
  const config = useRuntimeConfig()

  const shopName = computed(
    () => (config.public.shopName as string) || 'BarberShop',
  )

  const monogram = computed(() => shopName.value.charAt(0).toUpperCase())

  return { shopName, monogram }
}
