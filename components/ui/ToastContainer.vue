<script setup lang="ts">
// Toast container. Teleports to <body> and renders the global toast list from
// useToast(). Uses TransitionGroup for slide-in/out animations.
const { toasts, remove } = useToast()

// Background and border classes keyed by toast type.
const typeStyles: Record<string, string> = {
  success: 'bg-emerald-900/80 border border-emerald-700/50 text-emerald-100',
  error: 'bg-red-900/80 border border-red-700/50 text-red-100',
  warning: 'bg-yellow-900/80 border border-yellow-700/50 text-yellow-100',
  info: 'bg-blue-900/80 border border-blue-700/50 text-blue-100',
}

// Coloured dot class keyed by toast type.
const dotStyles: Record<string, string> = {
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  warning: 'bg-yellow-400',
  info: 'bg-blue-400',
}
</script>

<template>
  <!-- Teleport keeps toasts above every stacking context in the app. -->
  <Teleport to="body">
    <!-- Fixed position at the bottom-right; pointer-events only on the toasts. -->
    <div class="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast pointer-events-auto"
          :class="typeStyles[toast.type]"
        >
          <!-- Coloured status dot. -->
          <span class="w-2 h-2 rounded-full flex-shrink-0" :class="dotStyles[toast.type]" />

          <!-- Toast message text. -->
          <span class="flex-1 text-sm">{{ toast.message }}</span>

          <!-- Dismiss button. -->
          <button
            class="ml-2 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss notification"
            @click="remove(toast.id)"
          >
            <SidebarIcon icon="x" class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/* Toast slide in from the right and fade out to the right. */
.toast-enter-active,
.toast-leave-active {
  transition: transform 250ms ease, opacity 250ms ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Keep exiting toasts in the layout so the list reflows smoothly. */
.toast-leave-active {
  position: absolute;
}
</style>
