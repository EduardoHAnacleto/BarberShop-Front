// Toast notification composable. Maintains a singleton array of active toasts
// and exposes helpers to add/remove them by type. The array is module-scoped
// so every call to useToast() shares the same list — no prop drilling needed.
// See sprint plan S1.4 for the full spec.
import type { Toast } from '~/types'

// Module-scoped reactive list — one instance for the entire app lifetime.
// Using a module-level ref (not useState) keeps this outside Nuxt's per-request
// context so it behaves as a true client-side singleton.
const toasts = ref<Toast[]>([])

export function useToast() {
  // Appends a new toast and schedules its auto-removal after `duration` ms.
  function add(toast: Omit<Toast, 'id'>): void {
    const id = crypto.randomUUID()
    toasts.value.push({ ...toast, id })

    // Remove the toast automatically after the configured duration.
    setTimeout(() => remove(id), toast.duration ?? 4_000)
  }

  // Removes the toast with the given ID from the list.
  function remove(id: string): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  // Convenience method for success notifications (green).
  function success(message: string, duration?: number): void {
    add({ type: 'success', message, duration })
  }

  // Convenience method for error notifications (red). Default duration is
  // longer than the others so the user has time to read longer error messages.
  function error(message: string, duration?: number): void {
    add({ type: 'error', message, duration: duration ?? 6_000 })
  }

  // Convenience method for warning notifications (yellow).
  function warning(message: string, duration?: number): void {
    add({ type: 'warning', message, duration })
  }

  // Convenience method for informational notifications (blue).
  function info(message: string, duration?: number): void {
    add({ type: 'info', message, duration })
  }

  return {
    // Expose as readonly so components cannot mutate the list directly.
    toasts: readonly(toasts),
    add,
    remove,
    success,
    error,
    warning,
    info,
  }
}
