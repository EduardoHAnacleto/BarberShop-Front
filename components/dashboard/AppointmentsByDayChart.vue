<script setup lang="ts">
// Stacked bar chart showing appointment counts per status across the last
// 7 days. Pure presentational component: takes raw appointments and renders.
import { Bar } from 'vue-chartjs'
import dayjs from 'dayjs'
import { AppointmentStatus } from '~/types'
import type { Appointment } from '~/types'
import { groupByDayAndStatus, lastNDays } from '~/utils/dashboardAggregations'

const props = defineProps<{ appointments: Appointment[] }>()

// Status → display config for the bar chart series.
const STATUS_SERIES: Array<{ status: AppointmentStatus; label: string; color: string }> = [
  { status: AppointmentStatus.Scheduled, label: 'Scheduled', color: '#60a5fa' },
  { status: AppointmentStatus.OnGoing, label: 'On Going', color: '#fbbf24' },
  { status: AppointmentStatus.Completed, label: 'Completed', color: '#34d399' },
  { status: AppointmentStatus.Cancelled, label: 'Cancelled', color: '#9ca3af' },
]

// Build the chart data once per prop change. Days are always the last 7
// regardless of whether they contain any appointments.
const chartData = computed(() => {
  const days = lastNDays(7)
  const grouped = groupByDayAndStatus(props.appointments)
  return {
    labels: days.map((d) => dayjs(d).format('ddd DD')),
    datasets: STATUS_SERIES.map((s) => ({
      label: s.label,
      backgroundColor: s.color,
      borderRadius: 4,
      data: days.map((d) => grouped[d]?.[s.status] ?? 0),
    })),
  }
})

// Chart.js options: stacked, dark theme, transparent background.
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: 'rgba(255,255,255,0.7)' },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: 'rgba(255,255,255,0.7)', precision: 0 },
    },
  },
  plugins: {
    legend: { labels: { color: 'rgba(255,255,255,0.9)' } },
    tooltip: { mode: 'index' as const, intersect: false },
  },
}
</script>

<template>
  <div class="card">
    <h3 class="font-display text-lg text-primary mb-3">Appointments — last 7 days</h3>
    <div class="h-64">
      <ClientOnly>
        <Bar :data="chartData" :options="chartOptions" />
      </ClientOnly>
    </div>
  </div>
</template>
