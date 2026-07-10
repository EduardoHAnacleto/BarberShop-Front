// Unit tests for utils/csv.ts — RFC 4180 CSV serialization.
import { describe, it, expect } from 'vitest'
import { toCsv } from '~/utils/csv'

interface Row {
  id: number
  name: string
  email: string
}

const columns = [
  { header: 'ID', value: (r: Row) => r.id },
  { header: 'Name', value: (r: Row) => r.name },
  { header: 'Email', value: (r: Row) => r.email },
]

describe('toCsv()', () => {
  it('writes a header row followed by one row per record', () => {
    const csv = toCsv(
      [
        { id: 1, name: 'Emily', email: 'emily@example.com' },
        { id: 2, name: 'William', email: 'william@example.com' },
      ],
      columns,
    )
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('ID,Name,Email')
    expect(lines[1]).toBe('1,Emily,emily@example.com')
    expect(lines[2]).toBe('2,William,william@example.com')
  })

  it('quotes values containing commas, quotes or newlines and doubles quotes', () => {
    const csv = toCsv(
      [{ id: 1, name: 'Doe, John', email: 'a "quoted" name' }],
      columns,
    )
    const line = csv.split('\r\n')[1]
    expect(line).toBe('1,"Doe, John","a ""quoted"" name"')
  })

  it('renders null and undefined as empty fields', () => {
    const csv = toCsv(
      [{ id: 1, name: null as unknown as string, email: undefined as unknown as string }],
      columns,
    )
    expect(csv.split('\r\n')[1]).toBe('1,,')
  })

  it('returns just the header for an empty dataset', () => {
    expect(toCsv([], columns)).toBe('ID,Name,Email')
  })
})
