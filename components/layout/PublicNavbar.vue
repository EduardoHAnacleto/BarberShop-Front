<script setup lang="ts">
// Sticky public navigation bar with backdrop-blur.
// Shows "My Account" for any logged-in user, "My Schedule" for workers, and "Admin" for admins.
const { isLoggedIn, isAdmin, userEmail, logout } = useAuth()
const { api } = useApi()

// White-label identity (sprint12072026license §4): each rented instance sets
// NUXT_PUBLIC_SHOP_NAME; the monogram is derived from the first letter.
const { shopName, monogram } = useShopIdentity()

// True when the logged-in user has a linked worker profile — drives the
// "My Schedule" link to /worker. Resolved via the self-service /users/me
// endpoint: GET /users/{id} is Admin-only and 403s for a worker, which used
// to leave isWorker permanently false and the link hidden (sprint070726 §1.1
// migrated the portals but missed this navbar).
const isWorker = ref(false)

watchEffect(async () => {
  if (!isLoggedIn.value) { isWorker.value = false; return }
  try {
    const user = await api.users.me()
    isWorker.value = !!user.workerId
  } catch {
    isWorker.value = false
  }
})
</script>

<template>
  <!-- Sticky header with glass-blur effect matching the dark palette. -->
  <header class="sticky top-0 z-40 backdrop-blur-md bg-surface/80 border-b border-border">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
      <!-- Logotype: gold "B" medallion + wordmark. -->
      <NuxtLink to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div
          class="w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-500/30
                 flex items-center justify-center"
        >
          <span class="font-display font-bold text-gold-400 text-base">{{ monogram }}</span>
        </div>
        <span class="font-display text-lg text-primary">{{ shopName }}</span>
      </NuxtLink>

      <!-- Page anchor links + auth CTAs. -->
      <nav class="flex items-center gap-4 sm:gap-5">
        <NuxtLink to="/#services" class="text-sm text-secondary hover:text-primary transition-colors">
          {{ $t('nav.services') }}
        </NuxtLink>
        <NuxtLink to="/#team" class="text-sm text-secondary hover:text-primary transition-colors">
          {{ $t('nav.team') }}
        </NuxtLink>
        <NuxtLink to="/about" class="text-sm text-secondary hover:text-primary transition-colors">
          {{ $t('nav.about') }}
        </NuxtLink>
        <NuxtLink to="/book" class="text-sm text-secondary hover:text-primary transition-colors">
          {{ $t('nav.book') }}
        </NuxtLink>

        <!-- Auth-dependent links are client-only: they depend on the JWT
             cookie, which useAuth only hydrates on the client, so rendering
             them during SSR produced a guest-vs-logged-in hydration mismatch
             that left stale hrefs (e.g. "My Account" pointing at /register). -->
        <ClientOnly>
          <!-- Logged-in links. -->
          <template v-if="isLoggedIn">
            <NuxtLink to="/my" class="text-sm text-secondary hover:text-primary transition-colors">
              {{ $t('nav.myAccount') }}
            </NuxtLink>
            <NuxtLink v-if="isWorker" to="/worker" class="text-sm text-secondary hover:text-primary transition-colors">
              {{ $t('nav.mySchedule') }}
            </NuxtLink>
            <!-- prefetch loads the admin chunk in the background when this link is in view. -->
            <NuxtLink v-if="isAdmin" to="/admin" prefetch class="text-sm text-secondary hover:text-primary transition-colors">
              {{ $t('nav.admin') }}
            </NuxtLink>
            <!-- User email + logout. -->
            <div class="flex items-center gap-2 border-l border-border pl-4 ml-1">
              <span class="hidden sm:block text-xs text-muted font-mono truncate max-w-[140px]">{{ userEmail }}</span>
              <button
                type="button"
                class="btn-ghost text-sm py-1 px-3 flex items-center gap-1.5"
                :aria-label="$t('nav.signOut')"
                @click="logout"
              >
                <!-- Logout icon. -->
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {{ $t('nav.signOut') }}
              </button>
            </div>
          </template>

          <!-- Guest links: client and staff entry points. -->
          <template v-else>
            <NuxtLink to="/register" class="text-sm text-secondary hover:text-primary transition-colors">
              {{ $t('nav.register') }}
            </NuxtLink>
            <NuxtLink to="/login" class="text-sm text-secondary hover:text-primary transition-colors">
              {{ $t('nav.signIn') }}
            </NuxtLink>
            <NuxtLink to="/staff-login" class="btn-ghost text-sm py-1 px-3">
              {{ $t('nav.staffLogin') }}
            </NuxtLink>
          </template>
        </ClientOnly>

        <LayoutLocaleSwitcher />
        <UiThemeToggle />
      </nav>
    </div>
  </header>
</template>
