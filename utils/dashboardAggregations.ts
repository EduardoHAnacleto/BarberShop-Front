// Pure functions used by the admin dashboard to roll up appointment data.
// Kept isolated so they can be unit-tested without mounting any Vue tree.
// See sprint plan S4.2 for the full spec.
import dayjs from 'dayjs'
import { AppointmentStatus } from '~/types'
import type { Appointment } from '~/types'

// One slot per status — Deleted is intentionally excluded from chart series.
export type StatusCounts = Record<AppointmentStatus, number>

// Returns a fresh counts object with every status initialised to zero.
function emptyCounts(): StatusCounts {
  return {
    [AppointmentStatus.Scheduled]: 0,
    [AppointmentStatus.OnGoing]: 0,
    [AppointmentStatus.Completed]: 0,
    [AppointmentStatus.Cancelled]: 0,
    [AppointmentStatus.Deleted]: 0,
  }
}

// Groups appointments by ISO date (YYYY-MM-DD) and counts each status per day.
// Caller decides which days to render in what order — the function only
// produces a map. Missing days simply do not appear as keys.
export function groupByDayAndStatus(
  appointments: Appointment[],
): Record<string, StatusCounts> {
  const result: Record<string, StatusCounts> = {}
  for (const a of appointments) {
    const day = dayjs(a.scheduledFor).format('YYYY-MM-DD')
    if (!result[day]) result[day] = emptyCounts()
    result[day][a.status] = (result[day][a.status] ?? 0) + 1
  }
  return result
}

// Counts appointments per service name. Services with zero appointments are
// not represented in the result.
export function groupByService(appointments: Appointment[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const a of appointments) {
    result[a.serviceName] = (result[a.serviceName] ?? 0) + 1
  }
  return result
}

// Returns the last N days as YYYY-MM-DD strings, oldest first.
// Used by the chart to enforce a stable x-axis even when some days have
// no appointments at all.
export function lastNDays(n: number, from: Date = new Date()): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    days.push(dayjs(from).subtract(i, 'day').format('YYYY-MM-DD'))
  }
  return days
}
