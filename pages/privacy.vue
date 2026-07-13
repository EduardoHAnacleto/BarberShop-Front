<script setup lang="ts">
// Public privacy policy (sprint12072026license §3). All copy lives in the
// i18n catalogues; shop identity and contact come from runtime config so a
// rented instance publishes its own name/email without code changes.
definePageMeta({ layout: 'default' })

const { t } = useI18n()
const config = useRuntimeConfig()
// Locale-aware link back home ("/" vs "/pt-BR").
const localePath = useLocalePath()

const { shopName: shop } = useShopIdentity()
const email = computed(() => config.public.shopEmail as string)

useHead(() => ({ title: `${t('legal.privacy.title')} — ${shop.value}` }))
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-16">
    <h1 class="font-display text-3xl text-primary mb-2">{{ $t('legal.privacy.title') }}</h1>
    <p class="text-muted text-sm mb-10 font-mono">{{ $t('legal.lastUpdated') }}</p>

    <div class="space-y-8 text-secondary leading-relaxed text-sm">
      <p>{{ $t('legal.privacy.intro', { shop }) }}</p>

      <section>
        <h2 class="font-display text-xl text-primary mb-2">{{ $t('legal.privacy.dataTitle') }}</h2>
        <ul class="list-disc pl-5 space-y-1">
          <li>{{ $t('legal.privacy.dataAccount') }}</li>
          <li>{{ $t('legal.privacy.dataUsage') }}</li>
          <li>{{ $t('legal.privacy.dataTechnical') }}</li>
        </ul>
      </section>

      <section>
        <h2 class="font-display text-xl text-primary mb-2">{{ $t('legal.privacy.purposeTitle') }}</h2>
        <p>{{ $t('legal.privacy.purposeBody') }}</p>
      </section>

      <section>
        <h2 class="font-display text-xl text-primary mb-2">{{ $t('legal.privacy.sharingTitle') }}</h2>
        <p>{{ $t('legal.privacy.sharingBody') }}</p>
      </section>

      <section>
        <h2 class="font-display text-xl text-primary mb-2">{{ $t('legal.privacy.rightsTitle') }}</h2>
        <p>{{ $t('legal.privacy.rightsBody', { email }) }}</p>
      </section>

      <section>
        <h2 class="font-display text-xl text-primary mb-2">{{ $t('legal.privacy.retentionTitle') }}</h2>
        <p>{{ $t('legal.privacy.retentionBody') }}</p>
      </section>

      <section>
        <h2 class="font-display text-xl text-primary mb-2">{{ $t('legal.privacy.changesTitle') }}</h2>
        <p>{{ $t('legal.privacy.changesBody', { email }) }}</p>
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
