// Unit tests for utils/calendar.ts — .ics generation and Google Calendar URL.
import { describe, it, expect } from 'vitest'
import { buildIcs, googleCalendarUrl } from '~/utils/calendar'
import type { CalendarEvent } from '~/utils/calendar'

const event: CalendarEvent = {
  title: 'Haircut at BarberShop',
  description: 'with James Carter',
  location: '123 Maple Street',
  // Local wall-clock start; 30-minute service.
  start: '2026-07-15T14:00:00',
  durationMinutes: 30,
}

describe('buildIcs()', () => {
  it('produces a VCALENDAR/VEVENT wrapper', () => {
    const ics = buildIcs(event)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
    expect(ics).toContain('END:VCALENDAR')
  })

  it('encodes start and end as UTC basic-format timestamps', () => {
    const ics = buildIcs(event)
    // 14:00 + 30min = 14:30 on the same day.
    expect(ics).toMatch(/DTSTART:20260715T\d{6}Z/)
    expect(ics).toMatch(/DTEND:20260715T\d{6}Z/)
  })

  it('includes the summary, description and location', () => {
    const ics = buildIcs(event)
    expect(ics).toContain('SUMMARY:Haircut at BarberShop')
    expect(ics).toContain('DESCRIPTION:with James Carter')
    expect(ics).toContain('LOCATION:123 Maple Street')
  })

  it('escapes commas and semicolons per RFC 5545', () => {
    const ics = buildIcs({ ...event, location: 'Main St, Suite 3; Floor 2' })
    expect(ics).toContain('LOCATION:Main St\\, Suite 3\\; Floor 2')
  })
})

describe('googleCalendarUrl()', () => {
  it('points at the Google Calendar template render endpoint', () => {
    const url = googleCalendarUrl(event)
    expect(url.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE')).toBe(true)
  })

  it('encodes the title and a start/end date range', () => {
    const url = new URL(googleCalendarUrl(event))
    expect(url.searchParams.get('text')).toBe('Haircut at BarberShop')
    // dates=<start>/<end> in UTC basic format.
    const dates = url.searchParams.get('dates')
    expect(dates).toMatch(/^20260715T\d{6}Z\/20260715T\d{6}Z$/)
  })
})
