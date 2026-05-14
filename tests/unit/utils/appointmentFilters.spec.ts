import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { isInDateRange, byProximityToNow } from '~/utils/appointmentFilters'

// Pin "now" to a known Wednesday: 2025-06-11T10:00:00 local time.
// Using a non-Z ISO string so new Date() treats it as local time (same as production code).
const FIXED_NOW = new Date('2025-06-11T10:00:00')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

// ── isInDateRange ─────────────────────────────────────────────────────────────

describe('isInDateRange', () => {
  it('returns true for any date when filter is "all"', () => {
    expect(isInDateRange('1990-01-01T00:00:00', 'all')).toBe(true)
    expect(isInDateRange('2099-12-31T23:59:59', 'all')).toBe(true)
  })

  describe('day filter', () => {
    it('returns true for a date on the same calendar day', () => {
      expect(isInDateRange('2025-06-11T08:30:00', 'day')).toBe(true)
    })

    it('returns false for a date on a different day', () => {
      expect(isInDateRange('2025-06-10T23:59:59', 'day')).toBe(false)
      expect(isInDateRange('2025-06-12T00:00:00', 'day')).toBe(false)
    })
  })

  describe('week filter (week starts Sunday)', () => {
    // FIXED_NOW is Wednesday 2025-06-11; the week is Sun 2025-06-08 → Sat 2025-06-14.
    it('returns true for a date in the current week', () => {
      expect(isInDateRange('2025-06-08T00:00:00', 'week')).toBe(true) // Sunday
      expect(isInDateRange('2025-06-11T10:00:00', 'week')).toBe(true) // Wednesday (today)
      expect(isInDateRange('2025-06-14T23:59:59', 'week')).toBe(true) // Saturday end
    })

    it('returns false for a date outside the current week', () => {
      expect(isInDateRange('2025-06-07T23:59:59', 'week')).toBe(false) // last Saturday
      expect(isInDateRange('2025-06-15T00:00:00', 'week')).toBe(false) // next Sunday
    })
  })

  describe('month filter', () => {
    it('returns true for a date in the same calendar month', () => {
      expect(isInDateRange('2025-06-01T00:00:00', 'month')).toBe(true)
      expect(isInDateRange('2025-06-30T23:59:59', 'month')).toBe(true)
    })

    it('returns false for a date in a different month or year', () => {
      expect(isInDateRange('2025-05-31T23:59:59', 'month')).toBe(false)
      expect(isInDateRange('2025-07-01T00:00:00', 'month')).toBe(false)
      expect(isInDateRange('2024-06-11T10:00:00', 'month')).toBe(false)
    })
  })

  describe('year filter', () => {
    it('returns true for a date in the same calendar year', () => {
      expect(isInDateRange('2025-01-01T00:00:00', 'year')).toBe(true)
      expect(isInDateRange('2025-12-31T23:59:59', 'year')).toBe(true)
    })

    it('returns false for a date in a different year', () => {
      expect(isInDateRange('2024-12-31T23:59:59', 'year')).toBe(false)
      expect(isInDateRange('2026-01-01T00:00:00', 'year')).toBe(false)
    })
  })
})

// ── byProximityToNow ──────────────────────────────────────────────────────────

describe('byProximityToNow', () => {
  const earlier = { scheduledFor: '2025-06-11T09:00:00' }
  const later = { scheduledFor: '2025-06-11T11:00:00' }

  it('asc: earlier date sorts before later date (nearest-future first)', () => {
    expect(byProximityToNow(earlier, later, 'asc')).toBeLessThan(0)
    expect(byProximityToNow(later, earlier, 'asc')).toBeGreaterThan(0)
  })

  it('desc: later date sorts before earlier date (most-recent-past first)', () => {
    expect(byProximityToNow(later, earlier, 'desc')).toBeLessThan(0)
    expect(byProximityToNow(earlier, later, 'desc')).toBeGreaterThan(0)
  })

  it('returns 0 for equal dates in both directions', () => {
    const same = { scheduledFor: '2025-06-11T10:00:00' }
    // Use == so that -0 and +0 both pass (byProximityToNow may return -0 for desc).
    expect(byProximityToNow(same, same, 'asc') === 0).toBe(true)
    expect(byProximityToNow(same, same, 'desc') === 0).toBe(true)
  })

  it('asc: sorts an array of dates nearest-first', () => {
    const appointments = [
      { scheduledFor: '2025-06-11T14:00:00' },
      { scheduledFor: '2025-06-11T10:30:00' },
      { scheduledFor: '2025-06-11T12:00:00' },
    ]
    const sorted = [...appointments].sort((a, b) => byProximityToNow(a, b, 'asc'))
    expect(sorted.map((a) => a.scheduledFor)).toEqual([
      '2025-06-11T10:30:00',
      '2025-06-11T12:00:00',
      '2025-06-11T14:00:00',
    ])
  })

  it('desc: sorts an array of dates most-recent-first', () => {
    const appointments = [
      { scheduledFor: '2025-06-11T08:00:00' },
      { scheduledFor: '2025-06-11T09:30:00' },
      { scheduledFor: '2025-06-11T07:00:00' },
    ]
    const sorted = [...appointments].sort((a, b) => byProximityToNow(a, b, 'desc'))
    expect(sorted.map((a) => a.scheduledFor)).toEqual([
      '2025-06-11T09:30:00',
      '2025-06-11T08:00:00',
      '2025-06-11T07:00:00',
    ])
  })
})
