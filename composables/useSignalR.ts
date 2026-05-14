// SignalR composable. Manages WebSocket hub connections for all five real-time
// hubs the API exposes. Supports auto-reconnect, typed event shortcuts, and
// a reactive isConnected flag. See sprint plan S1.4 for the full spec.
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import type { HubConnection } from '@microsoft/signalr'

// Union type of all hub identifiers used in the application.
type HubName = 'appointments' | 'workers' | 'customers' | 'services' | 'users'

// Maps each hub name to its WebSocket endpoint path on the API.
const HUB_ROUTES: Record<HubName, string> = {
  appointments: '/appointmentsHub',
  workers: '/workersHub',
  customers: '/customersHub',
  services: '/servicesHub',
  users: '/usersHub',
}

// Events emitted by each hub; the client subscribes to these to trigger
// store refreshes when the server pushes a change notification.
const HUB_EVENTS: Record<HubName, string[]> = {
  appointments: ['AppointmentsChanged'],
  workers: ['WorkersChanged'],
  customers: ['CustomersChanged'],
  services: ['ServicesChanged'],
  users: ['UsersChanged'],
}

// Module-level maps — one entry per active hub connection.
const connections = new Map<HubName, HubConnection>()

// Stores all registered callbacks keyed by "{hub}:{event}" so they can be
// cleaned up individually when a caller unsubscribes.
const listeners = new Map<string, Set<() => void>>()

// Reactive flag; true when at least one hub is in the Connected state.
const isConnectedRef = ref(false)

// Updates isConnected by checking whether any hub is currently connected.
function refreshConnectedState(): void {
  isConnectedRef.value = [...connections.values()].some(
    (c) => c.state === HubConnectionState.Connected,
  )
}

export function useSignalR() {
  const config = useRuntimeConfig()

  // Establishes a connection to the given hub. Idempotent — returns immediately
  // if the hub is already connected or connecting.
  async function connect(hub: HubName): Promise<void> {
    if (connections.has(hub)) return

    const apiBase = config.public.apiBase as string
    const url = `${apiBase}${HUB_ROUTES[hub]}`

    const conn = new HubConnectionBuilder()
      .withUrl(url, {
        // Reads the JWT cookie on every reconnect attempt so a fresh token
        // is used after the user re-authenticates.
        accessTokenFactory: () => useCookie('bs_token').value ?? '',
      })
      // Retry delays (ms): immediate, 2 s, 5 s, 10 s, 30 s.
      .withAutomaticReconnect([0, 2_000, 5_000, 10_000, 30_000])
      .configureLogging(LogLevel.Warning)
      .build()

    // Register all events for this hub so stored callbacks fire correctly.
    for (const event of HUB_EVENTS[hub]) {
      conn.on(event, () => {
        const key = `${hub}:${event}`
        listeners.get(key)?.forEach((cb) => cb())
      })
    }

    // Re-fetch store data after reconnecting so the UI is always up to date.
    conn.onreconnected(() => {
      refreshConnectedState()
      const key = `${hub}:reconnected`
      listeners.get(key)?.forEach((cb) => cb())
    })

    conn.onclose(() => {
      refreshConnectedState()
    })

    await conn.start()
    connections.set(hub, conn)
    refreshConnectedState()
  }

  // Stops the connection for a single hub and removes it from the map.
  async function disconnect(hub: HubName): Promise<void> {
    const conn = connections.get(hub)
    if (!conn) return
    await conn.stop()
    connections.delete(hub)
    refreshConnectedState()
  }

  // Stops all active hub connections. Called in onUnmounted of the admin layout.
  async function disconnectAll(): Promise<void> {
    await Promise.all([...connections.keys()].map(disconnect))
  }

  // Registers a callback for a specific hub event. Auto-connects the hub if it
  // is not already connected. Returns an unsubscribe function.
  function on(hub: HubName, event: string, callback: () => void): () => void {
    const key = `${hub}:${event}`

    if (!listeners.has(key)) {
      listeners.set(key, new Set())
    }
    listeners.get(key)!.add(callback)

    // Ensure the hub is connected when a listener is added.
    if (!connections.has(hub)) {
      connect(hub)
    }

    // Returns a cleanup function the caller can invoke to unsubscribe.
    return () => {
      listeners.get(key)?.delete(callback)
    }
  }

  // Subscribes to a hub's change event AND its reconnect event. The same
  // callback fires for both: store consumers typically want to refetch when
  // the server pushes a change OR when the connection comes back after a
  // drop (data may have changed during the disconnect window).
  function subscribeWithReconnect(
    hub: HubName,
    event: string,
    callback: () => void,
  ): () => void {
    const unsubChange = on(hub, event, callback)
    const unsubReconnect = on(hub, 'reconnected', callback)
    return () => {
      unsubChange()
      unsubReconnect()
    }
  }

  // ── Typed event shortcuts ────────────────────────────────────────────────
  // Each shortcut wires the canonical event name for that hub and auto-fires
  // the callback on reconnect via subscribeWithReconnect.

  const onAppointmentsChanged = (cb: () => void) =>
    subscribeWithReconnect('appointments', 'AppointmentsChanged', cb)

  const onWorkersChanged = (cb: () => void) =>
    subscribeWithReconnect('workers', 'WorkersChanged', cb)

  const onCustomersChanged = (cb: () => void) =>
    subscribeWithReconnect('customers', 'CustomersChanged', cb)

  const onServicesChanged = (cb: () => void) =>
    subscribeWithReconnect('services', 'ServicesChanged', cb)

  const onUsersChanged = (cb: () => void) =>
    subscribeWithReconnect('users', 'UsersChanged', cb)

  return {
    connect,
    disconnect,
    disconnectAll,
    on,
    onAppointmentsChanged,
    onWorkersChanged,
    onCustomersChanged,
    onServicesChanged,
    onUsersChanged,
    isConnected: readonly(isConnectedRef),
  }
}
