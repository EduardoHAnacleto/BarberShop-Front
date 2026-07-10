// Axios HTTP client composable. Exposes a singleton instance with auth
// interceptors and a typed endpoint map for every resource in the API.
// Singleton is created once per runtime (one console.warn in dev confirms this).
// See sprint plan S1.4 for the full endpoint contract.
import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type {
  AuthResponse,
  LoginRequest,
  Appointment,
  AppointmentRequest,
  AppointmentStatus,
  Worker,
  Customer,
  Service,
  User,
  UserRequest,
  BusinessSchedule,
  WorkingHours,
  AvailabilityResponse,
  Review,
  ReviewRequest,
  WorkerRatingSummary,
  LoyaltyStatus,
  ReportsSummary,
  RecurringAppointmentRequest,
  RecurringAppointmentResult,
} from '~/types'

// Module-level singleton — guaranteed single instance per process.
let _axios: AxiosInstance | null = null

// Creates the Axios instance using runtime config and wires both interceptors.
// Called at most once; subsequent calls to useApi() reuse _axios.
function createAxiosInstance(baseURL: string): AxiosInstance {
  // Warn in dev so developers can confirm the singleton is not initialised twice.
  if (import.meta.dev) {
    console.warn('[useApi] Creating Axios singleton')
  }

  const instance = axios.create({
    baseURL,
    timeout: 15_000,
  })

  // Request interceptor: attach the JWT from the bs_token cookie when present.
  instance.interceptors.request.use((config) => {
    // Reading the cookie on every request so token refresh / logout works
    // without recreating the Axios instance.
    const token = useCookie('bs_token').value
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Response interceptor: handle 401 globally (token expired or revoked).
  instance.interceptors.response.use(
    // Pass successful responses through unchanged.
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear the stale token and redirect to login on any 401.
        useCookie('bs_token').value = null
        navigateTo('/login')
      }
      // Re-throw so calling code can handle non-auth errors itself.
      return Promise.reject(error)
    },
  )

  return instance
}

