// Minimal RFC 4180 CSV serializer for client-side "Export" buttons in the
// admin tables. Pure and dependency-free so it is unit-testable and can run in
// the browser without a library.

export interface CsvColumn<T> {
  header: string
  value: (row: T) => unknown
}

// Quotes a field when it contains a comma, double-quote or newline, doubling
// any embedded double-quotes. null/undefined become empty fields.
function escapeField(value: unknown): string {
  if (value === null || value === undefined) return ''

  const str = String(value)
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Serializes rows to a CSV string (CRLF line endings, header row first).
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeField(c.header)).join(',')
  const body = rows.map((row) =>
    columns.map((c) => escapeField(c.value(row))).join(','),
  )
  return [header, ...body].join('\r\n')
}

// Triggers a browser download of the given CSV string as a .csv file.
// Guarded so it is a no-op in non-browser (SSR/test) contexts.
export function downloadCsv(filename: string, csv: string): void {
  if (typeof document === 'undefined') return

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
