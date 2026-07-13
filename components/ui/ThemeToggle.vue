<script setup lang="ts">
// Dark/light toggle (sprint070726 §4.5). Reads/writes useColorMode().preference
// so the choice persists via the module's own cookie across visits.
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

function toggle(): void {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <!-- ClientOnly: colorMode.value is only meaningful once hydrated — SSR
       always renders the server's best guess and would otherwise flash. -->
  <ClientOnly>
    <button
      type="button"
      class="w-8 h-8 rounded-lg flex items-center justify-center text-secondary
             hover:text-primary hover:bg-raised transition-colors"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggle"
    >
      <SidebarIcon :icon="isDark ? 'sun' : 'moon'" />
    </button>
    <template #fallback>
      <div class="w-8 h-8" />
    </template>
  </ClientOnly>
</template>