// Returns (or lazily creates) the Axios singleton and the typed api map.
export function useApi() {
  if (!_axios) {
    const config = useRuntimeConfig()
    _axios = createAxiosInstance(config.public.apiBase as string)
  }

  const ax = _axios

  // ── Generic typed HTTP helpers ──────────────────────────────────────────

  // Sends a GET request and returns the typed response body.
  async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await ax.get<T>(url, { params })
    return response.data
  }

  // Sends a POST request and returns the typed response body.
  async function post<T>(url: string, body?: unknown): Promise<T> {
    const response = await ax.post<T>(url, body)
    return response.data
  }

  // Sends a PUT request and returns the typed response body.
  async function put<T>(url: string, body?: unknown): Promise<T> {
    const response = await ax.put<T>(url, body)
    return response.data
  }

  // Sends a PATCH request and returns the typed response body.
  async function patch<T>(url: string, body?: unknown): Promise<T> {
    const response = await ax.patch<T>(url, body)
    return response.data
  }

  // Sends a DELETE request and returns the typed response body.
  async function del<T>(url: string): Promise<T> {
    const response = await ax.delete<T>(url)
    return response.data
  }

  // ── Endpoint maps ────────────────────────────────────────────────────────

  const api = {
    // Authentication endpoints.
    auth: {
      login: (body: LoginRequest) => post<AuthResponse>('/api/auth/login', body),
      // rememberMe controls how long the frontend persists the auth cookie;
      // the JWT itself stays valid until logout or a credential change.
      google: (idToken: string, rememberMe: boolean = false) =>
        post<AuthResponse>('/api/auth/google', { idToken, rememberMe }),
      register: (body: { name: string; email: string; password: string; phoneNumber: string; dateOfBirth: string | null }) =>
        post<AuthResponse>('/api/auth/register', body),
      unlock: (userId: number) => post<string>(`/api/auth/unlock/${userId}`),
      // Rotates the server-side SecurityStamp, revoking every JWT previously
      // issued for the calling user.
      logout: () => post<string>('/api/auth/logout'),
      // Self-service password change; on success the server revokes all
      // sessions so the user must sign in again with the new password.
      changePassword: (currentPassword: string, newPassword: string) =>
        post<string>('/api/auth/change-password', { currentPassword, newPassword }),
      // Always resolves with a generic message, whether or not the email is
      // registered — the API never reveals which emails have accounts.
      forgotPassword: (email: string) => post<string>('/api/auth/forgot-password', { email }),
      resetPassword: (token: string, newPassword: string) =>
        post<string>('/api/auth/reset-password', { token, newPassword }),
    },

    // Appointment CRUD and query endpoints.
    appointments: {
      all: () => get<Appointment[]>('/api/appointments/all'),
      byId: (id: number) => get<Appointment>(`/api/appointments/${id}`),
      create: (body: AppointmentRequest) => post<Appointment>('/api/appointments', body),
      // Books up to repeatWeeks occurrences 7 days apart in one request;
      // conflicting weeks are skipped rather than failing the whole series.
      createRecurring: (body: RecurringAppointmentRequest) =>
        post<RecurringAppointmentResult>('/api/appointments/recurring', body),
      update: (id: number, body: AppointmentRequest) =>
        put<Appointment>(`/api/appointments/${id}`, body),
      // Worker portal status transition (start / complete / no-show).
      changeStatus: (id: number, status: AppointmentStatus) =>
        patch<Appointment>(`/api/appointments/${id}/status`, { status }),
      delete: (id: number) => del<null>(`/api/appointments/${id}`),
      byRange: (start: string, end: string) =>
        get<Appointment[]>('/api/appointments/range', { dateStart: start, dateEnd: end }),
      byWorker: (workerId: number) =>
        get<Appointment[]>(`/api/appointments/worker/${workerId}`),
      byCustomer: (customerId: number) =>
        get<Appointment[]>(`/api/appointments/customer/${customerId}`),
      byService: (serviceId: number) =>
        get<Appointment[]>(`/api/appointments/service/${serviceId}`),
      byStatus: (status: AppointmentStatus) =>
        get<Appointment[]>(`/api/appointments/status/${status}`),
      // Shifts a batch of appointments by the given HH:MM:SS timespan.
      delay: (idList: number[], timeSpan: string) =>
        post<null>('/api/appointments/delay', { idList, timeSpan }),
      // Cancels a batch of appointments in one request.
      cancel: (idList: number[]) => post<null>('/api/appointments/cancel', { idList }),
    },

    // Worker CRUD and service-filter endpoints.
    workers: {
      all: () => get<Worker[]>('/api/workers/all'),
      byId: (id: number) => get<Worker>(`/api/workers/${id}`),
      create: (body: Partial<Worker>) => post<Worker>('/api/workers', body),
      update: (id: number, body: Partial<Worker>) => put<Worker>(`/api/workers/${id}`, body),
      delete: (id: number) => del<null>(`/api/workers/${id}`),
      servicesByWorker: (id: number) => get<Service[]>(`/api/workers/by-worker/${id}`),
      workersByService: (id: number) => get<Worker[]>(`/api/workers/by-service/${id}`),
      // Server-computed bookable "HH:mm" slots for a worker+date+service.
      // Replaces the old client-side slot math (which required downloading
      // every appointment of the worker).
      availability: (id: number, date: string, serviceId: number) =>
        get<AvailabilityResponse>(
          `/api/workers/${id}/availability?date=${date}&serviceId=${serviceId}`,
        ),
    },

    // Customer CRUD endpoints.
    customers: {
      all: () => get<Customer[]>('/api/customers/all'),
      byId: (id: number) => get<Customer>(`/api/customers/${id}`),
      // Own record / update — the only customer endpoints usable by a client
      // (the id-based ones are Admin-only).
      me: () => get<Customer>('/api/customers/me'),
      updateMe: (body: Partial<Customer>) => put<Customer>('/api/customers/me', body),
      // Completed-visit progress toward the next configurable reward.
      myLoyalty: () => get<LoyaltyStatus>('/api/customers/me/loyalty'),
      create: (body: Partial<Customer>) => post<Customer>('/api/customers', body),
      update: (id: number, body: Partial<Customer>) =>
        put<Customer>(`/api/customers/${id}`, body),
      delete: (id: number) => del<null>(`/api/customers/${id}`),
    },

    // Service CRUD endpoints.
    services: {
      all: () => get<Service[]>('/api/services/all'),
      byId: (id: number) => get<Service>(`/api/services/${id}`),
      create: (body: Partial<Service>) => post<Service>('/api/services', body),
      update: (id: number, body: Partial<Service>) => put<Service>(`/api/services/${id}`, body),
      delete: (id: number) => del<null>(`/api/services/${id}`),
    },

    // User account management endpoints (note: no /api prefix per the spec).
    users: {
      all: () => get<User[]>('/users/all'),
      // Own record of the authenticated user — the only /users endpoint that
      // does not require the Admin role. Used by /my and /worker to resolve
      // the linked customerId/workerId.
      me: () => get<User>('/users/me'),
      byId: (id: number) => get<User>(`/users/${id}`),
      create: (body: UserRequest) => post<User>('/users', body),
      update: (id: number, body: UserRequest) => put<User>(`/users/${id}`, body),
      delete: (id: number) => del<null>(`/users/${id}`),
    },

    // Business schedule and closure endpoints.
    schedule: {
      getSchedule: () => get<BusinessSchedule[]>('/api/working-hours/schedule'),
      getByDay: (day: number) => get<BusinessSchedule>(`/api/working-hours/schedule/${day}`),
      updateSchedule: (id: number, body: Partial<BusinessSchedule>) =>
        put<BusinessSchedule>(`/api/working-hours/schedule/${id}`, body),
      getClosures: () => get<WorkingHours[]>('/api/working-hours/closures'),
      addClosure: (body: Partial<WorkingHours>) =>
        post<WorkingHours>('/api/working-hours/closures', body),
      removeClosure: (id: number) => del<null>(`/api/working-hours/closures/${id}`),
      isOpen: (dateTime: string) =>
        get<{ isOpen: boolean }>('/api/working-hours/is-open', { dateTime }),
    },

    // Post-appointment review endpoints.
    reviews: {
      create: (body: ReviewRequest) => post<Review>('/api/reviews', body),
      byWorker: (workerId: number) => get<Review[]>(`/api/reviews/worker/${workerId}`),
      // Bulk average+count per worker — avoids one request per worker card
      // when rendering ratings in the booking flow.
      summary: () => get<WorkerRatingSummary[]>('/api/reviews/summary'),
      // The caller's own reviews — used to hide "Leave a review" once an
      // appointment already has one.
      mine: () => get<Review[]>('/api/reviews/mine'),
      all: () => get<Review[]>('/api/reviews/all'),
      delete: (id: number) => del<null>(`/api/reviews/${id}`),
    },

    // Admin analytics.
    reports: {
      summary: () => get<ReportsSummary>('/api/reports/summary'),
    },
  }

  return { api }
}
