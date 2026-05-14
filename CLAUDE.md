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

**Sprint 3 — Admin CRUD: customers, services, users, schedule**
- [x] **S3.1 Stores: users + schedule** — `stores/users.ts` (CRUD + extra `unlock(userId)` → `POST /api/auth/unlock/{id}`), `stores/schedule.ts` (schedules + closures + `checkIsOpen(dateTime)` with `false` safe-default on API error). Added `/users` to Vite dev proxy (backend route is `/users` without `/api` prefix). Commit: `feat(s3.1)`.
- [x] **S3.2 Pages /admin/customers + /admin/services** — Customers page: name + email search, modal with name/email/phone/DOB, name-required validation, DOB formatted as `MMM DD, YYYY`. Services page: name + description search, modal with name (min 3 chars) + description textarea + duration (>0) + price (>0), description truncated to 60 chars in the table. Commit: `feat(s3.2)`.
- [x] **S3.3 Page /admin/users** — Email search + role filter dropdown. Table columns: Email / Role badge (Admin=gold, User=blue, Client=gray) / Status (Active=green, Inactive=red) / Created / Lockout indicator / Actions. **Unlock button** (shield icon, emerald) only renders when `lockoutEnd > now`. Modal hides Password field on edit; backend AutoMapper hashes plain password into BCrypt server-side. Commit: `feat(s3.3)`.
- [x] **S3.4 Page /admin/schedule** — Two sections in one page. Section 1: weekly hours table sorted by `dayOfWeek` (Sun→Sat), one row per day with per-row Save button and `opacity-50 pointer-events-none` on time inputs when `isOpen=false`. Times converted between HTML `HH:mm` ↔ TimeSpan `HH:mm:00`. Section 2: closures list with Add modal (radio for UntilNextOpening/UntilSpecificDate, datetime-local inputs, required reason). Commit: `feat(s3.4)`.
- [x] **S3.5 Sprint 3 Tests** — Unit: `stores/users.store.spec.ts` (5), `stores/schedule.store.spec.ts` (8 — including `checkIsOpen` returning false on error), `stores/customers.store.spec.ts` (4), `stores/services.store.spec.ts` (3). E2E: `customers.spec.ts` (3), `services.spec.ts` (4 — including the min-3-chars validation block), `users.spec.ts` (3 — admin role badge), `schedule.spec.ts` (3 — toggle Monday persists across reload). DoD verified: `npm run test:unit` **68/68**, lint 0, vue-tsc 0, build OK. Commit: `feat(s3.5)`. Note: backend `UserRequestDTO.PasswordHash` accepts plain text; the AutoMapper config hashes it on the server before persistence.

**Sprint 3 — COMPLETE**

**Sprint 4 — SignalR realtime + Admin Dashboard**
- [x] **S4.1 SignalR realtime polish** — `composables/useSignalR.ts`: extracted `subscribeWithReconnect(hub, event, cb)` helper and rewrote every typed shortcut (`onAppointmentsChanged`, `onWorkersChanged`, etc.) to subscribe to **both** the `XChanged` event AND the synthetic `reconnected` event. Result: every store that calls `signalr.onXChanged(fetchAll)` auto-refreshes on reconnect for free. The live/reconnecting indicator was already wired in `layouts/admin.vue` from S1.5. Commit: `feat(s4.1)`.
- [x] **S4.2 Dashboard /admin** — `pages/admin/index.vue` (replaces the old placeholder): shop Open/Closed badge, 5 KPI cards (Today/Scheduled/OnGoing/Workers/Customers) with skeleton loading, two charts and two tables. Charts: `components/dashboard/AppointmentsByDayChart.vue` (stacked Bar across last 7 days by status) and `components/dashboard/ServiceDistributionChart.vue` (Doughnut grouped by service). Aggregation helpers extracted into `utils/dashboardAggregations.ts` (`groupByDayAndStatus`, `groupByService`, `lastNDays`) so charts stay presentational. `plugins/chartjs.client.ts` registers the Chart.js controllers/scales/plugins client-side. Charts wrapped in `<ClientOnly>` to avoid SSR rendering issues. Commit: `feat(s4.2)`. Note: backend ASP.NET `JsonSerializer` errors on empty-string `DateTime` fields — workers/customers pages now strip empty `dateOfBirth` from the POST body.
- [x] **S4.4 Sprint 4 tests** — Unit: `tests/unit/utils/dashboardAggregations.spec.ts` (8 tests covering grouping + day-range), `tests/unit/stores/subscribeRealtime.spec.ts` (3 tests verifying the change+reconnect subscription model and that the composite unsubscribe tears down both). Integration: `tests/integration/adminLayout.integration.spec.ts` (mount calls `connect()` 5 times, unmount calls `disconnectAll()`). DoD verified: `npm run test:unit` **81/81**, lint 0, vue-tsc 0. Commit: `feat(s4.4)`. Gotcha: with `restoreMocks: true` in vitest.config, hoisted `vi.fn().mockResolvedValue(...)` loses its implementation between tests; reapply in `beforeEach`. dayjs default formatter is local-TZ, so day-string tests must use local-time ISO inputs (no trailing `Z`) to stay stable across runners.

