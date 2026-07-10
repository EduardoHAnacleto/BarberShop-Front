<script setup lang="ts">
// Admin command palette. Opens on Ctrl/Cmd+K, fuzzy-filters a list of
// navigation targets, and navigates on Enter/click. Keyboard-first, closes on
// Escape or after navigating.
interface Command {
  label: string
  to: string
  hint?: string
}

const COMMANDS: Command[] = [
  { label: 'Dashboard', to: '/admin', hint: 'overview' },
  { label: 'Appointments', to: '/admin/appointments', hint: 'bookings' },
  { label: 'Workers', to: '/admin/workers', hint: 'staff' },
  { label: 'Customers', to: '/admin/customers', hint: 'clients' },
  { label: 'Services', to: '/admin/services', hint: 'catalogue' },
  { label: 'Reviews', to: '/admin/reviews', hint: 'ratings' },
  { label: 'Schedule', to: '/admin/schedule', hint: 'business hours' },
  { label: 'Users', to: '/admin/users', hint: 'accounts' },
]

const open = ref(false)
const query = ref('')
const activeIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)

// Case-insensitive substring match on label + hint.
const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return COMMANDS
  return COMMANDS.filter(
    (c) => c.label.toLowerCase().includes(q) || (c.hint ?? '').includes(q),
  )
})

// Reset highlight whenever the result set changes.
watch(results, () => { activeIndex.value = 0 })

async function openPalette(): Promise<void> {
  open.value = true
  query.value = ''
  activeIndex.value = 0
  await nextTick()
  inputEl.value?.focus()
}

function close(): void {
  open.value = false
}

function move(delta: number): void {
  if (results.value.length === 0) return
  activeIndex.value =
    (activeIndex.value + delta + results.value.length) % results.value.length
}

async function selectActive(): Promise<void> {
  const cmd = results.value[activeIndex.value]
  if (!cmd) return
  close()
  await navigateTo(cmd.to)
}

// Ctrl/Cmd+K toggles the palette. useMagicKeys is auto-imported by VueUse.
const keys = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.key === 'k' && (e.ctrlKey || e.metaKey) && e.type === 'keydown') {
      e.preventDefault()
    }
  },
})
const ctrlK = keys['Ctrl+K']
const cmdK = keys['Meta+K']

watch([ctrlK, cmdK], ([a, b]) => {
  if (a || b) {
    if (open.value) close()
    else openPalette()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="modal-backdrop items-start pt-[15vh]"
        @click.self="close"
      >
        <div class="modal-panel max-w-lg w-full p-0 overflow-hidden" role="dialog" aria-label="Command palette">
          <!-- Search input. -->
          <input
            ref="inputEl"
            v-model="query"
            type="text"
            placeholder="Jump to…"
            autocomplete="off"
            class="w-full bg-transparent px-4 py-3 text-primary outline-none border-b border-subtle"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="selectActive"
            @keydown.esc="close"
          >

          <!-- Results. -->
          <ul class="max-h-72 overflow-auto py-1">
            <li v-if="results.length === 0" class="px-4 py-3 text-muted text-sm">
              No matches.
            </li>
            <li
              v-for="(cmd, i) in results"
              :key="cmd.to"
              class="px-4 py-2 flex items-center justify-between cursor-pointer text-sm"
              :class="i === activeIndex ? 'bg-gold-500/10 text-gold-300' : 'text-secondary'"
              @mouseenter="activeIndex = i"
              @click="selectActive"
            >
              <span>{{ cmd.label }}</span>
              <span v-if="cmd.hint" class="text-xs text-muted">{{ cmd.hint }}</span>
            </li>
          </ul>

          <!-- Footer hint. -->
          <div class="px-4 py-2 border-t border-subtle text-[11px] text-muted font-mono">
            ↑↓ navigate · ↵ open · esc close
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
