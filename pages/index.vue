<script setup lang="ts">
// Public landing page: Hero, shop status banner, services grid, and team grid.
// See sprint plan S5.1 for the full specification.
import type { Service, Worker } from '~/types'

definePageMeta({ layout: 'default' })

const config = useRuntimeConfig()

// The SSR pass can't resolve the relative client apiBase (no browser origin
// on the server) — use the internal Docker DNS there, exactly like useApi()
// does (sprint070726 §4.8). Without this the server fetch fails silently and
// getCachedData then re-serves the baked empty payload to the client, so the
// services/team sections rendered permanently empty under SSR.
const apiBase = import.meta.server
  ? ((config.apiBaseInternal as string) || (config.public.apiBase as string))
  : (config.public.apiBase as string)

// Locale-aware paths for the footer's legal links ("/privacy" vs "/pt-BR/privacy").
const localePath = useLocalePath()

// White-label shop name for the footer copyright (sprint12072026license §4).
const { shopName } = useShopIdentity()

// ── Services — cached with useLazyFetch (S6.2) ──────────────────────────────
// getCachedData re-uses Nuxt payload on back-navigation; avoids re-fetching
// within the same session.
const {
  data: servicesData,
  pending: servicesLoading,
} = useLazyFetch<Service[]>(`${apiBase}/api/services/all`, {
  key: 'landing-services',
  getCachedData: (key, nuxtApp) => (nuxtApp.payload.data[key] as Service[] | undefined),
  default: () => [] as Service[],
})

const services = computed(() => servicesData.value ?? [])

// ── Team — cached with useLazyFetch (S6.2) ──────────────────────────────────
const {
  data: workersData,
  pending: workersLoading,
} = useLazyFetch<Worker[]>(`${apiBase}/api/workers/all`, {
  key: 'landing-workers',
  getCachedData: (key, nuxtApp) => (nuxtApp.payload.data[key] as Worker[] | undefined),
  default: () => [] as Worker[],
})

const workers = computed(() => workersData.value ?? [])

// ── Display helpers ───────────────────────────────────────────────────────────

// Formats a price value as a dollar-prefixed string with 2 decimal places.
function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

// Formats a duration in minutes as a human-readable string (e.g. "1h 30min").
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
</script>

<template>
  <div class="min-h-screen">
    <!-- Sticky navigation bar shared across all public pages. -->
    <LayoutPublicNavbar />

    <!-- ── Hero ── -->
    <section
      class="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4"
      style="background: radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.1) 0%, transparent 65%), var(--bg)"
    >
      <div class="relative z-10 max-w-3xl mx-auto">
        <!-- Shop open/closed indicator above the headline. -->
        <ScheduleIsOpenBanner class="justify-center mb-6" />

        <h1 class="font-display text-5xl sm:text-7xl font-bold text-gradient-gold leading-tight mb-4">
          {{ $t('home.heroTitle') }}
        </h1>
        <p class="text-secondary text-lg sm:text-xl mb-10 max-w-xl mx-auto">
          {{ $t('home.heroSubtitle') }}
        </p>

        <!-- Primary CTAs: book appointment or browse services. -->
        <div class="flex flex-wrap items-center justify-center gap-4">
          <NuxtLink to="/book" class="btn-primary">{{ $t('home.bookNow') }}</NuxtLink>
          <a href="#services" class="btn-outline">{{ $t('home.ourServices') }}</a>
        </div>
      </div>
    </section>

    <!-- ── Services ── -->
    <section id="services" class="py-20 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="font-display text-3xl text-primary mb-2">{{ $t('home.ourServices') }}</h2>
          <p class="text-secondary">{{ $t('home.servicesSubtitle') }}</p>
        </div>

        <!-- Skeleton while data loads. -->
        <div
          v-if="servicesLoading"
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        >
          <div v-for="n in 3" :key="n" class="card space-y-2">
            <UiSkeleton height="h-6" class="w-40" />
            <UiSkeleton height="h-4" class="w-full" />
            <UiSkeleton height="h-4" class="w-24" />
          </div>
        </div>

        <!-- Empty state. -->
        <p v-else-if="services.length === 0" class="text-center text-muted py-12">
          {{ $t('home.noServices') }}
        </p>

        <!-- Service cards. -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="svc in services"
            :key="svc.id"
            class="card flex flex-col gap-3"
          >
            <h3 class="font-display text-xl text-primary">{{ svc.name }}</h3>
            <p class="text-secondary text-sm flex-1 line-clamp-2">{{ svc.description }}</p>
            <div class="flex items-center justify-between">
              <span class="font-mono text-xs text-muted">{{ formatDuration(svc.duration) }}</span>
              <span class="font-display text-gold-400 font-semibold">{{ formatPrice(svc.price) }}</span>
            </div>
            <NuxtLink
              :to="`/book?serviceId=${svc.id}`"
              class="btn-primary text-sm text-center"
            >
              {{ $t('home.bookThisService') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Team ── -->
    <section id="team" class="py-20 px-4 border-t border-border">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="font-display text-3xl text-primary mb-2">{{ $t('home.meetTheTeam') }}</h2>
          <p class="text-secondary">{{ $t('home.teamSubtitle') }}</p>
        </div>

        <!-- Skeleton while data loads. -->
        <div
          v-if="workersLoading"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div v-for="n in 3" :key="n" class="card text-center space-y-3">
            <UiSkeleton height="h-14" class="w-14 rounded-full mx-auto" />
            <UiSkeleton height="h-5" class="w-32 mx-auto" />
            <UiSkeleton height="h-4" class="w-20 mx-auto" />
          </div>
        </div>

        <!-- Empty state. -->
        <p v-else-if="workers.length === 0" class="text-center text-muted py-12">
          {{ $t('home.noTeam') }}
        </p>

        <!-- Worker cards. -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="worker in workers"
            :key="worker.id"
            class="card flex flex-col items-center text-center gap-3"
          >
            <!-- Coloured initial avatar. -->
            <div
              class="w-14 h-14 rounded-full flex items-center justify-center
                     text-xl font-display font-bold text-gold-400
                     bg-gold-500/10 border border-gold-500/20"
            >
              {{ worker.name.charAt(0).toUpperCase() }}
            </div>

            <div>
              <h3 class="font-display text-lg text-primary">{{ worker.name }}</h3>
              <p class="text-secondary text-sm">{{ worker.position }}</p>
            </div>

            <!-- Service tags, capped at 3 with overflow indicator. -->
            <div
              v-if="worker.providedServices.length > 0"
              class="flex flex-wrap justify-center gap-1"
            >
              <span
                v-for="svc in worker.providedServices.slice(0, 3)"
                :key="svc.id"
                class="badge badge-gray text-xs"
              >
                {{ svc.name }}
              </span>
              <span
                v-if="worker.providedServices.length > 3"
                class="badge badge-gray text-xs"
              >
                +{{ worker.providedServices.length - 3 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-border py-8 px-4 text-center text-muted text-sm">
      <p>{{ $t('footer.copyright', { year: new Date().getFullYear(), shop: shopName }) }}</p>
      <p class="mt-2 space-x-4">
        <NuxtLink :to="localePath('/privacy')" class="hover:text-secondary transition-colors underline underline-offset-2">
          {{ $t('legal.privacy.title') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/terms')" class="hover:text-secondary transition-colors underline underline-offset-2">
          {{ $t('legal.terms.title') }}
        </NuxtLink>
      </p>
    </footer>
  </div>
</template>
