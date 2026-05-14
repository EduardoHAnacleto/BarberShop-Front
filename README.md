# BarberShop — Frontend

Nuxt 3 frontend for the BarberShop management system. Provides a public booking portal and a full admin dashboard with real-time SignalR updates.

## Requirements

- Node.js 22+
- The BarberShop API running at `http://localhost:8080` (see [`C:\GitHub\BarberShop`](../BarberShop))

## Development

```bash
# Install dependencies
npm install

# Start dev server at http://localhost:3001
npm run dev
```

Copy `.env.example` to `.env.local` and adjust values for your environment before running.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NUXT_PUBLIC_API_BASE` | Yes | Base URL of the BarberShop API (e.g. `http://localhost:8080`) |
| `NUXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Google OAuth Client ID for "Sign in with Google" |
| `SENTRY_DSN` | No | Sentry DSN for error monitoring — leave blank to disable |

## Testing

```bash
# Unit tests (Vitest)
npm run test:unit

# Unit tests in watch mode
npm run test:unit:watch

# E2E tests (Playwright) — requires the API running at http://localhost:8080
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Run all tests
npm run test:all
```

Running a single test file:
```bash
npx vitest run tests/unit/utils/timeSlots.spec.ts
npx playwright test tests/e2e/auth.spec.ts
```

E2E precondition: seed user `admin@barbershop.com / Admin@123` must exist. See the API README for the seed-hash note.

## Build and Preview

```bash
npm run build
npm run preview
```

## Linting and Type Check

```bash
npm run lint
npx vue-tsc --noEmit
```

## Docker — Full Stack

### Production

Starts frontend + API + SQL Server + Redis + Nginx on port 80.

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your values (SA_PASSWORD, JWT_KEY, API_IMAGE, etc.)

docker compose up -d
```

The app is then reachable at `http://localhost`.

### Staging

Starts the same stack without Nginx, with the frontend on port 3001.

```bash
cp .env.example .env.staging
# Edit .env.staging

docker compose -f docker-compose.staging.yml --env-file .env.staging up -d
```

## Architecture

- **Public surface** (`layouts/default.vue`): landing page, booking flow (`/book`), login, registration.
- **Admin surface** (`layouts/admin.vue`, `/admin/*`): gated by `middleware/admin.ts`. All 5 SignalR hubs connected on mount.
- **Client portal** (`/my`): authenticated customer view of upcoming/past appointments.
- **Worker portal** (`/worker`): authenticated worker view with date-range filters.

Real-time updates: Pinia stores call `subscribeRealtime()` which wires `signalr.on<Module>Changed(() => fetchAll())` — the live indicator in the admin header reflects the connection state.
