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
      google: (idToken: string) => post<AuthResponse>('/api/auth/google', { idToken }),
      unlock: (userId: number) => post<string>(`/api/auth/unlock/${userId}`),
    },

    // Appointment CRUD and query endpoints.
    appointments: {
      all: () => get<Appointment[]>('/api/appointments/all'),
      byId: (id: number) => get<Appointment>(`/api/appointments/${id}`),
      create: (body: AppointmentRequest) => post<Appointment>('/api/appointments', body),
      update: (id: number, body: AppointmentRequest) =>
        put<Appointment>(`/api/appointments/${id}`, body),
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
    },

    // Customer CRUD endpoints.
    customers: {
      all: () => get<Customer[]>('/api/customers/all'),
      byId: (id: number) => get<Customer>(`/api/customers/${id}`),
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
  }

  return { api }
}
