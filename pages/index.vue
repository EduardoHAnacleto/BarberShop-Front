<script setup lang="ts">
// Public landing page. Sprint 5 replaces this with the full landing page.
definePageMeta({ layout: 'default' })
</script>

<template>
  <!-- Temporary placeholder until Sprint 5 builds the real landing page. -->
  <div class="min-h-screen flex flex-col items-center justify-center gap-6">
    <div
      class="w-16 h-16 rounded-2xl bg-gold-500/20 border border-gold-500/30
             flex items-center justify-center"
    >
      <span class="font-display font-bold text-gold-400 text-3xl">B</span>
    </div>
    <h1 class="font-display text-3xl text-primary">BarberShop</h1>
    <p class="text-secondary text-sm">Online booking coming soon.</p>
    <NuxtLink to="/login" class="btn-primary">Admin login</NuxtLink>
  </div>
</template>
