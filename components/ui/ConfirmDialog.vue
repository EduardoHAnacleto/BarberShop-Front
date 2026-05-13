<script setup lang="ts">
// Reusable confirmation dialog built on top of UiModal. Renders a message
// with Cancel and Confirm buttons. Use `dangerous` for destructive actions
// to render the confirm button in the danger style.
defineProps<{
  // Controls dialog visibility via v-model.
  modelValue: boolean
  // Heading shown at the top of the dialog.
  title: string
  // Body text explaining what will happen if confirmed.
  message: string
  // Label for the confirm button.
  confirmLabel?: string
  // Label for the cancel button.
  cancelLabel?: string
  // When true, renders the confirm button as btn-danger instead of btn-primary.
  dangerous?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  // Emitted when the user clicks the confirm button.
  confirm: []
}>()

// Closes the dialog without confirming.
function cancel(): void {
  emit('update:modelValue', false)
}

// Emits the confirm event and closes the dialog.
function confirm(): void {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

<template>
  <!-- Delegates rendering to UiModal with a fixed small size. -->
  <UiModal
    :model-value="modelValue"
    :title="title"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Confirmation message body. -->
    <p class="text-sm text-secondary">{{ message }}</p>

    <!-- Action buttons in the footer slot. -->
    <template #footer>
      <button class="btn-ghost btn-sm" @click="cancel">
        {{ cancelLabel ?? 'Cancel' }}
      </button>
      <button
        :class="dangerous ? 'btn-danger btn-sm' : 'btn-primary btn-sm'"
        @click="confirm"
      >
        {{ confirmLabel ?? 'Confirm' }}
      </button>
    </template>
  </UiModal>
</template>
