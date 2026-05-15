# BarberShop — Frontend

![CI](https://github.com/EduardoHAnacleto/BarberShop-Front/actions/workflows/frontend-ci.yml/badge.svg)
![Nuxt](https://img.shields.io/badge/Nuxt-3.17-00DC82?logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)
![PWA](https://img.shields.io/badge/PWA-enabled-5A0FC8)
[![Docker Hub](https://img.shields.io/docker/v/eduardohanacleto/barbershop-full?label=Docker%20Hub&logo=docker)](https://hub.docker.com/r/eduardohanacleto/barbershop-full)

Full-stack frontend for the [BarberShop API](https://github.com/EduardoHAnacleto/BarberShop), built with **Nuxt 3** and **TypeScript**. Delivers a public booking portal, a real-time admin dashboard, and a customer/worker self-service portal — all in a single Nuxt application with a dark-themed design system.

> **Backend repo:** [EduardoHAnacleto/BarberShop](https://github.com/EduardoHAnacleto/BarberShop) — ASP.NET Core 10 REST API + SignalR hubs.

---

## ✨ Features

### 🌐 Public Portal
- **Landing page** — hero section, live shop open/closed banner (polls every 5 min), services grid with price/duration, team grid with worker profiles
- **About page (`/about`)** — shop story, full-size Google Maps embed, address, phone (`tel:`) and email (`mailto:`) links; all contact data driven by `NUXT_PUBLIC_SHOP_*` env vars
- **3-step booking flow** — service selection → worker + time slot → customer details + confirmation; prevents double-booking by fetching occupied slots per worker in real time; logged-in clients have name/email/phone pre-filled automatically from their profile
- **Booking confirmation page** — shows appointment reference and a compact map card so clients know where to go
- **PWA** — installable, works offline after first visit; new-version banner prompts updates automatically

### 🔐 Authentication
- Email/password login with account lockout after 5 failed attempts
- **Google OAuth** via Google Identity Services
- JWT stored in a `secure; sameSite=lax` cookie; auto-refresh interception on 401
- Role-based routing: `Client (0)` → `/my`, `Worker (1)` → `/worker`, `Admin (3)` → `/admin`

### 👤 Client Portal (`/my`)
- View upcoming and past appointments with date-range filter (Today / This week / This month / This year)
- Cancel scheduled appointments
- Edit profile

### 🔧 Worker Portal (`/worker`)
- Daily schedule split into Upcoming / On Going / Completed / Cancelled
- Same date-range filter component, sorted by proximity to current time

### 🛠️ Admin Dashboard (`/admin/*`)
- **Real-time KPI cards** — Today's appointments, Scheduled, On Going, Workers, Customers; live via SignalR
- **Charts** — Appointments by day (stacked bar, last 7 days) + Service distribution (doughnut)
- **Full CRUD** for Appointments, Workers, Customers, Services, Users, Schedule
- **Batch operations** — delay or cancel multiple appointments at once
- **Searchable combobox** dropdowns for Customer, Worker and Service fields in appointment forms
- **Shop open/closed badge** based on live schedule API
- **User management** — role assignment, account unlock, lockout indicator
- **Schedule management** — weekly hours with per-day enable/disable; holiday/closure entries

---

## 🚀 Quick Start

### Docker (recommended)

> **Requires:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)
>
> The API image [`eduardohanacleto/barbershop-full:1.0.0`](https://hub.docker.com/r/eduardohanacleto/barbershop-full) is published on Docker Hub — no local API build needed.

```bash
# 1. Clone
git clone https://github.com/EduardoHAnacleto/BarberShop-Front.git
cd BarberShop-Front

# 2. Configure environment
cp .env.example .env
# Edit .env — set SA_PASSWORD and JWT_KEY
# API_IMAGE defaults to eduardohanacleto/barbershop-full:1.0.0 (no change needed)

# 3. Start everything (frontend + API + SQL Server + Redis + Nginx)
docker compose up -d

# App is live at http://localhost
```

### Access Points

| Surface         | URL                              |
|----------------|----------------------------------|
| Public portal   | http://localhost/                |
| Booking flow    | http://localhost/book            |
| Admin dashboard | http://localhost/admin           |
| API (Swagger)   | http://localhost:8080/swagger    |

### Admin Credentials
```
Email:    admin@barbershop.com
Password: Admin@123
```

---

## 💻 Local Development

```bash
npm install
npm run dev        # http://localhost:3001
```

Copy `.env.example` to `.env.local` and set `NUXT_PUBLIC_API_BASE=http://localhost:8080`.
The backend API must be running — see [BarberShop](https://github.com/EduardoHAnacleto/BarberShop).

---

## 🛠️ Tech Stack

| Layer            | Technology                                                     |
|-----------------|----------------------------------------------------------------|
| Framework        | Nuxt 3.17 · Vue 3 (Composition API)                          |
| Language         | TypeScript (`strict: true`)                                   |
| Styling          | Tailwind CSS — custom design system (gold/obsidian palette)   |
| State management | Pinia                                                         |
| Real-time        | @microsoft/signalr 8 — 5 hubs with auto-reconnect            |
| HTTP client      | Axios 1 — request/response interceptors for JWT + 401 handling|
| Auth             | JWT Bearer + Google OAuth (Google Identity Services)          |
| Charts           | Chart.js 4 + vue-chartjs — async-loaded to split bundle       |
| PWA              | @vite-pwa/nuxt — workbox runtime caching, auto-update prompt  |
| Date utilities   | dayjs                                                         |
| Unit tests       | Vitest 2 · @vue/test-utils · MSW 2 (API mocking)             |
| E2E tests        | Playwright 1 — 5 browsers (Chrome, Firefox, Safari, Pixel 5, iPhone 13) |
| A11y tests       | @axe-core/playwright — wcag2a/aa, wcag21a/aa                  |
| Performance      | Lighthouse CI — ≥ 90 Performance/SEO, ≥ 85 Accessibility     |
| Error monitoring | Sentry (`@sentry/nuxt`) — Vue integration + session replay    |
| CI/CD            | GitHub Actions — lint → unit → build → E2E → Lighthouse → deploy |
| Container        | Docker + Docker Compose + Nginx reverse proxy                 |

---

## 🏗️ Architecture

```
BarberShop-Front/
├── pages/
│   ├── index.vue              # Landing page (public)
│   ├── about.vue              # About page — story, map, contact (public)
│   ├── book/                  # 3-step booking flow + confirmation (public)
│   ├── my.vue                 # Client portal (auth: Client role)
│   ├── worker.vue             # Worker portal (auth: Worker role)
│   ├── login.vue / register.vue / staff-login.vue
│   └── admin/                 # Admin dashboard (auth: Admin role)
│       ├── index.vue          # KPIs + charts
│       ├── appointments.vue
│       ├── workers.vue
│       ├── customers.vue
│       ├── services.vue
│       ├── users.vue
│       └── schedule.vue
├── stores/                    # Pinia stores — one per API resource
├── composables/
│   ├── useApi.ts              # Axios singleton + typed endpoint map
│   ├── useAuth.ts             # JWT cookie, hydrate, role guards
│   ├── useSignalR.ts          # Hub manager, reconnect, typed events
│   └── useToast.ts            # Global toast queue
├── components/
│   ├── ui/                    # Design system primitives (Modal, Toast, Skeleton…)
│   ├── dashboard/             # Chart components (async-loaded)
│   ├── booking/               # 3-step booking sub-components
│   ├── shop/                  # ShopLocationCard — map + contact, used on /about and /book/success
│   └── layout/                # AdminSidebar, PublicNavbar
└── tests/
    ├── unit/                  # 114 unit + integration tests
    └── e2e/                   # Playwright (auth, booking, admin CRUD, a11y, responsive, smoke)
```

**Data flow per module:**
```
API (Axios) ←→ composables/useApi.ts ←→ stores/<module>.ts (Pinia) ←→ pages/admin/<module>.vue
                                               ▲
                                               │  subscribeRealtime()
                                               │
                                 composables/useSignalR.ts (hub fan-in)
```

Each Pinia store follows the same contract: `items / loading / error` state, mutating actions return `boolean` with `toast.success/error`, and `subscribeRealtime()` wires `signalr.on<Module>Changed(() => fetchAll())` — so every data mutation by any client immediately propagates to all open admin tabs.

---

## 🧪 Testing

```bash
npm run test:unit        # 114 unit + integration tests (Vitest)
npm run test:e2e         # Playwright E2E (requires API at :8080)
npm run test:e2e:ui      # Playwright with interactive UI
npm run test:all         # unit + E2E
```

| Suite              | Count | Tools                              |
|-------------------|-------|------------------------------------|
| Unit               | 114   | Vitest + @vue/test-utils + MSW     |
| E2E — functional   | ~50   | Playwright (Chromium)              |
| E2E — a11y         | 8     | @axe-core/playwright (wcag2aa)     |
| E2E — cross-browser| all   | Chrome · Firefox · Safari · Pixel 5 · iPhone 13 |
| E2E — responsive   | 12    | 375 / 768 / 1280 / 1920 px viewports |
| E2E — smoke        | 5     | Post-deploy health checks          |

---

## ⚙️ Environment Variables

| Variable                       | Required | Description                                           |
|-------------------------------|----------|-------------------------------------------------------|
| `NUXT_PUBLIC_API_BASE`         | Yes      | BarberShop API base URL (e.g. `http://localhost:8080`)|
| `NUXT_PUBLIC_GOOGLE_CLIENT_ID` | No       | Google OAuth Client ID for "Sign in with Google"     |
| `NUXT_PUBLIC_SHOP_ADDRESS`     | No       | Shop street address shown on `/about` and booking confirmation (default: Sky Tower Auckland placeholder) |
| `NUXT_PUBLIC_SHOP_PHONE`       | No       | Shop phone number — rendered as `tel:` link           |
| `NUXT_PUBLIC_SHOP_EMAIL`       | No       | Shop email — rendered as `mailto:` link               |
| `NUXT_PUBLIC_SHOP_LAT`         | No       | Latitude for the Google Maps embed                    |
| `NUXT_PUBLIC_SHOP_LNG`         | No       | Longitude for the Google Maps embed                   |
| `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No    | Maps Embed API key — without it a no-key URL is used  |
| `SENTRY_DSN`                   | No       | Sentry DSN — leave blank to disable error monitoring  |
| `SA_PASSWORD`                  | Docker   | SQL Server SA password                                |
| `JWT_KEY`                      | Docker   | JWT signing key (≥ 32 chars)                          |
| `API_IMAGE`                    | Docker   | Docker Hub image for the API service (default: `eduardohanacleto/barbershop-full:1.0.0`) |

---

## 🐳 Docker

### Production (Nginx on port 80)
```bash
cp .env.example .env
docker compose up -d
```

### Staging (frontend on port 3001, no Nginx)
```bash
cp .env.example .env.staging
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d
```

### Stop
```bash
docker compose down       # stop, keep volumes
docker compose down -v    # stop + delete data
```

---

## 📋 CI/CD Pipeline

Every push to `main` or PR runs:

```
lint + vue-tsc  ──►  unit tests  ──►  build
                 └──►  E2E tests  ──►  Lighthouse CI  ──►  deploy (main only)
```

The deploy job is a placeholder — wire it to your infrastructure (SSH, Kubernetes, etc.).
