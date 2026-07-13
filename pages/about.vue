<script setup lang="ts">
// Public About page — shop story, contact details and location map.
definePageMeta({ layout: 'default' })

// White-label identity (sprint12072026license §4): monogram medallion and
// the {shop} interpolation in the story paragraph.
const { shopName, monogram } = useShopIdentity()
</script>

<template>
  <div class="min-h-screen">
    <!-- Sticky navigation. -->
    <LayoutPublicNavbar />

    <div class="max-w-3xl mx-auto px-4 py-16 space-y-12">
      <!-- Page header. -->
      <div class="text-center space-y-3">
        <!-- Decorative gold "B" medallion. -->
        <div
          class="w-16 h-16 rounded-xl bg-gold-500/20 border border-gold-500/30
                 flex items-center justify-center mx-auto mb-6"
        >
          <span class="font-display font-bold text-gold-400 text-2xl">{{ monogram }}</span>
        </div>
        <h1 class="font-display text-4xl text-primary">{{ $t('about.title') }}</h1>
        <p class="text-secondary text-lg max-w-xl mx-auto">
          {{ $t('about.tagline') }}
        </p>
      </div>

      <!-- Divider. -->
      <div class="divider" />

      <!-- Shop story. -->
      <section class="space-y-4">
        <h2 class="font-display text-2xl text-primary">{{ $t('about.storyTitle') }}</h2>
        <p class="text-secondary leading-relaxed">
          {{ $t('about.storyParagraph1', { shop: shopName }) }}
        </p>
        <p class="text-secondary leading-relaxed">
          {{ $t('about.storyParagraph2') }}
        </p>
      </section>

      <!-- Divider. -->
      <div class="divider" />

      <!-- Location & contact — full-size map. -->
      <section>
        <h2 class="font-display text-2xl text-primary mb-6">{{ $t('about.locationTitle') }}</h2>
        <ShopLocationCard :compact="false" />
      </section>
    </div>
  </div>
</template>
