// Unit tests for utils/timeSlots.ts — generateTimeSlots().
import { describe, it, expect } from 'vitest'
import { generateTimeSlots } from '~/utils/timeSlots'

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
