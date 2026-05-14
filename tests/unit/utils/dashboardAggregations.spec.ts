// Unit tests for utils/dashboardAggregations.ts.
import { describe, it, expect } from 'vitest'
import { AppointmentStatus } from '~/types'
import type { Appointment } from '~/types'
import {
  groupByDayAndStatus,
  groupByService,
  lastNDays,
} from '~/utils/dashboardAggregations'

function make(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 1,
    workerId: 1,
    workerName: 'W',
    customerId: 1,
    customerName: 'C',
    serviceId: 1,
    serviceName: 'Haircut',
    scheduledFor: '2026-05-14T10:00:00Z',
    status: AppointmentStatus.Scheduled,
    extraDetails: '',
    createdAt: '2026-05-01T00:00:00Z',
    ...overrides,
  }
}

describe('groupByDayAndStatus()', () => {
  it('counts each status per day correctly', () => {
    // Use local-time ISO strings so dayjs's default local formatter agrees
    // with the day strings the assertion expects regardless of test runner TZ.
    const data = [
      make({ id: 1, scheduledFor: '2026-05-14T10:00:00', status: AppointmentStatus.Scheduled }),
      make({ id: 2, scheduledFor: '2026-05-14T15:00:00', status: AppointmentStatus.Completed }),
      make({ id: 3, scheduledFor: '2026-05-15T09:00:00', status: AppointmentStatus.OnGoing }),
    ]
    const result = groupByDayAndStatus(data)

    expect(result['2026-05-14']?.[AppointmentStatus.Scheduled]).toBe(1)
    expect(result['2026-05-14']?.[AppointmentStatus.Completed]).toBe(1)
    expect(result['2026-05-15']?.[AppointmentStatus.OnGoing]).toBe(1)
  })

  it('returns an empty object when given no appointments', () => {
    expect(groupByDayAndStatus([])).toEqual({})
  })

  it('omits days with no appointments — caller fills gaps', () => {
    const data = [make({ scheduledFor: '2026-05-14T10:00:00' })]
    const result = groupByDayAndStatus(data)
    expect(Object.keys(result)).toEqual(['2026-05-14'])
  })
})

describe('groupByService()', () => {
  it('counts appointments per service name', () => {
    const data = [
      make({ id: 1, serviceName: 'Haircut' }),
      make({ id: 2, serviceName: 'Haircut' }),
      make({ id: 3, serviceName: 'Beard Trim' }),
    ]
    expect(groupByService(data)).toEqual({ Haircut: 2, 'Beard Trim': 1 })
  })

  it('returns empty object when no appointments', () => {
    expect(groupByService([])).toEqual({})
  })
})

describe('lastNDays()', () => {
  it('returns N consecutive ISO dates ending on the given anchor', () => {
    // Anchor at local midday so dayjs's local-date formatting yields a
    // stable result regardless of which TZ the test runner sits in.
    const anchor = new Date(2026, 4, 14, 12) // 14 May 2026, 12:00 local
    const days = lastNDays(3, anchor)
    expect(days).toEqual(['2026-05-12', '2026-05-13', '2026-05-14'])
  })

  it('returns an array of length N', () => {
    expect(lastNDays(7).length).toBe(7)
  })
})
