<script setup lang="ts">
// Sticky public navigation bar with backdrop-blur.
// Shows "My Account" for any logged-in user and "Admin" for admins.
const { isLoggedIn, isAdmin } = useAuth()
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
          <span class="font-display font-bold text-gold-400 text-base">B</span>
        </div>
        <span class="font-display text-lg text-primary">BarberShop</span>
      </NuxtLink>

      <!-- Page anchor links + conditional Admin CTA. -->
      <nav class="flex items-center gap-5 sm:gap-6">
        <a href="#services" class="text-sm text-secondary hover:text-primary transition-colors">
          Services
        </a>
        <a href="#team" class="text-sm text-secondary hover:text-primary transition-colors">
          Team
        </a>
        <NuxtLink to="/book" class="text-sm text-secondary hover:text-primary transition-colors">
          Book
        </NuxtLink>
        <!-- My Account: shown for any logged-in user. -->
        <NuxtLink v-if="isLoggedIn" to="/my" class="text-sm text-secondary hover:text-primary transition-colors">
          My Account
        </NuxtLink>
        <!-- Admin shortcut: only for admin-role users. -->
        <NuxtLink v-if="isAdmin" to="/admin" class="btn-ghost text-sm py-1 px-3">
          Admin
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
