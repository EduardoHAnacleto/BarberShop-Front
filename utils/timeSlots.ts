// A booked period expressed in minutes-since-midnight (exclusive end).
// Used by filterAvailableSlots to describe existing appointment intervals.
export interface OccupiedPeriod {
  startMinutes: number
  endMinutes: number
}

// Minimum notice, in minutes, required before a same-day slot can be booked.
// Prevents a client from reserving a slot that starts almost immediately
// (e.g. booking the 16:00 slot at 15:59:30).
export const MIN_LEAD_TIME_MINUTES = 10

// Removes slots that have already started relative to the supplied "now",
// plus any slot starting within MIN_LEAD_TIME_MINUTES of "now".
// Only applies when the booking date matches today's date in local time —
// future dates are returned unchanged. Used so the client cannot book a slot
// in the past (e.g. selecting 09:00 when local time is 15:30) or with
// insufficient notice.
export function filterPastSlots(
  slots: string[],
  selectedDateIso: string,
  now: Date = new Date(),
): string[] {
  // Build today's local-time ISO date (YYYY-MM-DD) for the comparison.
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const todayIso = `${y}-${m}-${d}`

  // For any date other than today, every generated slot is still bookable.
  if (selectedDateIso !== todayIso) return slots

  // Current time expressed in minutes-since-midnight for direct slot comparison.
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const cutoffMinutes = nowMinutes + MIN_LEAD_TIME_MINUTES

  return slots.filter((slot) => {
    const [h, mi] = slot.split(':').map(Number)
    const slotMinutes = (h ?? 0) * 60 + (mi ?? 0)
    // Strict ">" so a slot starting exactly at the cutoff is still considered too soon.
    return slotMinutes > cutoffMinutes
  })
}

// Removes slots that would conflict with any occupied period.
// A proposed slot at time T with duration D is blocked when the interval
// [T, T+D) overlaps with any occupied period [P.start, P.end).
// Two half-open intervals [a,b) and [c,d) overlap iff a < d AND c < b.
export function filterAvailableSlots(
  slots: string[],
  occupied: OccupiedPeriod[],
  proposedDurationMinutes: number,
): string[] {
  if (occupied.length === 0) return slots

  // Converts "HH:mm" to minutes since midnight.
  function toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number)
    return (h ?? 0) * 60 + (m ?? 0)
  }

  return slots.filter((slot) => {
    const slotStart = toMinutes(slot)
    const slotEnd = slotStart + proposedDurationMinutes
    // Keep the slot only if it doesn't overlap with any occupied period.
    return !occupied.some((p) => slotStart < p.endMinutes && p.startMinutes < slotEnd)
  })
}

// Generates appointment time slots at a fixed interval between two boundary times,
// excluding any break period. All time parameters are "HH:mm" strings (24-hour).
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  breakStart: string | null,
  breakEnd: string | null,
  intervalMinutes: number = 30,
): string[] {
  // Converts "HH:mm" to minutes since midnight for arithmetic comparisons.
  function toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number)
    return (h ?? 0) * 60 + (m ?? 0)
  }

  // Converts minutes since midnight back to a zero-padded "HH:mm" string.
  function fromMinutes(total: number): string {
    const h = Math.floor(total / 60).toString().padStart(2, '0')
    const m = (total % 60).toString().padStart(2, '0')
    return `${h}:${m}`
  }

  const open = toMinutes(openTime)
  const close = toMinutes(closeTime)
  // Null-safe break window: only applied when both boundaries are provided.
  const breakS = breakStart ? toMinutes(breakStart) : null
  const breakE = breakEnd ? toMinutes(breakEnd) : null

  const slots: string[] = []

  for (let t = open; t < close; t += intervalMinutes) {
    // Skip any slot whose start time falls within the break window.
    if (breakS !== null && breakE !== null && t >= breakS && t < breakE) {
      continue
    }
    slots.push(fromMinutes(t))
  }

  return slots
}
