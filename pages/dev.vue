<script setup lang="ts">
// Sandbox page: displays every design-system class so the DoD visual check
// can be done in a browser. Only reachable in development — the route is
// intentionally never linked from any production page.
definePageMeta({ layout: 'default' })

// Sample data used to render badge and table examples below.
const badgeVariants = ['gold', 'green', 'blue', 'yellow', 'red', 'gray'] as const
const skeletonRows = [1, 2, 3]
</script>

<template>
  <!-- Full sandbox; section order matches the spec in S1.2 of the sprint plan. -->
  <div class="min-h-screen bg-[var(--bg)] p-10 space-y-14">
    <!-- Page title -->
    <header>
      <h1 class="font-display text-3xl text-gradient-gold mb-1">Design System Sandbox</h1>
      <p class="text-secondary text-sm font-mono">S1.2 DoD visual check — development only</p>
    </header>

    <!-- ── Typography ──────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <p class="section-label">Typography</p>
      <p class="font-display text-2xl text-primary">Playfair Display — display</p>
      <p class="font-body text-base text-primary">DM Sans — body</p>
      <p class="font-mono text-sm text-primary">DM Mono — mono</p>
      <p class="text-secondary">Secondary text colour</p>
      <p class="text-muted">Muted text colour</p>
      <p class="text-gold font-semibold">Gold text</p>
      <p class="text-gradient-gold font-display text-xl font-bold">Gradient gold heading</p>
    </section>

    <!-- ── Buttons ─────────────────────────────────────────────────────────── -->
    <section class="space-y-4">
      <p class="section-label">Buttons</p>
      <div class="flex flex-wrap gap-3">
        <button class="btn-primary">Primary</button>
        <button class="btn-ghost">Ghost</button>
        <button class="btn-outline">Outline</button>
        <button class="btn-danger">Danger</button>
      </div>
      <div class="flex flex-wrap gap-3 items-center">
        <button class="btn-primary btn-sm">Small</button>
        <button class="btn-primary">Default</button>
        <button class="btn-primary btn-lg">Large</button>
        <button class="btn-icon btn-ghost">
          <!-- Placeholder icon glyph -->
          <span class="text-base">✕</span>
        </button>
      </div>
      <div class="flex gap-3">
        <button class="btn-primary" disabled>Disabled primary</button>
        <button class="btn-outline" disabled>Disabled outline</button>
      </div>
    </section>

    <!-- ── Form elements ───────────────────────────────────────────────────── -->
    <section class="space-y-4 max-w-sm">
      <p class="section-label">Form</p>
      <div class="form-group">
        <label class="label" for="sample-input">Email address</label>
        <input id="sample-input" class="input" type="email" placeholder="name@example.com" autocomplete="email">
      </div>
      <div class="form-group">
        <label class="label" for="sample-disabled">Disabled field</label>
        <input id="sample-disabled" class="input" type="text" placeholder="Read-only value" disabled>
      </div>
    </section>

    <!-- ── Surfaces ────────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <p class="section-label">Surfaces</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="surface rounded-lg p-4">
          <p class="text-xs text-muted font-mono mb-1">.surface</p>
          <p class="text-sm text-primary">#111111</p>
        </div>
        <div class="surface-raised rounded-lg p-4">
          <p class="text-xs text-muted font-mono mb-1">.surface-raised</p>
          <p class="text-sm text-primary">#181818</p>
        </div>
        <div class="surface-overlay rounded-lg p-4">
          <p class="text-xs text-muted font-mono mb-1">.surface-overlay</p>
          <p class="text-sm text-primary">#202020</p>
        </div>
      </div>
    </section>

    <!-- ── Cards ───────────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <p class="section-label">Cards</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <div class="card">
          <p class="font-display text-lg mb-1 text-primary">Static card</p>
          <p class="text-sm text-secondary">.card — no hover effect</p>
        </div>
        <div class="card-hover">
          <p class="font-display text-lg mb-1 text-primary">Hover card</p>
          <p class="text-sm text-secondary">.card-hover — gold border on hover</p>
        </div>
      </div>
    </section>

    <!-- ── Badges ──────────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <p class="section-label">Badges</p>
      <div class="flex flex-wrap gap-2">
        <span v-for="variant in badgeVariants" :key="variant" :class="`badge-${variant}`">
          {{ variant }}
        </span>
      </div>
    </section>

    <!-- ── Skeleton ────────────────────────────────────────────────────────── -->
    <section class="space-y-3 max-w-sm">
      <p class="section-label">Skeleton</p>
      <div class="space-y-2">
        <div v-for="n in skeletonRows" :key="n" class="skeleton h-10 rounded" />
      </div>
    </section>

    <!-- ── Divider ─────────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <p class="section-label">Divider</p>
      <div class="divider my-2" />
      <p class="text-sm text-muted">Content below the divider</p>
    </section>

    <!-- ── Table ───────────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <p class="section-label">Table</p>
      <div class="table-wrapper">
        <table class="table w-full">
          <thead>
            <tr>
              <th scope="col">Customer</th>
              <th scope="col">Service</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Doe</td>
              <td>Haircut</td>
              <td><span class="badge-blue">Scheduled</span></td>
            </tr>
            <tr>
              <td>Jane Smith</td>
              <td>Beard Trim</td>
              <td><span class="badge-yellow">On Going</span></td>
            </tr>
            <tr>
              <td>Carlos Lima</td>
              <td>Full Package</td>
              <td><span class="badge-green">Completed</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ── Animations ──────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <p class="section-label">Animations</p>
      <div class="flex flex-wrap gap-4">
        <div class="card animate-fade-in">
          <p class="text-sm font-mono text-muted">fade-in</p>
        </div>
        <div class="card animate-slide-up">
          <p class="text-sm font-mono text-muted">slide-up</p>
        </div>
        <div class="card animate-slide-in-right">
          <p class="text-sm font-mono text-muted">slide-in-right</p>
        </div>
        <div class="skeleton h-12 w-48 animate-shimmer">
          <p class="sr-only">shimmer</p>
        </div>
        <button class="btn-primary animate-pulse-gold">pulse-gold</button>
      </div>
    </section>

    <!-- ── Sidebar links ───────────────────────────────────────────────────── -->
    <section class="space-y-1 max-w-xs">
      <p class="section-label mb-2">Sidebar navigation</p>
      <a href="#" class="sidebar-link">
        <span class="text-base">📅</span> Appointments
      </a>
      <a href="#" class="sidebar-link active">
        <span class="text-base">👥</span> Workers (active)
      </a>
      <a href="#" class="sidebar-link">
        <span class="text-base">✂️</span> Services
      </a>
    </section>
  </div>
</template>
