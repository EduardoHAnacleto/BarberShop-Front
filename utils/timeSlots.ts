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
