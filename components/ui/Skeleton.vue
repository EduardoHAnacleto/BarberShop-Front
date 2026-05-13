<script setup lang="ts">
// Animated shimmer placeholder. Renders `count` skeleton bars with the given
// height while data is loading. Uses the .skeleton class from global.css.
withDefaults(
  defineProps<{
    // Number of skeleton bars to render side-by-side in a flex column.
    count?: number
    // Tailwind height class applied to each bar (e.g. "h-10", "h-6").
    height?: string
  }>(),
  { count: 1, height: 'h-10' },
)
</script>

<template>
  <!-- Vertical stack of skeleton bars. Each bar fills its container width. -->
  <div class="flex flex-col gap-2">
    <div
      v-for="n in count"
      :key="n"
      class="skeleton w-full rounded"
      :class="height"
    />
  </div>
</template>
