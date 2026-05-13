<script setup lang="ts">
// Default layout used by the public-facing pages (/login, /, /book, etc.).
// Provides a minimal dark wrapper and the global toast container.
</script>

<template>
  <!-- Single root element required by the template linter.
       ToastContainer uses Teleport internally so it renders to <body> regardless. -->
  <div class="min-h-screen bg-[var(--bg)]">
    <slot />
    <UiToastContainer />
  </div>
</template>
