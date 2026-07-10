<script setup lang="ts">
// Read-only star rating badge. Renders 5 stars, filled up to the rounded
// rating, plus an optional review count. Used on booking worker cards, the
// admin reviews table, and anywhere else an aggregate rating is displayed.
const props = withDefaults(
  defineProps<{
    // 0–5, may be fractional (e.g. 4.3); rounded to the nearest whole star.
    rating: number
    // Number of reviews behind the rating. When 0/undefined, shows "No reviews".
    count?: number
  }>(),
  { count: 0 },
)

const filledStars = computed(() => Math.round(props.rating))

const label = computed(() =>
  props.count > 0
    ? `${props.rating.toFixed(1)} out of 5 stars from ${props.count} review${props.count === 1 ? '' : 's'}`
    : 'No reviews yet',
)
</script>

<template>
  <span class="inline-flex items-center gap-1" :aria-label="label" role="img">
    <span class="flex" aria-hidden="true">
      <span
        v-for="i in 5"
        :key="i"
        class="text-sm leading-none"
        :class="i <= filledStars ? 'text-gold-400' : 'text-obsidian-700'"
      >★</span>
    </span>
    <span v-if="count > 0" class="text-xs text-muted font-mono">
      {{ rating.toFixed(1) }} ({{ count }})
    </span>
    <span v-else class="text-xs text-muted">No reviews</span>
  </span>
</template>
