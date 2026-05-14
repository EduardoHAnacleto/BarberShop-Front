<script setup lang="ts">
// Horizontal progress stepper for the booking flow.
// Completed steps show a checkmark, the active step is highlighted gold,
// and future steps are rendered in a muted gray.
defineProps<{
  // 1-based index of the currently active step.
  currentStep: number
  // Labels shown beneath each step indicator.
  steps: string[]
}>()
</script>

<template>
  <!-- Full-width row; connector lines flex-grow between the step bubbles. -->
  <div class="flex items-start w-full">
    <template v-for="(step, idx) in steps" :key="idx">
      <!-- Horizontal connector line between consecutive steps. -->
      <div
        v-if="idx > 0"
        class="flex-1 h-px mt-4 mx-1 transition-colors"
        :class="idx < currentStep ? 'bg-gold-500' : 'bg-border'"
      />

      <!-- Step indicator: bubble + label. -->
      <div class="flex flex-col items-center gap-1.5 shrink-0">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-sm
                 font-mono font-semibold transition-all duration-200"
          :class="{
            'bg-emerald-500/20 border border-emerald-500 text-emerald-400': idx + 1 < currentStep,
            'bg-gold-500/20 border-2 border-gold-500 text-gold-400 shadow-gold': idx + 1 === currentStep,
            'bg-surface-raised border border-border text-muted': idx + 1 > currentStep,
          }"
        >
          <!-- Checkmark SVG for already-completed steps. -->
          <svg
            v-if="idx + 1 < currentStep"
            class="w-4 h-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414
                 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span v-else>{{ idx + 1 }}</span>
        </div>

        <!-- Step label below the bubble. -->
        <span
          class="text-xs whitespace-nowrap transition-colors"
          :class="idx + 1 === currentStep ? 'text-gold-400' : 'text-muted'"
        >
          {{ step }}
        </span>
      </div>
    </template>
  </div>
</template>
