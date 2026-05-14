# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository is the **frontend** for BarberShop. All work follows the sprint plan in strict order — each sprint is gated by the previous sprint's DoD being 100% green.

- **Authoritative plan:** `.claude/barbershop-frontend-sprints.md` — read this before starting any task. It defines every file to be created, every API contract, every DoD checkpoint, and every test that must pass per sprint.
- **Companion backend (already in production):** `C:\GitHub\BarberShop` — ASP.NET Core 10, running locally on `http://localhost:8080`. DTOs and enum values in `types/index.ts` MUST match this API exactly (numeric enums are not arbitrary: `AppointmentStatus 0-4`, `UserRole 0/1/3`, `ClosureType 0-1`).
- **GitHub remote:** `https://github.com/EduardoHAnacleto/BarberShop-Front` (HTTPS, already configured as `origin`). Nothing has been pushed yet — local-only.

## Progress

Update this section after closing each sprint sub-task so future sessions can pick up without re-deriving state. Source of truth is the git log; this is just a fast index.

**Sprint 1 — Foundation**
- [x] **S1.1 Repository and Tooling** — `package.json` (pinned deps), `nuxt.config.ts`, `tsconfig.json` (strict), `eslint.config.mjs`, `.prettierrc.json`, `.env.example`/`.env.local`, `app.vue`, full folder skeleton. DoD verified: lint 0, vue-tsc 0, build OK. Commit: `feat(s1.1)`. Note: `@nuxt/test-utils` had to be pinned to `~3.15.0` (newer 3.23+ requires vitest 3, plan locks vitest to 2.x). `assets/css/global.css` exists as a Tailwind-directives-only placeholder; S1.2 replaces it.
- [x] **S1.2 Design System** — `tailwind.config.ts` (gold/obsidian palettes, surface aliases, Playfair/DM Sans/DM Mono fonts, 5 animations + keyframes, 4 shadows). Full `assets/css/global.css` with `@layer base` (CSS vars, reset, scrollbar, selection), `@layer components` (all btn/input/card/badge/table/sidebar/modal/toast/transition classes), `@layer utilities` (semantic text/bg/border helpers). `pages/dev.vue` sandbox for visual DoD. DoD verified: lint 0, vue-tsc 0, build OK, no raw hex in Tailwind arbitrary syntax. Commit: `feat(s1.2)`. Note: fonts/animations require browser verification via `/dev` page.
- [x] **S1.3 TypeScript Types** — `types/index.ts` with all enums (AppointmentStatus 0-4, UserRole 0/1/3, ClosureType 0-1), domain interfaces (Customer, Service, Worker, Appointment+Request, User+Request, BusinessSchedule, WorkingHours), auth (LoginRequest, GoogleLoginRequest, AuthResponse) and UI (Toast, ApiError). Zero `any`. DoD verified: lint 0, vue-tsc 0. Commit: `feat(s1.3)`.
- [x] **S1.4 Infrastructure Composables** — `useApi` (Axios singleton, request interceptor adds JWT, response 401 clears cookie + navigateTo, typed helpers get/post/put/del, full api.* endpoint map for all 7 resources), `useAuth` (bs_token cookie, jwtDecode hydrate/expiry check, login/google/logout, useState global, isLoggedIn/isAdmin/userEmail/userId computeds), `useToast` (module-level ref singleton, success/error/warning/info with auto-remove), `useSignalR` (5 hubs, HubConnectionBuilder with accessTokenFactory + withAutomaticReconnect [0,2s,5s,10s,30s], typed event shortcuts, isConnected readonly ref). Gotcha: `void` in generic position (`del<void>`) blocked by `no-invalid-void-type`; replaced with `undefined`. Also need `nuxt prepare` after adding composables before `vue-tsc` can resolve auto-imports. DoD verified: lint 0, vue-tsc 0, build OK. Commit: `feat(s1.4)`.
- [x] **S1.5 Middleware, Layouts, Base Components** — `middleware/auth.ts` (redirect to /login with encoded redirect query), `middleware/admin.ts` (isLoggedIn + isAdmin guard). `layouts/default.vue` + `layouts/admin.vue` (5 SignalR hubs on mount/disconnectAll on unmount, sticky header with isConnected indicator + date). `components/layout/AdminSidebar.vue` (collapsible w-60/w-16, active route detection, logo, nav links, footer email/collapse/logout). `components/ui/Modal.vue` (Teleport, Transition, sizes sm/md/lg, Escape key handler). `components/ui/ConfirmDialog.vue`, `components/ui/Skeleton.vue`, `components/ui/ToastContainer.vue` (Teleport + TransitionGroup + colour variants). `components/SidebarIcon.vue` (20 inline SVGs). `pages/login.vue` (email/password + Google GSI + watchEffect redirect). `types/google.d.ts` (Window.google augmentation). Gotchas: `vue/no-multiple-template-root` requires single root — ToastContainer moved inside the main wrapper div (Teleport makes it render to body regardless); `dayjs` unused import in sidebar; `void` generic in modal prop default. DoD verified: lint 0, vue-tsc 0, build OK. Commit: `feat(s1.5)`.
- [x] **S1.6 Sprint 1 Tests** — `vitest.config.ts` + `playwright.config.ts`. Unit: `useToast.spec.ts` (7), `useApi.spec.ts` (6, MSW node adapter), `useAuth.spec.ts` (11, mockNuxtImport + vi.hoisted + Vue ref for useState), `middleware/auth.spec.ts` (2), `middleware/admin.spec.ts` (3). E2E: `tests/e2e/auth.spec.ts` (8 scenarios). Also added placeholder `pages/admin/index.vue` + `pages/admin/appointments.vue` (admin layout + middleware) so E2E redirect tests have valid routes to land on. Added `happy-dom` devDep (required by @nuxt/test-utils at runtime). Gotchas: `vi.hoisted()` required for `vi.fn()` used directly in `mockNuxtImport` factories (TDZ); `useState` mock must return Vue `ref()` not plain object for `computed()` reactivity to work; dynamic `delete` forbidden by lint — use `Reflect.deleteProperty`. DoD verified: `npm run test:unit` 29/29, lint 0, vue-tsc 0, build OK. Commit: `feat(s1.6)`. Note: E2E tests require the API at localhost:8080 with seed user admin@barbershop.com / Admin@123; the lockout test is destructive (5 wrong attempts), run last or in a resettable env.

