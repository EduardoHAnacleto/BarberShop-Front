<script setup lang="ts">
// Indicates sort direction for a sortable table column header.
// Shows a neutral double-arrow when inactive, up/down chevron when active.
defineProps<{ active: boolean; dir: 'asc' | 'desc' }>()
</script>

<template>
  <svg
    class="w-3.5 h-3.5 flex-shrink-0 transition-colors"
    :class="active ? 'text-gold-400' : 'text-muted opacity-40'"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    viewBox="0 0 24 24"
  >
    <!-- Neutral: bidirectional arrows -->
    <template v-if="!active">
      <path d="M7 10l5-5 5 5" />
      <path d="M7 14l5 5 5-5" />
    </template>
    <!-- Ascending: up chevron -->
    <path v-else-if="dir === 'asc'" d="M5 15l7-7 7 7" />
    <!-- Descending: down chevron -->
    <path v-else d="M5 9l7 7 7-7" />
  </svg>
</template>
