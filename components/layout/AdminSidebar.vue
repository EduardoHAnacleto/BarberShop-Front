<script setup lang="ts">
// Collapsible admin navigation sidebar. Renders the main nav links with active
// state detection and a footer with user info, collapse toggle, and logout.
const route = useRoute()
const { userEmail, logout } = useAuth()

// Whether the sidebar is in its narrow (icon-only) state.
const collapsed = ref(false)

// Navigation items as defined by the sprint plan S1.5.
const nav = [
  { label: 'Dashboard', to: '/admin', icon: 'grid' },
  { label: 'Appointments', to: '/admin/appointments', icon: 'calendar' },
  { label: 'Workers', to: '/admin/workers', icon: 'users' },
  { label: 'Customers', to: '/admin/customers', icon: 'user' },
  { label: 'Services', to: '/admin/services', icon: 'scissors' },
  { label: 'Schedule', to: '/admin/schedule', icon: 'clock' },
  { label: 'Users', to: '/admin/users', icon: 'shield' },
]

// Returns true when the given route path matches the current location.
// Dashboard requires an exact match; all other links use startsWith.
function isActive(to: string): boolean {
  if (to === '/admin') return route.path === '/admin'
  return route.path.startsWith(to)
}

</script>

<template>
  <!-- Sidebar container. Width transitions between expanded (w-60) and
       collapsed (w-16) to show icon-only navigation. -->
  <aside
    class="relative flex flex-col h-screen bg-surface border-r transition-all duration-300 flex-shrink-0"
    :class="collapsed ? 'w-16' : 'w-60'"
  >
    <!-- Logo area: "B" monogram + "BarberShop" label (hidden when collapsed). -->
    <div class="flex items-center gap-3 px-3 py-4 border-b border-subtle">
      <div
        class="w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-500/30 flex items-center
               justify-center flex-shrink-0"
      >
        <span class="font-display font-bold text-gold-400 text-sm">B</span>
      </div>
      <Transition name="fade-text">
        <div v-if="!collapsed" class="overflow-hidden">
          <p class="font-display font-semibold text-primary text-sm leading-tight">BarberShop</p>
          <p class="text-muted text-xs font-mono">Admin</p>
        </div>
      </Transition>
    </div>

    <!-- Navigation links. -->
    <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
      <NuxtLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="sidebar-link"
        :class="{ active: isActive(item.to) }"
        :aria-label="collapsed ? item.label : undefined"
      >
        <!-- Icon is always visible. -->
        <SidebarIcon :icon="item.icon" class="flex-shrink-0" />

        <!-- Label is hidden in collapsed mode. -->
        <Transition name="fade-text">
          <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
        </Transition>
      </NuxtLink>
    </nav>

    <!-- Footer: email, collapse button, logout button. -->
    <div class="border-t border-subtle px-2 py-3 space-y-1">
      <!-- User email (hidden when collapsed to save space). -->
      <Transition name="fade-text">
        <p v-if="!collapsed" class="px-3 py-1 text-xs text-muted truncate font-mono">
          {{ userEmail }}
        </p>
      </Transition>

      <!-- Toggle collapse. -->
      <button
        class="sidebar-link w-full"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="collapsed = !collapsed"
      >
        <SidebarIcon :icon="collapsed ? 'chevron-right' : 'chevron-left'" class="flex-shrink-0" />
        <Transition name="fade-text">
          <span v-if="!collapsed" class="truncate">Collapse</span>
        </Transition>
      </button>

      <!-- Logout. -->
      <button class="sidebar-link w-full" aria-label="Sign out" @click="logout">
        <SidebarIcon icon="logout" class="flex-shrink-0" />
        <Transition name="fade-text">
          <span v-if="!collapsed" class="truncate">Sign out</span>
        </Transition>
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* Fade the text labels in/out when the sidebar collapses. */
.fade-text-enter-active,
.fade-text-leave-active {
  transition: opacity 150ms ease, width 150ms ease;
}

.fade-text-enter-from,
.fade-text-leave-to {
  opacity: 0;
  width: 0;
}
</style>
