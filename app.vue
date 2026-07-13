<script setup lang="ts">
// Root component. Delegates entirely to the active layout + page; the layout
// is selected by each page via definePageMeta({ layout: ... }).

// Sets <html lang="..."> to match the active locale (sprint070726 §4.6) —
// required for the html-has-lang a11y rule and correct screen-reader behavior.
// The link/meta arrays carry the hreflang alternates, canonical link and
// og:locale tags the module derives from i18n.baseUrl — dropping them here
// would silently discard the SEO half of what useLocaleHead computes.
const i18nHead = useLocaleHead()

// White-label tab title (sprint12072026license §4): rented instances set
// NUXT_PUBLIC_SHOP_NAME at runtime — no rebuild needed for the title. Pages
// that set their own title (e.g. /privacy) still win over this default.
const { shopName } = useShopIdentity()

useHead(() => ({
  title: shopName.value,
  htmlAttrs: { lang: i18nHead.value.htmlAttrs?.lang },
  link: [...(i18nHead.value.link ?? [])],
  meta: [...(i18nHead.value.meta ?? [])],
}))
</script>

<template>
  <!-- Service-worker update banner — rendered above every page. ClientOnly
       since useRegisterSW touches `navigator`, which doesn't exist in SSR. -->
  <ClientOnly>
    <UiUpdatePrompt />
  </ClientOnly>
  <!-- NuxtLayout wraps the active page in the layout selected by the route. -->
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
