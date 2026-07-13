<script setup lang="ts">
// Public terms of service (sprint12072026license §3). All copy lives in the
// i18n catalogues; shop identity and contact come from runtime config so a
// rented instance publishes its own name/email without code changes.
definePageMeta({ layout: 'default' })

const { t } = useI18n()
const config = useRuntimeConfig()
// Locale-aware link back home ("/" vs "/pt-BR").
const localePath = useLocalePath()

const { shopName: shop } = useShopIdentity()
const email = computed(() => config.public.shopEmail as string)

useHead(() => ({ title: `${t('legal.terms.title')} — ${shop.value}` }))
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-16">
    <h1 class="font-display text-3xl text-primary mb-2">{{ $t('legal.terms.title') }}</h1>
    <p class="text-muted text-sm mb-10 font-mono">{{ $t('legal.lastUpdated') }}</p>

    <div class="space-y-8 text-secondary leading-relaxed text-sm">
      <p>{{ $t('legal.terms.intro') }}</p>

      <section>
        <h2 class="font-display text-xl text-primary mb-2">{{ $t('legal.terms.serviceTitle') }}</h2>
        <p>{{ $t('legal.terms.serviceBody', { shop }) }}</p>
      </section>

      <section>
        <h2 class="font-display text-xl text-primary mb-2">{{ $t('legal.terms.accountsTitle') }}</h2>
        <p>{{ $t('legal.terms.accountsBody') }}</p>
      </section>

      <section>
        <h2 class="font-display text-xl text-primary mb-2">{{ $t('legal.terms.bookingsTitle') }}</h2>
        <p>{{ $t('legal.terms.bookingsBody') }}</p>
      </section>

      <section>
        <h2 class="font-display text-xl text-primary mb-2">{{ $t('legal.terms.acceptableTitle') }}</h2>
        <p>{{ $t('legal.terms.acceptableBody') }}</p>
      </section>

      <section>
        <h2 class="font-display text-xl text-primary mb-2">{{ $t('legal.terms.demoTitle') }}</h2>
        <p>{{ $t('legal.terms.demoBody') }}</p>
      </section>

      <section>
        <h2 class="font-display text-xl text-primary mb-2">{{ $t('legal.terms.liabilityTitle') }}</h2>
        <p>{{ $t('legal.terms.liabilityBody') }}</p>
      </section>

      <section>
        <h2 class="font-display text-xl text-primary mb-2">{{ $t('legal.terms.changesTitle') }}</h2>
        <p>{{ $t('legal.terms.changesBody', { email }) }}</p>
      </section>
    </div>

    <div class="mt-12">
      <NuxtLink
        :to="localePath('/')"
        class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {{ $t('common.backToHome') }}
      </NuxtLink>
    </div>
  </div>
</template>
