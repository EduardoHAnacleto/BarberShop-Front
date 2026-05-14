// Unit tests for utils/timeSlots.ts — generateTimeSlots() and filterAvailableSlots().
import { describe, it, expect } from 'vitest'
import { generateTimeSlots, filterAvailableSlots } from '~/utils/timeSlots'
import type { OccupiedPeriod } from '~/utils/timeSlots'

describe('generateTimeSlots()', () => {
  it('generates slots from open to close at the given interval', () => {
    // 09:00 to 12:00 with no break, 30-min interval → 6 slots.
    const slots = generateTimeSlots('09:00', '12:00', null, null, 30)
    expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'])
  })

  it('excludes slots that fall within the break window', () => {
    // 09:00–18:00 with 12:00–13:00 break: 18 total − 2 break = 16 slots.
    const slots = generateTimeSlots('09:00', '18:00', '12:00', '13:00', 30)
    expect(slots).not.toContain('12:00')
    expect(slots).not.toContain('12:30')
    // Slot immediately after break is included.
    expect(slots).toContain('13:00')
    expect(slots.length).toBe(16)
  })

  it('does not include the closeTime itself', () => {
    // The last slot must be strictly before closeTime.
    const slots = generateTimeSlots('09:00', '10:00', null, null, 30)
    expect(slots).toEqual(['09:00', '09:30'])
    expect(slots).not.toContain('10:00')
  })

  it('returns an empty array when openTime equals closeTime', () => {
    expect(generateTimeSlots('09:00', '09:00', null, null, 30)).toEqual([])
  })

  it('works with 60-minute intervals', () => {
    const slots = generateTimeSlots('08:00', '12:00', null, null, 60)
    expect(slots).toEqual(['08:00', '09:00', '10:00', '11:00'])
  })

  it('treats null breakStart / breakEnd as "no break"', () => {
    // Passing null for one boundary should not exclude any slot.
    const withNull = generateTimeSlots('09:00', '11:00', null, '10:00', 30)
    const withoutBreak = generateTimeSlots('09:00', '11:00', null, null, 30)
    expect(withNull).toEqual(withoutBreak)
  })
})

describe('filterAvailableSlots()', () => {
  // Helper: 9:00–17:30 every 30 min = 17 slots (no break).
  const baseSlots = generateTimeSlots('09:00', '18:00', null, null, 30)

  it('returns all slots unchanged when there are no occupied periods', () => {
    expect(filterAvailableSlots(baseSlots, [], 30)).toEqual(baseSlots)
  })

  it('blocks the slot that exactly matches an existing appointment start', () => {
    // Appointment at 15:00 for 30 min → blocks 15:00 only (slot at 15:30 is free).
    const occupied: OccupiedPeriod[] = [{ startMinutes: 15 * 60, endMinutes: 15 * 60 + 30 }]
    const available = filterAvailableSlots(baseSlots, occupied, 30)
    expect(available).not.toContain('15:00')
    expect(available).toContain('15:30')
  })

  it('blocks slots that would still be running during an existing appointment', () => {
    // Existing appointment at 15:00 for 105 min (1h45m) → ends at 16:45.
    // Slots at 15:00, 15:30, 16:00, 16:30 all overlap; 17:00 is free.
    const occupied: OccupiedPeriod[] = [{ startMinutes: 15 * 60, endMinutes: 15 * 60 + 105 }]
    const available = filterAvailableSlots(baseSlots, occupied, 30)
    expect(available).not.toContain('15:00')
    expect(available).not.toContain('15:30')
    expect(available).not.toContain('16:00')
    expect(available).not.toContain('16:30')
    expect(available).toContain('17:00')
  })

  it('blocks a slot whose proposed duration would overlap an existing appointment', () => {
    // Existing appointment at 16:00 for 30 min.
    // Proposed service takes 90 min — booking at 15:00 (runs 15:00–16:30) overlaps.
    const occupied: OccupiedPeriod[] = [{ startMinutes: 16 * 60, endMinutes: 16 * 60 + 30 }]
    const available = filterAvailableSlots(baseSlots, occupied, 90)
    expect(available).not.toContain('15:00') // 15:00–16:30 overlaps 16:00–16:30
    expect(available).not.toContain('15:30') // 15:30–17:00 overlaps 16:00–16:30
    expect(available).toContain('14:30')     // 14:30–16:00 does not overlap
  })

  it('handles multiple occupied periods simultaneously', () => {
    // Two appointments: 10:00–10:30 and 14:00–15:00.
    const occupied: OccupiedPeriod[] = [
      { startMinutes: 10 * 60, endMinutes: 10 * 60 + 30 },
      { startMinutes: 14 * 60, endMinutes: 15 * 60 },
    ]
    const available = filterAvailableSlots(baseSlots, occupied, 30)
    expect(available).not.toContain('10:00')
    expect(available).not.toContain('14:00')
    expect(available).not.toContain('14:30')
    expect(available).toContain('10:30')
    expect(available).toContain('15:00')
  })
})
