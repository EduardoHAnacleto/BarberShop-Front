// Calendar helpers for the booking success page: build a downloadable .ics
// file and a Google Calendar "add event" URL. Pure functions so they are
// unit-testable and have no DOM/browser dependency.

export interface CalendarEvent {
  title: string
  description: string
  location: string
  /** Local wall-clock start, ISO without timezone (e.g. "2026-07-15T14:00:00"). */
  start: string
  durationMinutes: number
}

// Formats a Date as a UTC basic-format timestamp: YYYYMMDDTHHMMSSZ.
function toUtcBasic(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

// Escapes the characters RFC 5545 requires escaping in TEXT values.
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

// Returns [startUtc, endUtc] as basic-format strings for the event window.
function windowUtc(event: CalendarEvent): [string, string] {
  const start = new Date(event.start)
  const end = new Date(start.getTime() + event.durationMinutes * 60_000)
  return [toUtcBasic(start), toUtcBasic(end)]
}

// Builds a minimal, valid VCALENDAR document for a single event.
export function buildIcs(event: CalendarEvent): string {
  const [startUtc, endUtc] = windowUtc(event)
  const stamp = toUtcBasic(new Date())
  const uid = `${stamp}-${Math.random().toString(36).slice(2)}@barbershop`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BarberShop//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

// Builds a Google Calendar "add event" URL from the same event data.
export function googleCalendarUrl(event: CalendarEvent): string {
  const [startUtc, endUtc] = windowUtc(event)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    location: event.location,
    dates: `${startUtc}/${endUtc}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
