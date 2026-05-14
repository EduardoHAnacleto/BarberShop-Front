<script setup lang="ts">
// Searchable combobox that replaces a plain <select>.
// Filters the options list as the user types; selects on click or mousedown.

const props = defineProps<{
  modelValue: number
  options: Array<{ id: number; label: string }>
  placeholder?: string
  inputId?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const query = ref('')
const open = ref(false)

// Currently selected option object (null when nothing is selected).
const selected = computed(() => props.options.find((o) => o.id === props.modelValue) ?? null)

// Filter options by the current query string.
const filtered = computed(() => {
  const q = query.value.toLowerCase()
  return q ? props.options.filter((o) => o.label.toLowerCase().includes(q)) : props.options
})

// The text shown in the input: query while open, selected label when closed.
const inputDisplay = computed(() => (open.value ? query.value : (selected.value?.label ?? '')))

function onFocus(): void {
  query.value = ''
  open.value = true
}

function onBlur(): void {
  open.value = false
  query.value = ''
}

function onInput(e: Event): void {
  query.value = (e.target as HTMLInputElement).value
}

// mousedown.prevent keeps the input focused so blur does not fire before selection.
function pick(id: number): void {
  emit('update:modelValue', id)
  open.value = false
  query.value = ''
}
</script>

<template>
  <div class="relative">
    <input
      :id="inputId"
      class="input"
      type="text"
      :value="inputDisplay"
      :placeholder="open ? 'Type to search…' : (placeholder ?? 'Select…')"
      autocomplete="off"
      @focus="onFocus"
      @blur="onBlur"
      @input="onInput"
    >
    <ul
      v-if="open"
      class="absolute z-50 w-full mt-1 surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
    >
      <li v-if="filtered.length === 0" class="px-3 py-2 text-sm text-muted">
        No results
      </li>
      <li
        v-for="o in filtered"
        :key="o.id"
        class="px-3 py-2 text-sm cursor-pointer transition-colors"
        :class="o.id === modelValue
          ? 'text-primary font-medium bg-gold-500/10'
          : 'text-secondary hover:bg-gold-500/10 hover:text-primary'"
        @mousedown.prevent="pick(o.id)"
      >
        {{ o.label }}
      </li>
    </ul>
  </div>
</template>
