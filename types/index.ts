// Central type definitions for the BarberShop frontend.
// Every interface mirrors the corresponding DTO in the ASP.NET Core 10 API.
// Numeric enum values MUST stay in sync with the backend — never renumber them.
// See sprint plan S1.3 for the full spec.

// ─── Enums ────────────────────────────────────────────────────────────────────

// Lifecycle states of an appointment as defined by the API.
export enum AppointmentStatus {
  Scheduled = 0,
  OnGoing = 1,
  Completed = 2,
  Cancelled = 3,
  Deleted = 4,
}

// Access-level roles attached to a user account.
// Note: 2 is intentionally absent — the backend skips that value.
export enum UserRole {
  Client = 0,
  User = 1,
  Admin = 3,
}

// How long a business closure lasts.
export enum ClosureType {
  UntilNextOpening = 0,
  UntilSpecificDate = 1,
}

// ─── Domain interfaces ────────────────────────────────────────────────────────

// A client who can book appointments. dateOfBirth is optional because the
// field may not be collected at registration time.
export interface Customer {
  id: number
  name: string
  dateOfBirth?: string
  email: string
  phoneNumber: string
}

// A service offered by the barbershop (e.g. Haircut, Beard Trim).
export interface Service {
  id: number
  name: string
  description: string
  /** Duration in minutes. */
  duration: number
  /** Price in the shop's currency unit. */
  price: number
}

// A staff member who performs services. servicesId is the list of service IDs
// the worker is qualified for; providedServices is the expanded view.
export interface Worker {
  id: number
  name: string
  email: string
  phoneNumber: string
  address: string
  position: string
  wagePerHour: number
  dateOfBirth: string
  servicesId: number[]
  providedServices: Service[]
}

// A scheduled appointment joining one worker, one customer, and one service.
export interface Appointment {
  id: number
  workerName: string
  workerId: number
  customerName: string
  customerId: number
  serviceName: string
  serviceId: number
  /** ISO 8601 date-time string. */
  scheduledFor: string
  status: AppointmentStatus
  /** Set when status transitions to Completed. */
  completedAt?: string
  extraDetails: string
  /** ISO 8601 date-time string when the record was created. */
  createdAt: string
}

// Payload sent to the API when creating or updating an appointment.
export interface AppointmentRequest {
  workerId: number
  customerId: number
  serviceId: number
  /** ISO 8601 date-time string. */
  scheduledFor: string
  status: AppointmentStatus
  extraDetails?: string
}

// A user account that can authenticate and optionally be linked to a customer
// or worker record via the optional foreign keys.
export interface User {
  id: number
  customerId?: number
  workerId?: number
  email: string
  userRole: UserRole
  isActive: boolean
  /** ISO 8601 date-time string. */
  createdAt: string
  /** ISO 8601 date-time string; present only when the account is locked out. */
  lockoutEnd?: string
}

// Payload for creating or updating a user account.
export interface UserRequest {
  customerId?: number
  workerId?: number
  email: string
  passwordHash: string
  userRole: UserRole
  isActive: boolean
}

// Opening hours for a single day of the week.
// All time fields are HH:mm strings (24-hour). Break fields are optional —
// not every day has a break period.
export interface BusinessSchedule {
  id: number
  /** 0 = Sunday … 6 = Saturday, matching JavaScript's Date.getDay(). */
  dayOfWeek: number
  isOpen: boolean
  openTime?: string
  closeTime?: string
  breakStart?: string
  breakEnd?: string
}

// A closure period during which the shop is shut regardless of the regular
// weekly schedule (e.g. public holidays, refurbishments).
export interface WorkingHours {
  id: number
  /** ISO 8601 date-time string for the start of the closure. */
  closedFrom: string
  /** Present only when closureType is UntilSpecificDate. */
  closedUntil?: string
  reason: string
  closureType: ClosureType
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

// Credentials sent to POST /api/auth/login.
// rememberMe asks the API to issue a long-lived (30-day) JWT.
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

// Payload sent to POST /api/auth/google when using the Google Identity
// Services flow. rememberMe behaves the same as in LoginRequest.
export interface GoogleLoginRequest {
  idToken: string
  rememberMe?: boolean
}

// Response from both /api/auth/login and /api/auth/google on success.
export interface AuthResponse {
  token: string
  email: string
  userRole: string
}

// ─── UI ───────────────────────────────────────────────────────────────────────

// An in-app toast notification managed by useToast.
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  /** Auto-dismiss delay in milliseconds; defaults to 4 000 in useToast. */
  duration?: number
}

// Normalised shape of an error returned by the API interceptor.
export interface ApiError {
  message: string
  statusCode: number
}