**Sprint 1 — COMPLETE**

**Sprint 2 — Pinia Stores + Admin Pages (appointments & workers)**
- [x] **S2.1 Pinia Stores** — `stores/appointments.ts` (fetchAll, create, update, remove, delayMany, cancelMany, subscribeRealtime, computed: scheduled/todayItems/byStatus), `stores/workers.ts` (fetchAll, create, update, remove, subscribeRealtime). Also created `stores/customers.ts` and `stores/services.ts` early (needed by appointments modal selects). All stores follow the same shape: items/loading/error, boolean returns, toast messages from API verbatim. `delayMany` converts minutes to `HH:MM:00` timespan string. Commit: `feat(s2.1)`.
- [x] **S2.2 Page /admin/appointments** — Full appointments management page: filter bar (text + status + worker + date), table with `StatusBadge` component, batch select (allSelected computed + toggleAll/toggleRow), batch Delay + Cancel actions, single Create/Edit/Cancel modals. `components/appointments/StatusBadge.vue` with per-status classes. Commit: `feat(s2.2)`.
- [x] **S2.3 Page /admin/workers** — Workers page with coloured-initial avatar, service tags (max 3 + "+N" overflow badge), service multi-select checkboxes in modal, client-side validation (name ≥ 10 chars, wage > 0, email required). Commit: `feat(s2.3)`.
- [x] **S2.5 Sprint 2 Tests** — Unit: `stores/appointments.store.spec.ts` (11 tests), `stores/workers.store.spec.ts` (4 tests). Integration: `appointments.integration.spec.ts` (4 tests via MSW + component mount; mock `useSignalR` to prevent real hub connections). E2E: `appointments.spec.ts` (7 scenarios), `workers.spec.ts` (4 scenarios). Added integration glob to vitest include. Fixed bare `tsc` → `vue-tsc` in CLAUDE.md. 48/48 unit+integration pass, lint 0, vue-tsc 0. Commit: `feat(s2.5)`.

**Sprint 2 — COMPLETE**

Sprints 3–8 not started.

## Stack (locked by the plan — do not substitute)

Nuxt 3.17 · TypeScript (`strict: true`) · Tailwind CSS · Pinia · `@microsoft/signalr` 8 · Vitest · Playwright · MSW · `@vite-pwa/nuxt` · Chart.js + vue-chartjs · Axios · dayjs · jwt-decode.

Exact versions for every dependency are pinned in section S1.1 of the sprint plan — install those, not "latest."

## Commands (to exist once Sprint 1 lands)

Scripts defined in S8.2 of the plan; once `package.json` exists these are the canonical entry points:

