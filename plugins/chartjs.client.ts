// Registers the Chart.js controllers + scales + plugins we use in the
// dashboard. Loaded once on the client (the .client suffix tells Nuxt to
// skip this on the server). Without this, vue-chartjs throws "controller
// for type 'bar' is not registered" the first time a chart renders.
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

export default defineNuxtPlugin(() => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
  )
})
