<script setup lang="ts">
// Horizontal tab bar for narrowing appointment lists by calendar period.
// Binds with v-model; emits 'update:modelValue' when a tab is clicked.
import type { DateFilter } from '~/utils/appointmentFilters'

defineProps<{ modelValue: DateFilter }>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: DateFilter): void
}>()

// The five filter options shown in the bar.
const OPTIONS: { label: string; value: DateFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'day' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'This year', value: 'year' },
]
</script>

<template>
  <!-- Wrapping flex row; buttons wrap on small screens. -->
  <div class="flex flex-wrap gap-2" role="group" aria-label="Filter appointments by period">
    <button
      v-for="opt in OPTIONS"
      :key="opt.value"
      type="button"
      class="px-3 py-1.5 rounded text-sm font-mono border transition-all"
      :class="
        modelValue === opt.value
          ? 'border-gold-500 bg-gold-500/10 text-gold-400'
          : 'border-border text-muted hover:border-gold-500/40 hover:text-secondary'
      "
      :aria-pressed="modelValue === opt.value"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
