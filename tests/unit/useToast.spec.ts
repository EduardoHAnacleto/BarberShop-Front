// Unit tests for useToast composable.
// Tests the singleton ref, all convenience methods, auto-remove timer,
// and insertion-order preservation.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToast } from '~/composables/useToast'

// Reset toast state before each test by removing all current toasts.
// The composable uses a module-level ref, so we must drain it manually.
beforeEach(() => {
  const { toasts, remove } = useToast()
  ;[...toasts.value].forEach((t) => remove(t.id))
})

describe('useToast', () => {
  it('success(msg) adds a toast with type="success"', () => {
    const { toasts, success } = useToast()
    success('All good')
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]!.type).toBe('success')
    expect(toasts.value[0]!.message).toBe('All good')
  })

  it('error(msg) adds a toast with type="error" and default duration 6000', () => {
    const { toasts, error } = useToast()
    error('Something failed')
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]!.type).toBe('error')
    // Error toasts use a longer default so users have time to read them.
    expect(toasts.value[0]!.duration).toBe(6_000)
  })

  it('warning() adds a toast with type="warning"', () => {
    const { toasts, warning } = useToast()
    warning('Watch out')
    expect(toasts.value[0]!.type).toBe('warning')
  })

  it('info() adds a toast with type="info"', () => {
    const { toasts, info } = useToast()
    info('FYI')
    expect(toasts.value[0]!.type).toBe('info')
  })

  it('add() auto-removes the toast after the given duration', () => {
    vi.useFakeTimers()
    const { toasts, add } = useToast()
    add({ type: 'success', message: 'temp', duration: 500 })
    expect(toasts.value).toHaveLength(1)

    // Advance time past the duration.
    vi.advanceTimersByTime(600)
    expect(toasts.value).toHaveLength(0)
    vi.useRealTimers()
  })

  it('remove(id) removes exactly the toast with that id', () => {
    const { toasts, success, remove } = useToast()
    success('First')
    success('Second')
    const idToRemove = toasts.value[0]!.id
    remove(idToRemove)
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]!.message).toBe('Second')
  })

  it('multiple toasts maintain insertion order', () => {
    const { toasts, success, error: toastError, info } = useToast()
    success('A')
    toastError('B')
    info('C')
    const messages = toasts.value.map((t) => t.message)
    expect(messages).toEqual(['A', 'B', 'C'])
  })
})
