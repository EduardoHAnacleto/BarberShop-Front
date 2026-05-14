<script setup lang="ts">
// Public landing page: Hero, shop status banner, services grid, and team grid.
// See sprint plan S5.1 for the full specification.
import type { Service, Worker } from '~/types'

definePageMeta({ layout: 'default' })

const { api } = useApi()

// ── Services ─────────────────────────────────────────────────────────────────

const services = ref<Service[]>([])
const servicesLoading = ref(true)

// ── Team ─────────────────────────────────────────────────────────────────────

const workers = ref<Worker[]>([])
const workersLoading = ref(true)

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

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  // Fetch services and workers concurrently; each has its own error boundary.
  try {
    services.value = await api.services.all()
  } catch {
    // Silent fail — empty-state message is shown below.
  } finally {
    servicesLoading.value = false
  }

  try {
    workers.value = await api.workers.all()
  } catch {
    // Silent fail — empty-state message is shown below.
  } finally {
    workersLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Sticky navigation bar shared across all public pages. -->
    <LayoutPublicNavbar />

    <!-- ── Hero ── -->
    <section
      class="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4"
      style="background: radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.1) 0%, transparent 65%), #0a0a0a"
    >
      <div class="relative z-10 max-w-3xl mx-auto">
        <!-- Shop open/closed indicator above the headline. -->
        <ScheduleIsOpenBanner class="justify-center mb-6" />

        <h1 class="font-display text-5xl sm:text-7xl font-bold text-gradient-gold leading-tight mb-4">
          Premium<br>Barbershop
        </h1>
        <p class="text-secondary text-lg sm:text-xl mb-10 max-w-xl mx-auto">
          Expert cuts, classic shaves, and modern styles. Book your appointment today.
        </p>

        <!-- Primary CTAs: book appointment or browse services. -->
        <div class="flex flex-wrap items-center justify-center gap-4">
          <NuxtLink to="/book" class="btn-primary">Book Now</NuxtLink>
          <a href="#services" class="btn-outline">Our Services</a>
        </div>
      </div>
    </section>

    <!-- ── Services ── -->
    <section id="services" class="py-20 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="font-display text-3xl text-primary mb-2">Our Services</h2>
          <p class="text-secondary">Choose the perfect service for your style.</p>
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
          No services available at the moment.
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
              Book this service
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Team ── -->
    <section id="team" class="py-20 px-4 border-t border-border">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="font-display text-3xl text-primary mb-2">Meet the Team</h2>
          <p class="text-secondary">Skilled professionals dedicated to your style.</p>
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
          No team members to display yet.
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
      <p>© {{ new Date().getFullYear() }} BarberShop. All rights reserved.</p>
    </footer>
  </div>
</template>
