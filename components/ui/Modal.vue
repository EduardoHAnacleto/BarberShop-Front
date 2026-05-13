<script setup lang="ts">
// Accessible modal dialog. Controlled via v-model; teleports to <body> to
// avoid z-index issues. Supports three widths, an optional title, and
// named footer slot.
const props = withDefaults(
  defineProps<{
    // Whether the modal is currently visible.
    modelValue: boolean
    // Optional heading shown in the modal header area.
    title?: string
    // Controls the maximum width of the panel.
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md', title: undefined },
)

const emit = defineEmits<{
  // Emitted when the modal should close (X button or click-outside).
  'update:modelValue': [value: boolean]
}>()

// Width class selected by the `size` prop.
const sizeClass = computed(() => {
  const map = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }
  return map[props.size]
})

// Closes the modal by emitting false on the v-model contract.
function close(): void {
  emit('update:modelValue', false)
}

// Close on Escape key while the modal is open.
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

// Attach the keydown listener when the modal mounts and remove it on unmount.
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <!-- Teleport prevents the modal from being clipped by a parent overflow:hidden. -->
  <Teleport to="body">
    <!-- Fade the backdrop in/out when modelValue toggles. -->
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal-backdrop"
        @click.self="close"
      >
        <!-- Panel width is controlled by the size prop. -->
        <div class="modal-panel p-6" :class="sizeClass">
          <!-- Header: only rendered when a title is provided. -->
          <div v-if="title" class="flex items-center justify-between mb-5">
            <h2 class="font-display text-lg text-primary">{{ title }}</h2>
            <!-- Close button in the header corner. -->
            <button class="btn-icon btn-ghost" aria-label="Close dialog" @click="close">
              <SidebarIcon icon="x" />
            </button>
          </div>

          <!-- Default slot receives the modal body content. -->
          <slot />

          <!-- Footer slot: only rendered when content is provided. -->
          <div v-if="$slots.footer" class="flex justify-end gap-3 mt-6">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Enter/leave transition for the modal backdrop and panel together. */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 200ms ease, opacity 200ms ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel {
  transform: scale(0.95) translateY(-10px);
  opacity: 0;
}
</style>