```bash
npm run dev              # nuxt dev
npm run build            # nuxt build
npm run preview          # nuxt preview
npm run lint             # eslint .
npx vue-tsc --noEmit     # type-check (must use vue-tsc, not bare tsc — bare tsc cannot resolve .vue files)
npm run test:unit        # vitest run
npm run test:unit:watch  # vitest
npm run test:e2e         # playwright test
npm run test:e2e:ui      # playwright test --ui
npm run test:all         # unit + e2e
```

Running a single test:
- Unit: `npx vitest run path/to/file.spec.ts` or `npx vitest run -t "test name pattern"`
- E2E: `npx playwright test tests/e2e/auth.spec.ts` or `... --grep "login with success"`

E2E preconditions: the backend must be reachable at `http://localhost:8080` with seed user `admin@barbershop.com / Admin@123`. Bring up the API stack from `C:\GitHub\BarberShop` (its docker-compose) before running E2E.

## Architecture (the shape you must build toward)

**Two-surface app, single Nuxt project:**

1. **Public surface** (`layouts/default.vue`) — landing page (`/`), booking flow (`/book` → 3-step stepper → `/book/success`), login (`/login`). No auth required to view.
2. **Admin surface** (`layouts/admin.vue`, all under `/admin/*`) — gated by `middleware/admin.ts`. Mounts SignalR connections for **5 hubs in parallel on mount** and disconnects them on unmount. Hubs: `appointments`, `workers`, `customers`, `services`, `users`.

**Data flow per module** (appointments, workers, customers, services, users, schedule):

```
API (Axios)  ←→  composables/useApi.ts  ←→  stores/<module>.ts (Pinia)  ←→  pages/admin/<module>.vue
                                                  ▲
                                                  │  subscribeRealtime()
                                                  │
                                    composables/useSignalR.ts (hub fan-in)
```

Every store follows the same shape (S2.1 spells it out): `items` / `loading` / `error` state; `fetchAll` resets error + sets loading; mutating actions (`create` / `update` / `remove`) return `boolean` and call `toast.success` or `toast.error` (with the API's message verbatim, not a generic one). Each store exposes `subscribeRealtime()` that wires `signalr.on<Module>Changed(() => fetchAll())` and returns its own unsubscribe.

**Auth flow:** JWT in cookie `bs_token` (`maxAge: 86400, secure, sameSite: 'lax'`). `useApi`'s request interceptor injects `Authorization: Bearer {token}`; its response interceptor on 401 clears the cookie and routes to `/login`. `useAuth._hydrate(token)` decodes with `jwtDecode`, validates `exp`, and populates a `useState('auth')` global. `isAdmin` is `role === 'Admin'` (string from JWT, not the numeric enum).

**Design system:** `tailwind.config.ts` defines tokens; `assets/css/global.css` declares CSS variables + `@layer components` classes (`.btn-*`, `.card`, `.badge-*`, `.modal-panel`, etc.). **Never use arbitrary Tailwind values (`[...]`) where a token exists** — this is an explicit DoD check in S1.2.

## Hard rules (non-negotiable per the plan)

These come from the "Regras Globais" header and the per-sprint DoDs. Violations block sprint merge:

1. **All code in English** — variable names, class names, function names, comments, commit messages. The plan is written in Portuguese; the code is not.
2. **Every code block has a comment explaining what it does.** Yes, even small ones. This is project-specific and overrides the usual "comments only when non-obvious" default.
3. **No explicit `any`** anywhere in `.ts` / `.vue`. ESLint rule `@typescript-eslint/no-explicit-any: error` enforces it.
4. **No `console.log` in production code.** `console.warn` / `console.error` are allowed.
5. **No component over 300 lines** — split into sub-components.
6. **Every API call wrapped in try/catch** with `toast.error` on failure (and the toast text comes from the API response, not a hard-coded string).
7. **Every admin route has `middleware: 'admin'`** in `definePageMeta`.
8. **Every form input has a `<label>`** and an appropriate `autocomplete` attribute.
9. **Use the documentation for the exact pinned version** of each tool — Nuxt 3.17 patterns, not Nuxt 2 or Nuxt 4.
10. **A sprint cannot start until the previous sprint's DoD is 100% green in CI.** Build green, lint green, `tsc --noEmit` green, unit tests green, E2E green.
11. **Minimum 80% branch coverage** for `composables/` and `stores/` in unit tests.

## Working sprint-by-sprint

When picking up work, identify the active sprint, find the smallest unchecked `[ ]` task, do it, and check it off. Do not skip ahead — later sprints assume earlier files exist with specific shapes (e.g. Sprint 2 stores import from `composables/useApi.ts` defined in S1.4 with the exact endpoint map listed there).

The plan often spells out implementation at the level of "this exact prop, this exact class, this exact return value." Treat those as the spec, not as suggestions.
