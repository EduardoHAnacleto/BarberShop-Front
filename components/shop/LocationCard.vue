<script setup lang="ts">
// Displays the shop's embedded map, address, phone and email.
// compact=true renders a shorter map height — used on /book/success.
// compact=false renders a taller map — used on /about.
defineProps<{ compact?: boolean }>()

const config = useRuntimeConfig()

// Values read from NUXT_PUBLIC_SHOP_* build-time env vars.
const shopAddress = config.public.shopAddress as string
const shopPhone = config.public.shopPhone as string
const shopEmail = config.public.shopEmail as string
const lat = config.public.shopLat as string
const lng = config.public.shopLng as string
const mapsKey = config.public.googleMapsApiKey as string

// Build the iframe src: Embed API v1 when a Maps API key is present,
// otherwise the no-key query-param URL (works for development / placeholder).
const mapSrc = computed<string>(() => {
  if (!lat || !lng) return ''
  if (mapsKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${lat},${lng}`
  }
  return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
})
</script>

<template>
  <div class="card space-y-4">
    <h3 class="font-display text-lg text-primary">{{ $t('location.findUs') }}</h3>

    <!-- Embedded Google Map. -->
    <div v-if="mapSrc" class="rounded-lg overflow-hidden border border-border">
      <iframe
        :src="mapSrc"
        :class="compact ? 'h-44' : 'h-72'"
        class="w-full"
        style="border: 0"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        :title="$t('location.mapTitle')"
        :aria-label="$t('location.mapAriaLabel')"
      />
    </div>

    <!-- Contact details. -->
    <address class="not-italic space-y-2.5 text-sm">
      <!-- Street address. -->
      <div v-if="shopAddress" class="flex items-start gap-2.5 text-secondary">
        <svg class="w-4 h-4 mt-0.5 shrink-0 text-gold-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{{ shopAddress }}</span>
      </div>

      <!-- Phone number — tel: hyperlink. -->
      <div v-if="shopPhone" class="flex items-center gap-2.5">
        <svg class="w-4 h-4 shrink-0 text-gold-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <a :href="`tel:${shopPhone}`" class="text-secondary hover:text-gold-400 transition-colors">
          {{ shopPhone }}
        </a>
      </div>

      <!-- Email address — mailto: hyperlink. -->
      <div v-if="shopEmail" class="flex items-center gap-2.5">
        <svg class="w-4 h-4 shrink-0 text-gold-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <a :href="`mailto:${shopEmail}`" class="text-secondary hover:text-gold-400 transition-colors">
          {{ shopEmail }}
        </a>
      </div>
    </address>
  </div>
</template>
