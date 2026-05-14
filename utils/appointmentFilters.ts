// Shared filtering utilities for the client and worker appointment portals.
// All functions are pure so they can be tested without a Vue environment.

// The five date range options available in the UI filter bar.
export type DateFilter = 'all' | 'day' | 'week' | 'month' | 'year'

// Returns true when the given ISO date-time string falls within the selected
// calendar period relative to the current moment.
// 'all' is a no-op and always returns true.
export function isInDateRange(isoDate: string, filter: DateFilter): boolean {
  if (filter === 'all') return true

  const d = new Date(isoDate)
  const n = new Date()

  switch (filter) {
    case 'day':
      // Same calendar day in local time.
      return d.toDateString() === n.toDateString()

    case 'week': {
      // Week starts on Sunday; end is exclusive (start + 7 days).
      const start = new Date(n)
      start.setDate(n.getDate() - n.getDay())
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 7)
      return d >= start && d < end
    }

    case 'month':
      // Same calendar month and year.
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()

    case 'year':
      // Same calendar year.
      return d.getFullYear() === n.getFullYear()
  }
}

// Sorts appointments by proximity to the current moment.
// direction 'asc' puts the nearest-future first; 'desc' puts the most-recent-past first.
export function byProximityToNow(
  a: { scheduledFor: string },
  b: { scheduledFor: string },
  direction: 'asc' | 'desc',
): number {
  const diff =
    new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
  return direction === 'asc' ? diff : -diff
}