**Sprint 4 — COMPLETE**

**Sprint 5 — Client Portal**
- [x] **S5.1 Landing Page `/`** — `pages/index.vue` (replaces placeholder): hero section with gold gradient + radial background, `components/schedule/IsOpenBanner.vue` (polls `api.schedule.isOpen()` every 5 min, shows Open/Closed badge + time), services grid (fetch on mount, cards with name/description/duration/price, "Book this service" → `/book?serviceId={id}`), team grid (workers with initial avatar, position, up to 3 service tags), footer. `components/layout/PublicNavbar.vue` (sticky, backdrop-blur, logo, anchor links for #services and #team, Admin button when `isLoggedIn`). Commit: `feat(s5)`.
- [x] **S5.2 Booking Flow `/book`** — `pages/book/index.vue` (3-step stepper, reads `?serviceId` to pre-select). `components/BookingStepper.vue` (horizontal progress bar: check for completed, gold for active, gray for future). Step sub-components: `components/booking/StepService.vue` (selectable service cards), `components/booking/StepWorkerTime.vue` (worker cards → date picker → schedule fetch → time slot grid or closed-day message), `components/booking/StepConfirm.vue` (booking summary + customer form, email validation). Submit flow: POST `/api/customers` → POST `/api/appointments` → navigate to `/book/success?appointmentId={id}`. `pages/book/success.vue` (checkmark, "Booking Confirmed!", appointment reference, two CTAs). `utils/timeSlots.ts` — `generateTimeSlots(openTime, closeTime, breakStart, breakEnd, interval)` + `filterAvailableSlots(slots, occupied, proposedDuration)` pure functions. **Conflict rule:** when a date is selected, the page fetches all active (Scheduled/OnGoing) appointments for the selected worker via `api.appointments.byWorker()` in parallel with the schedule fetch. Each appointment occupies [start, start+serviceDuration). A candidate slot [T, T+proposedDuration) is hidden if it overlaps any occupied period — this prevents double-booking and respects service durations (e.g. a 1h45min service at 15:00 blocks 15:30, 16:00, 16:30; next open slot is 17:00). Customer conflict (same customer double-booked with a different worker) is validated by the backend at POST time.
- [x] **S5.3 Sprint 5 Tests** — Unit: `tests/unit/utils/timeSlots.spec.ts` (6 tests for slot generation, break exclusion, edge cases), `tests/unit/components/IsOpenBanner.spec.ts` (4 tests: open state, closed state, skeleton while loading, interval cleanup on unmount), `tests/unit/components/BookingStepper.spec.ts` (4 tests: bubble count, checkmark for completed, gold for active, gray for future). E2E: `tests/e2e/booking.spec.ts` (full flow, serviceId pre-selection, closed-day message, email validation). DoD verified: `npm run test:unit` **95/95**, lint 0, vue-tsc 0, build OK. Commit: `feat(s5)`.

- [x] **S5.5 Client Registration & Portal** — `pages/register.vue` (public; creates customer record → user account with UserRole.Client=0 → auto-login → `/my`). `pages/my.vue` (requires `middleware: 'auth'`; resolves customerId via `GET /users/{uid}`, loads profile + appointments; profile edit via PUT `/api/customers/{id}`; split view: left = upcoming/OnGoing sorted ASC with Cancel button for Scheduled-only, right = past sorted DESC; cancel via POST `/api/appointments/cancel`). `components/client/AppointmentCard.vue` (reusable card with status badge + cancel button). `pages/login.vue` updated: non-admin post-login redirect changed from `/` to `/my`; "Create account" link added. `components/layout/PublicNavbar.vue` updated: "My Account" link for all logged-in users, "Admin" link only for admins.
- [x] **S5.6 Worker Portal & Date Filters** — `pages/worker.vue` (resolves `workerId` via `GET /users/{uid}`; 4 computed categories — Upcoming/Ongoing/Completed/Cancelled — each filtered by `isInDateRange` and sorted by `byProximityToNow`; 2-column layout; count badges). `components/shared/DateRangeFilter.vue` (v-model tab bar: All/Today/This week/This month/This year). `utils/appointmentFilters.ts` (`DateFilter` type, `isInDateRange` pure function, `byProximityToNow` pure comparator). `pages/my.vue` updated to apply `SharedDateRangeFilter` and `isInDateRange` to both appointment columns. `components/layout/PublicNavbar.vue` updated: "My Schedule" link visible when user has a linked worker profile (resolved via `api.users.byId` in `watchEffect`). Tests: `tests/unit/utils/appointmentFilters.spec.ts` (14 tests covering all filter modes, edge cases, sort direction). DoD verified: **114/114**, lint 0, vue-tsc 0. Commit: `feat(s5)`.

- [x] **S5.7 Staff Login & Guest Nav CTAs** — `pages/staff-login.vue` (role selector: Worker card | Admin card → login form → redirect to `/worker` or `/admin` based on JWT role). `components/layout/PublicNavbar.vue` updated: guest users (not logged in) now see "Register", "Sign In", and "Staff Login" in the nav; logged-in users see the previous links (My Account / My Schedule / Admin). `pages/login.vue` updated: title changed to "Client Sign In", added "Staff Login" cross-link. Commit: `feat`.

**Sprint 5 — COMPLETE**

Sprints 6–8 not started.

## Stack (locked by the plan — do not substitute)

Nuxt 3.17 · TypeScript (`strict: true`) · Tailwind CSS · Pinia · `@microsoft/signalr` 8 · Vitest · Playwright · MSW · `@vite-pwa/nuxt` · Chart.js + vue-chartjs · Axios · dayjs · jwt-decode.

Exact versions for every dependency are pinned in section S1.1 of the sprint plan — install those, not "latest."

## Commands (to exist once Sprint 1 lands)

Scripts defined in S8.2 of the plan; once `package.json` exists these are the canonical entry points:

```bash
npm run dev              # nuxt dev  →  http://localhost:3001  (port 3000 = Grafana)
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

**Seed-hash gotcha:** the SQL seed in `C:\GitHub\BarberShop\database\schema.sql` claims the admin password is `Admin@123` but ships the well-known Spring-example hash (`$2a$11$92IXUNpkjO...`) which decodes to something else. After fresh `docker compose up`, regenerate the hash for `Admin@123` (e.g. `node -e "console.log(require('bcryptjs').hashSync('Admin@123', 11))"`) and run `UPDATE Users SET UserPasswordHash = '<new>', UserLockoutEnd = NULL, UserFailedLoginAttempts = 0 WHERE UserEmail = 'admin@barbershop.com'` inside the `barbershop-sqlserver` container. After 5 failed attempts the account locks for 15 min — same `UPDATE` clears it.

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
