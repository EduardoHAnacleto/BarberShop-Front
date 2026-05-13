# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository is the **frontend** for BarberShop. As of this writing, the codebase has not yet been bootstrapped — the only file checked in besides this one is the sprint plan. All work follows that plan in strict order.

- **Authoritative plan:** `.claude/barbershop-frontend-sprints.md` — read this before starting any task. It defines every file to be created, every API contract, every DoD checkpoint, and every test that must pass per sprint.
- **Companion backend (already in production):** `C:\GitHub\BarberShop` — ASP.NET Core 10, running locally on `http://localhost:8080`. DTOs and enum values in `types/index.ts` MUST match this API exactly (numeric enums are not arbitrary: `AppointmentStatus 0-4`, `UserRole 0/1/3`, `ClosureType 0-1`).
- **GitHub remote:** `https://github.com/EduardoHAnacleto/BarberShop-Front` (HTTPS, already configured as `origin`).

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
npx tsc --noEmit         # type-check
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
