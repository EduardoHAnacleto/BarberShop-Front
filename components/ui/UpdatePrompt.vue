<script setup lang="ts">
// Banner shown when the service worker detects a newer version of the app.
// useRegisterSW comes from the @vite-pwa/nuxt virtual module; calls
// updateServiceWorker() to activate the waiting service worker immediately.
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()
</script>

<template>
  <Transition name="slide-down">
    <div
      v-if="needRefresh"
      class="fixed top-0 inset-x-0 z-[9999] flex items-center justify-between
             gap-4 px-4 py-3 bg-gold-500 text-obsidian-950 text-sm font-medium
             shadow-lg"
      role="alert"
    >
      <span>A new version is available.</span>
      <button
        class="shrink-0 px-3 py-1 rounded bg-obsidian-950/15 hover:bg-obsidian-950/25
               transition-colors font-semibold"
        @click="updateServiceWorker()"
      >
        Update now
      </button>
    </div>
  </Transition>
</template>
