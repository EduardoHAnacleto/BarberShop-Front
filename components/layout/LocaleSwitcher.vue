<script setup lang="ts">
// Compact EN / PT-BR toggle for the public navbar (sprint070726 §4.6).
// Just two locales today, so a two-button toggle reads better than a dropdown.
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const availableLocales = computed(() => locales.value)
</script>

<template>
  <div
    class="flex items-center gap-1 border-t md:border-t-0 md:border-l border-border
           pt-3 md:pt-0 md:pl-3 mt-2 md:mt-0 md:ml-1"
  >
    <NuxtLink
      v-for="l in availableLocales"
      :key="l.code"
      :to="switchLocalePath(l.code)"
      class="text-xs font-mono px-1.5 py-0.5 rounded transition-colors"
      :class="l.code === locale
        ? 'text-gold-400 bg-gold-500/10'
        : 'text-muted hover:text-secondary'"
      :aria-label="l.name"
    >
      {{ l.code === 'en' ? 'EN' : 'PT' }}
    </NuxtLink>
  </div>
</template>
