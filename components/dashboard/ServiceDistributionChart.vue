<script setup lang="ts">
// Doughnut chart showing the distribution of appointments across services.
import { Doughnut } from 'vue-chartjs'
import type { Appointment } from '~/types'
import { groupByService } from '~/utils/dashboardAggregations'

const props = defineProps<{ appointments: Appointment[] }>()

// Gold + accent palette used across the design system; cycled per service.
const PALETTE = [
  '#f5c14b',
  '#d4a017',
  '#8b6914',
  '#60a5fa',
  '#34d399',
  '#fbbf24',
  '#a78bfa',
  '#f87171',
]

const grouped = computed(() => groupByService(props.appointments))

const chartData = computed(() => {
  const entries = Object.entries(grouped.value)
  return {
    labels: entries.map(([name]) => name),
    datasets: [
      {
        data: entries.map(([, count]) => count),
        backgroundColor: entries.map((_, i) => PALETTE[i % PALETTE.length]),
        borderColor: 'rgba(0,0,0,0)',
        borderWidth: 0,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: 'rgba(255,255,255,0.9)', boxWidth: 12 },
    },
    tooltip: {
      callbacks: {
        label: (ctx: { label: string; raw: unknown }) => `${ctx.label}: ${ctx.raw}`,
      },
    },
  },
}

const isEmpty = computed(() => Object.keys(grouped.value).length === 0)
</script>

<template>
  <div class="card">
    <h3 class="font-display text-lg text-primary mb-3">Services distribution</h3>
    <div v-if="isEmpty" class="h-64 flex items-center justify-center text-muted">
      No appointments yet
    </div>
    <div v-else class="h-64">
      <ClientOnly>
        <Doughnut :data="chartData" :options="chartOptions" />
      </ClientOnly>
    </div>
  </div>
</template>
