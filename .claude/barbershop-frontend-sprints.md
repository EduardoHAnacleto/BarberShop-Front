# BarberShop Frontend — Plano de Sprints
> **Metodologia:** Cascata com sprints internos de 1 semana  
> **Stack:** Nuxt 3 · TypeScript · Tailwind CSS · Pinia · SignalR · Playwright · Vitest  
> **API de referência:** BarberShop.API (ASP.NET Core 10) — já em produção  
> **Duração total estimada:** 8 sprints (8 semanas)  
> **Regra global:** nenhum sprint começa sem 100% do DoD do sprint anterior satisfeito e verificado em pipeline CI
> **Regra Global:** todo código implementado deve seguir a documentação mais atualizada para a versão implementada de cada ferramenta.
> **Regra Global:** Todo bloco de código deve ter um comentário explicando o que aquele código faz
> **Regra Global:** Todo código deve seguir o idioma inglês, tanto como nomes de variáveis, classes, funções e comentários.
**Items**: A API está localizada em 'C:\GitHub\BarberShop', o projeto frontend deverá ter um repositório no GitHub, e localmente ficará em 'C:\GitHub\BarberShop-Front'.

---

## Legenda

| Símbolo | Significado |
|---|---|
| `[ ]` | Tarefa a executar |
| `[T]` | Tarefa de teste associada |
| `→` | Input necessário para a tarefa |
| `✓` | Item obrigatório no DoD |

---

## Sprint 1 — Fundação e Infraestrutura

**Duração:** 1 semana  
**Objetivo:** Repositório configurado, pipeline verde, design system tokenizado e autenticação funcional end-to-end.  
**Bloqueador de entrada:** nenhum  
**Bloqueador de saída:** DoD deste sprint 100% satisfeito

---

### S1.1 — Repositório e Tooling

#### Tarefas

- [ ] Criar repositório Git com branch `main` protegida (require PR + CI verde para merge)
- [ ] Inicializar projeto Nuxt 3 com flag `--typescript` e `strict: true` no `tsconfig.json`
- [ ] Instalar e configurar dependências exatas:

  ```json
  {
    "dependencies": {
      "nuxt": "3.17.x",
      "@nuxtjs/tailwindcss": "6.x",
      "@pinia/nuxt": "0.10.x",
      "@vueuse/nuxt": "13.x",
      "@nuxtjs/color-mode": "3.x",
      "@microsoft/signalr": "8.x",
      "@vite-pwa/nuxt": "0.x",
      "axios": "1.x",
      "jwt-decode": "4.x",
      "chart.js": "4.x",
      "vue-chartjs": "5.x",
      "dayjs": "1.x"
    },
    "devDependencies": {
      "vitest": "2.x",
      "@vue/test-utils": "2.x",
      "@nuxt/test-utils": "3.x",
      "msw": "2.x",
      "@playwright/test": "1.x",
      "@axe-core/playwright": "4.x",
      "@lhci/cli": "0.x"
    }
  }
  ```

- [ ] Configurar ESLint com `@nuxt/eslint` e regras: `vue/multi-word-component-names: off`, `@typescript-eslint/no-explicit-any: error`
- [ ] Configurar Prettier com `printWidth: 100`, `singleQuote: true`, `semi: false`, `trailingComma: 'all'`
- [ ] Criar `.env.example` com todas as variáveis necessárias documentadas:

  ```
  NUXT_PUBLIC_API_BASE=http://localhost:8080
  NUXT_PUBLIC_GOOGLE_CLIENT_ID=
  ```

- [ ] Criar `.env.local` (gitignored) com valores de desenvolvimento local
- [ ] Configurar `nuxt.config.ts` completo:
  - `modules`: tailwindcss, pinia, vueuse, color-mode, pwa
  - `colorMode`: `{ classSuffix: '', preference: 'dark', fallback: 'dark' }`
  - `runtimeConfig.public`: `apiBase`, `googleClientId`
  - `app.head`: charset, viewport, description, theme-color, manifest link, Google Fonts (Playfair Display 400/600/700/italic, DM Sans 300/400/500, DM Mono 400/500), Google GSI script async/defer
  - `app.pageTransition`: `{ name: 'page', mode: 'out-in' }`
  - `app.layoutTransition`: `{ name: 'layout', mode: 'out-in' }`
  - `typescript.strict: true`
  - `css`: `['~/assets/css/global.css']`
- [ ] Criar estrutura de pastas completa (todos os diretórios, mesmo que vazios, com `.gitkeep`):

  ```
  assets/css/
  components/ui/
  components/layout/
  components/appointments/
  components/workers/
  components/customers/
  components/services/
  components/schedule/
  composables/
  layouts/
  middleware/
  pages/admin/
  stores/
  types/
  public/
  tests/unit/
  tests/integration/
  tests/e2e/
  ```

#### DoD — S1.1

- ✓ `npm run build` conclui sem erros nem warnings de TypeScript
- ✓ `npm run lint` retorna 0 erros e 0 warnings
- ✓ Todos os diretórios existem no repositório
- ✓ `.env.example` contém todas as variáveis com comentários explicativos
- ✓ `nuxt.config.ts` importa sem erros e todas as chaves de `runtimeConfig` são tipadas

---

### S1.2 — Design System

#### Tarefas

- [ ] Criar `tailwind.config.ts` com:
  - Escala de cores `gold`: 50/100/200/300/400/500(`#c9a84c`)/600/700/800/900
  - Escala de cores `obsidian`: 50/100/200/300/400/500/600/700/800(`#1a1a1a`)/900(`#0f0f0f`)/950(`#080808`)
  - Aliases semânticos no tema:
    - `surface.DEFAULT: #111111`
    - `surface.raised: #181818`
    - `surface.overlay: #202020`
    - `surface.border: #2a2a2a`
  - Família tipográfica: `display: ['Playfair Display', 'Georgia', 'serif']`, `body: ['DM Sans', 'system-ui', 'sans-serif']`, `mono: ['DM Mono', 'monospace']`
  - Animações customizadas: `fade-in`, `slide-up`, `slide-in-right`, `shimmer`, `pulse-gold`
  - Keyframes correspondentes a cada animação
  - Box shadows: `gold` (ring dourado sutil), `gold-glow` (glow externo), `card`, `elevated`
  - `darkMode: 'class'`

- [ ] Criar `assets/css/global.css` com `@tailwind base/components/utilities` e:

  **`@layer base`:**
  - Variáveis CSS: `--gold: #c9a84c`, `--gold-light: #e8c96a`, `--gold-dim: rgba(201,168,76,0.15)`, `--bg: #0a0a0a`, `--surface: #111111`, `--surface-raised: #181818`, `--surface-overlay: #202020`, `--border: #2a2a2a`, `--border-subtle: #1e1e1e`, `--text-primary: #f0ede8`, `--text-secondary: #9a9690`, `--text-muted: #5a5754`
  - Reset: `box-sizing: border-box`, `-webkit-font-smoothing: antialiased`
  - Scrollbar customizado (6px, cor `--border`)
  - Seleção de texto com fundo `rgba(201,168,76,0.25)`

  **`@layer components`:**
  - `.text-gradient-gold`: gradient clip text dourado
  - `.surface`, `.surface-raised`, `.surface-overlay`: background + border 1px `--border`
  - `.btn`: base flex, gap-2, rounded, transition 200ms, disabled opacity-40, focus-visible ring gold
  - `.btn-primary`: gold-500 bg, obsidian-950 text, hover gold-400
  - `.btn-ghost`: transparent, text-secondary, hover bg white/5
  - `.btn-outline`: border `--border`, hover border gold-500/50
  - `.btn-danger`: red-900/30 bg, red-400 text, border red-800/40
  - `.btn-sm`: px-3 py-1.5 text-xs
  - `.btn-lg`: px-6 py-3 text-base
  - `.btn-icon`: w-9 h-9 p-0
  - `.input`: w-full, bg surface-raised, border `--border`, focus border gold-500/60 + ring gold-500/20, placeholder `--text-muted`
  - `.label`: text-xs font-medium uppercase tracking-wide text-secondary
  - `.form-group`: flex flex-col gap-1
  - `.card`: surface rounded-lg p-5 shadow-card transition-all
  - `.card-hover`: card + hover border gold-500/30 shadow-gold-glow
  - `.badge`: inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono
  - `.badge-gold`, `.badge-green`, `.badge-blue`, `.badge-yellow`, `.badge-red`, `.badge-gray`: variações de badge
  - `.divider`: border-t border `--border`
  - `.skeleton`: animate-shimmer, background-image gradient shimmer
  - `.table thead th`: text-xs font-mono uppercase text-muted border-b
  - `.table tbody tr`: hover bg white/[0.02], border-b border-subtle
  - `.table tbody td`: px-4 py-3
  - `.table-wrapper`: surface rounded-lg overflow-hidden
  - `.sidebar-link`: flex items-center gap-3 px-3 py-2.5 text-secondary hover:text-primary hover:bg-white/[0.04] transition
  - `.sidebar-link.active`: text-gold-400 bg-gold-500/10 border border-gold-500/20
  - `.modal-backdrop`: fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center
  - `.modal-panel`: surface-overlay rounded-xl shadow-elevated w-full max-h-[90vh] overflow-y-auto animate-slide-up
  - `.toast`: fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg shadow-elevated text-sm z-50
  - `.section-label`: text-xs font-mono uppercase tracking-[0.15em] text-muted
  - Transições `.page-enter-active/leave-active/enter-from/leave-to` e `.layout-enter-active/leave-active`

  **`@layer utilities`:**
  - `.text-primary`, `.text-secondary`, `.text-muted`, `.text-gold`
  - `.bg-surface`, `.bg-raised`
  - `.border-subtle`
  - `.scrollbar-hidden`

#### DoD — S1.2

- ✓ Cada classe de design system existe e renderiza corretamente em uma página de storybook/sandbox (`/dev` apenas em development)
- ✓ `npm run build` sem erros após adição do CSS
- ✓ As 3 fontes (Playfair Display, DM Sans, DM Mono) carregam no browser verificado por DevTools Network tab
- ✓ Todas as animações funcionam: fade-in, slide-up, shimmer são visualmente corretas
- ✓ Nenhuma classe Tailwind arbitrária (`[...]`) usada onde existe token do design system

---

### S1.3 — Tipos TypeScript

#### Tarefas

- [ ] Criar `types/index.ts` com as seguintes definições exatas (sem `any`):

  ```typescript
  // Enums
  export enum AppointmentStatus { Scheduled = 0, OnGoing = 1, Completed = 2, Cancelled = 3, Deleted = 4 }
  export enum UserRole { Client = 0, User = 1, Admin = 3 }
  export enum ClosureType { UntilNextOpening = 0, UntilSpecificDate = 1 }

  // Domínio
  export interface Customer { id: number; name: string; dateOfBirth?: string; email: string; phoneNumber: string }
  export interface Service { id: number; name: string; description: string; duration: number; price: number }
  export interface Worker { id: number; name: string; email: string; phoneNumber: string; address: string; position: string; wagePerHour: number; dateOfBirth: string; servicesId: number[]; providedServices: Service[] }
  export interface Appointment { id: number; workerName: string; workerId: number; customerName: string; customerId: number; serviceName: string; serviceId: number; scheduledFor: string; status: AppointmentStatus; completedAt?: string; extraDetails: string; createdAt: string }
  export interface AppointmentRequest { workerId: number; customerId: number; serviceId: number; scheduledFor: string; status: AppointmentStatus; extraDetails?: string }
  export interface User { id: number; customerId?: number; workerId?: number; email: string; userRole: UserRole; isActive: boolean; createdAt: string; lockoutEnd?: string }
  export interface UserRequest { customerId?: number; workerId?: number; email: string; passwordHash: string; userRole: UserRole; isActive: boolean }
  export interface BusinessSchedule { id: number; dayOfWeek: number; isOpen: boolean; openTime?: string; closeTime?: string; breakStart?: string; breakEnd?: string }
  export interface WorkingHours { id: number; closedFrom: string; closedUntil?: string; reason: string; closureType: ClosureType }

  // Auth
  export interface LoginRequest { email: string; password: string }
  export interface GoogleLoginRequest { idToken: string }
  export interface AuthResponse { token: string; email: string; userRole: string }

  // UI
  export interface Toast { id: string; type: 'success' | 'error' | 'warning' | 'info'; message: string; duration?: number }
  export interface ApiError { message: string; statusCode: number }
  ```

#### DoD — S1.3

- ✓ `tsc --noEmit` retorna 0 erros com `strict: true`
- ✓ Nenhum `any` explícito em `types/index.ts`
- ✓ Todos os campos obrigatórios da API refletidos (verificado comparando com os DTOs do backend)
- ✓ Enums numéricos correspondem exatamente aos valores do backend (Status=0,1,2,3,4 / UserRoles=0,1,3)

---

### S1.4 — Composables de Infraestrutura

#### Tarefas

**`composables/useApi.ts`**

- [ ] Criar instância Axios singleton com `baseURL: config.public.apiBase` e `timeout: 15000`
- [ ] Interceptor de request: lê `useCookie('bs_token').value` e adiciona `Authorization: Bearer {token}` se presente
- [ ] Interceptor de response: se status 401 → `useCookie('bs_token').value = null` → `navigateTo('/login')`; para outros erros, rejeita com o erro original
- [ ] Funções genéricas tipadas: `get<T>(url, params?)`, `post<T>(url, body?)`, `put<T>(url, body?)`, `del<T>(url)`
- [ ] Objeto `api.auth`:
  - `login(body: LoginRequest): Promise<AuthResponse>` → POST `/api/auth/login`
  - `google(idToken: string): Promise<AuthResponse>` → POST `/api/auth/google` com `{ idToken }`
  - `unlock(userId: number): Promise<string>` → POST `/api/auth/unlock/{userId}`
- [ ] Objeto `api.appointments`:
  - `all(): Promise<Appointment[]>` → GET `/api/appointments/all`
  - `byId(id: number): Promise<Appointment>` → GET `/api/appointments/{id}`
  - `create(body: AppointmentRequest): Promise<Appointment>` → POST `/api/appointments`
  - `update(id: number, body: AppointmentRequest): Promise<Appointment>` → PUT `/api/appointments/{id}`
  - `delete(id: number): Promise<void>` → DELETE `/api/appointments/{id}`
  - `byRange(start: string, end: string): Promise<Appointment[]>` → GET `/api/appointments/range?dateStart={start}&dateEnd={end}`
  - `byWorker(workerId: number): Promise<Appointment[]>` → GET `/api/appointments/worker/{workerId}`
  - `byCustomer(customerId: number): Promise<Appointment[]>` → GET `/api/appointments/customer/{customerId}`
  - `byService(serviceId: number): Promise<Appointment[]>` → GET `/api/appointments/service/{serviceId}`
  - `byStatus(status: AppointmentStatus): Promise<Appointment[]>` → GET `/api/appointments/status/{status}`
  - `delay(idList: number[], timeSpan: string): Promise<void>` → POST `/api/appointments` (endpoint de delay batch)
  - `cancel(idList: number[]): Promise<void>` → POST (endpoint de cancel batch)
- [ ] Objeto `api.workers`:
  - `all(): Promise<Worker[]>` → GET `/api/workers/all`
  - `byId(id: number): Promise<Worker>` → GET `/api/workers/{id}`
  - `create(body: Partial<Worker>): Promise<Worker>` → POST `/api/workers`
  - `update(id: number, body: Partial<Worker>): Promise<Worker>` → PUT `/api/workers/{id}`
  - `delete(id: number): Promise<void>` → DELETE `/api/workers/{id}`
  - `servicesByWorker(id: number): Promise<Service[]>` → GET `/api/workers/by-worker/{id}`
  - `workersByService(id: number): Promise<Worker[]>` → GET `/api/workers/by-service/{id}`
- [ ] Objeto `api.customers`:
  - `all(): Promise<Customer[]>` → GET `/api/customers/all`
  - `byId(id: number): Promise<Customer>` → GET `/api/customers/{id}`
  - `create(body: Partial<Customer>): Promise<Customer>` → POST `/api/customers`
  - `update(id: number, body: Partial<Customer>): Promise<Customer>` → PUT `/api/customers/{id}`
  - `delete(id: number): Promise<void>` → DELETE `/api/customers/{id}`
- [ ] Objeto `api.services`:
  - `all(): Promise<Service[]>` → GET `/api/services/all`
  - `byId(id: number): Promise<Service>` → GET `/api/services/{id}`
  - `create(body: Partial<Service>): Promise<Service>` → POST `/api/services`
  - `update(id: number, body: Partial<Service>): Promise<Service>` → PUT `/api/services/{id}`
  - `delete(id: number): Promise<void>` → DELETE `/api/services/{id}`
- [ ] Objeto `api.users`:
  - `all(): Promise<User[]>` → GET `/users/all`
  - `byId(id: number): Promise<User>` → GET `/users/{id}`
  - `create(body: UserRequest): Promise<User>` → POST `/users`
  - `update(id: number, body: UserRequest): Promise<User>` → PUT `/users/{id}`
  - `delete(id: number): Promise<void>` → DELETE `/users/{id}`
- [ ] Objeto `api.schedule`:
  - `getSchedule(): Promise<BusinessSchedule[]>` → GET `/api/working-hours/schedule`
  - `getByDay(day: number): Promise<BusinessSchedule>` → GET `/api/working-hours/schedule/{day}`
  - `updateSchedule(id: number, body: Partial<BusinessSchedule>): Promise<BusinessSchedule>` → PUT `/api/working-hours/schedule/{id}`
  - `getClosures(): Promise<WorkingHours[]>` → GET `/api/working-hours/closures`
  - `addClosure(body: Partial<WorkingHours>): Promise<WorkingHours>` → POST `/api/working-hours/closures`
  - `removeClosure(id: number): Promise<void>` → DELETE `/api/working-hours/closures/{id}`
  - `isOpen(dateTime: string): Promise<{ isOpen: boolean }>` → GET `/api/working-hours/is-open?dateTime={dateTime}`

**`composables/useAuth.ts`**

- [ ] Cookie `bs_token` com `{ maxAge: 86400, secure: true, sameSite: 'lax' }`
- [ ] Interface interna `JwtPayload { sub: string; email: string; role: string; exp: number }`
- [ ] Estado global via `useState<AuthState>('auth')` com `{ token, email, role, userId }` todos inicializados como `null`
- [ ] Função `_hydrate(token: string)`:
  1. Decodifica com `jwtDecode<JwtPayload>(token)`
  2. Se `decoded.exp * 1000 < Date.now()` → chama `logout()` e retorna
  3. Seta estado e cookie
- [ ] Hidratação no client-side: `if (import.meta.client && tokenCookie.value && !state.value.token) _hydrate(tokenCookie.value)`
- [ ] `login(email, password)`: chama `api.auth.login` → em sucesso `_hydrate(res.token)` + `toast.success` → retorna `true`; em erro exibe `toast.error` com mensagem da API → retorna `false`
- [ ] `loginWithGoogle(idToken)`: chama `api.auth.google(idToken)` → mesmo fluxo de login
- [ ] `logout()`: `state.value = { token: null, email: null, role: null, userId: null }` → `tokenCookie.value = null` → `navigateTo('/login')`
- [ ] Computed exportados: `isLoggedIn: computed(() => !!state.value.token)`, `isAdmin: computed(() => state.value.role === 'Admin')`, `userEmail: computed(() => state.value.email)`, `userId: computed(() => state.value.userId)`

**`composables/useToast.ts`**

- [ ] `const toasts = ref<Toast[]>([])` — singleton via module scope (fora da função)
- [ ] `add(toast: Omit<Toast, 'id'>)`: gera `id` com `crypto.randomUUID()`, push no array, chama `setTimeout(() => remove(id), toast.duration ?? 4000)`
- [ ] `remove(id: string)`: filtra array
- [ ] `success(message, duration?)`: chama `add` com `type: 'success'`
- [ ] `error(message, duration?)`: chama `add` com `type: 'error'`, duration padrão `6000`
- [ ] `warning(message, duration?)`: chama `add` com `type: 'warning'`
- [ ] `info(message, duration?)`: chama `add` com `type: 'info'`
- [ ] Exporta `toasts` como `readonly(toasts)`

**`composables/useSignalR.ts`**

- [ ] Map `connections: Map<HubName, HubConnection>` no module scope
- [ ] Map `listeners: Map<string, Set<() => void>>` no module scope
- [ ] Tipo `HubName = 'appointments' | 'workers' | 'customers' | 'services' | 'users'`
- [ ] Constante `HUB_ROUTES: Record<HubName, string>` mapeando cada hub para sua rota
- [ ] Constante `HUB_EVENTS: Record<HubName, string[]>` mapeando eventos por hub
- [ ] `connect(hub)`: se já existe na map, retorna; cria `HubConnectionBuilder` com URL, `accessTokenFactory` lendo o cookie, `withAutomaticReconnect([0, 2000, 5000, 10000, 30000])`, `LogLevel.Warning`; registra todos os eventos do hub; registra `onreconnected` e `onclose`; chama `conn.start()`; adiciona ao Map
- [ ] `disconnect(hub)`: chama `conn.stop()` e remove do Map
- [ ] `disconnectAll()`: itera o Map e chama `disconnect` em cada um
- [ ] `on(hub, event, callback)`: cria chave `{hub}:{event}`, adiciona callback ao Set, auto-conecta se não conectado, retorna função de unsubscribe
- [ ] Atalhos tipados: `onAppointmentsChanged`, `onWorkersChanged`, `onCustomersChanged`, `onServicesChanged`, `onUsersChanged`
- [ ] Estado reativo exportado: `isConnected: readonly(ref<boolean>)`

#### DoD — S1.4

- ✓ `tsc --noEmit` sem erros nos 4 arquivos de composables
- ✓ Nenhum `any` explícito; todos os retornos tipados com interfaces de `types/index.ts`
- ✓ Testes unitários (ver S1.6) passando para `useApi`, `useAuth`, `useToast`
- ✓ `useApi` não é instanciado duas vezes (singleton verificado via log no `console.warn` em desenvolvimento)

---

### S1.5 — Middleware, Layouts e Componentes Base

#### Tarefas

**Middleware**

- [ ] `middleware/auth.ts`: se `useCookie('bs_token').value` é falsy → `return navigateTo('/login?redirect=' + encodeURIComponent(to.fullPath))`
- [ ] `middleware/admin.ts`: chama `useAuth()`; se `!isLoggedIn.value` → `/login`; se `!isAdmin.value` → `/`

**Layouts**

- [ ] `layouts/default.vue`: div com `class="min-h-screen bg-[var(--bg)]"` + `<slot />` + `<UiToastContainer />`
- [ ] `layouts/admin.vue`:
  - Chama `useSignalR()` no `onMounted` e conecta os 5 hubs em paralelo com `Promise.all`
  - Chama `disconnectAll()` no `onUnmounted`
  - Estrutura: `flex min-h-screen` com `<LayoutAdminSidebar />` + div principal (flex-col)
  - Header: `h-14 sticky top-0 z-10`, indicador de conexão SignalR (ponto colorido + texto), data atual formatada
  - Main: `flex-1 p-6 overflow-auto` com `<slot />`
  - `<UiToastContainer />`

**`components/layout/AdminSidebar.vue`**

- [ ] Props: nenhuma. Estado interno: `collapsed = ref(false)`
- [ ] Array `nav` com `{ label, to, icon }` para: Dashboard(`/admin`), Appointments(`/admin/appointments`), Workers(`/admin/workers`), Customers(`/admin/customers`), Services(`/admin/services`), Schedule(`/admin/schedule`), Users(`/admin/users`)
- [ ] Função `isActive(to)`: se `to === '/admin'` compara com `route.path === '/admin'`; caso contrário `route.path.startsWith(to)`
- [ ] Logo: div 8x8 com inicial "B" em gold, texto "BarberShop" e "Admin" com transição ao colapsar
- [ ] Nav: `NuxtLink` com classe `sidebar-link` e `.active` quando `isActive`
- [ ] Colapso: largura da sidebar via `w-60` / `w-16` com `transition-all duration-300`; textos e labels têm `<Transition name="fade-text">` que os esconde quando `collapsed`
- [ ] Rodapé: email do usuário (truncado, hidden quando collapsed), botão collapse, botão logout (chama `useAuth().logout()`)

**`components/ui/ToastContainer.vue`**

- [ ] Usa `Teleport to="body"`
- [ ] `TransitionGroup name="toast"` para animação de entrada/saída por slide da direita
- [ ] Para cada toast: container com cor de fundo por tipo (emerald/red/yellow/blue), ponto colorido, texto, botão X que chama `remove(t.id)`
- [ ] Cores por tipo: `success=emerald-900/80 border-emerald-700/50`, `error=red-900/80 border-red-700/50`, `warning=yellow-900/80 border-yellow-700/50`, `info=blue-900/80 border-blue-700/50`
- [ ] Posição: `fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none`; cada toast `pointer-events-auto`

**`components/ui/Modal.vue`**

- [ ] Props: `modelValue: boolean`, `title?: string`, `size?: 'sm' | 'md' | 'lg'`
- [ ] Emits: `update:modelValue`
- [ ] Usa `Teleport to="body"`
- [ ] `<Transition name="modal">` envolvendo o backdrop
- [ ] Backdrop: `modal-backdrop`; clique fora fecha (`.self` para não fechar ao clicar no panel)
- [ ] Panel: `modal-panel` com `max-w-sm | max-w-lg | max-w-2xl` conforme `size`
- [ ] Header (se `title`): título em `font-display` + botão X
- [ ] Body: `<slot />`
- [ ] Footer: `<slot name="footer" />` (wrapper com `flex justify-end gap-3` visível apenas se slot existir)
- [ ] Animação: panel entra com `scale(0.95) translateY(-10px) opacity-0` → escala normal

**`components/ui/ConfirmDialog.vue`**

- [ ] Props: `modelValue: boolean`, `title: string`, `message: string`, `confirmLabel?: string` (default "Confirm"), `cancelLabel?: string` (default "Cancel"), `dangerous?: boolean` (default false)
- [ ] Emits: `update:modelValue`, `confirm`
- [ ] Usa `UiModal` internamente com `size="sm"`
- [ ] Footer: botão cancel (`btn-ghost`) + botão confirm (`btn-danger` se `dangerous`, senão `btn-primary`)

**`components/ui/Skeleton.vue`**

- [ ] Props: `class?: string`, `count?: number` (default 1), `height?: string` (default "h-10")
- [ ] Renderiza `count` divs com classe `skeleton` e `height`

**`components/SidebarIcon.vue`** (ícones SVG inline)

- [ ] Props: `icon: string`
- [ ] Suporta os ícones: `grid`, `calendar`, `users`, `user`, `scissors`, `clock`, `shield`, `logout`, `chevron-left`, `chevron-right`, `x`, `plus`, `edit`, `trash`, `search`, `check`, `alert`, `wifi`, `eye`, `eye-off`
- [ ] Cada ícone: SVG `viewBox="0 0 24 24"` `fill="none"` `stroke="currentColor"` `stroke-width="1.75"` `stroke-linecap="round"` `stroke-linejoin="round"`

**`pages/login.vue`**

- [ ] `definePageMeta({ layout: 'default' })`
- [ ] `watchEffect`: se `isLoggedIn`, redireciona admin para `/admin`, outros para `route.query.redirect || '/'`
- [ ] Estado: `form = reactive({ email: '', password: '' })`, `loading = ref(false)`, `showPassword = ref(false)`
- [ ] Background: dois blobs de `gold-500/[0.03]` blur-3xl posicionados absolutamente + grid de linhas sutis
- [ ] Formulário:
  - Input de email com `autocomplete="email"` e `required`
  - Input de senha com toggle de visibilidade (ícone eye/eye-off) e `autocomplete="current-password"` e `required`
  - Botão submit com spinner durante loading
- [ ] Google: div `id="google-btn"` para render do botão Google; inicialização no `onMounted` esperando `window.google` estar disponível
- [ ] Função `handleLogin()`: seta `loading = true`, chama `login(form.email, form.password)`, seta `loading = false`
- [ ] Função `initGoogle()`: inicializa SDK com `client_id` e `callback` que chama `loginWithGoogle(credential)`

#### DoD — S1.5

- ✓ `/login` carrega sem erros de console
- ✓ Sidebar renderiza em desktop (1280px) e colapsa para w-16 corretamente
- ✓ Layout admin conecta os 5 hubs no mount e desconecta no unmount (verificado via log do SignalR no console)
- ✓ Modal abre e fecha com animação; clique fora fecha; Escape fecha
- ✓ ToastContainer exibe e auto-remove toasts em todas as 4 variantes
- ✓ Testes E2E de login passando (ver S1.6)

---

### S1.6 — Testes do Sprint 1

#### Unitários (Vitest) — `tests/unit/`

**`useApi.spec.ts`**

- [T] Interceptor de request: dado cookie com token `"abc"`, request deve ter header `Authorization: Bearer abc`
- [T] Interceptor de request: dado cookie sem token, request não deve ter header `Authorization`
- [T] Interceptor de response 401: deve chamar `navigateTo('/login')` e limpar o cookie
- [T] Interceptor de response 500: deve rejeitar a Promise com o erro original sem redirecionar
- [T] `get<T>()`: deve retornar `data` da resposta tipada
- [T] `post<T>()`: deve enviar body como JSON e retornar `data`

**`useAuth.spec.ts`**

- [T] `login()` com resposta 200: deve chamar `_hydrate`, setar cookie, retornar `true`
- [T] `login()` com resposta 400: deve chamar `toast.error`, não setar cookie, retornar `false`
- [T] `login()` com resposta contendo mensagem "Account is locked": toast deve exibir a mensagem exata da API
- [T] `_hydrate()` com token expirado (`exp` no passado): deve chamar `logout()`
- [T] `_hydrate()` com token válido: deve setar `state.value.email` e `state.value.role`
- [T] `isAdmin` computed: retorna `true` quando `role === 'Admin'`, `false` quando `role === 'User'`
- [T] `isLoggedIn` computed: retorna `true` quando `token` não é null, `false` quando null
- [T] `logout()`: deve setar `state.value.token = null`, `tokenCookie.value = null`, chamar `navigateTo('/login')`
- [T] `loginWithGoogle()` com resposta 200: deve chamar `_hydrate` e retornar `true`

**`useToast.spec.ts`**

- [T] `success(msg)`: deve adicionar toast com `type='success'` ao array
- [T] `error(msg)`: deve adicionar toast com `type='error'` e duration padrão `6000`
- [T] `add()`: após `duration` ms, o toast deve ser removido do array
- [T] `remove(id)`: deve remover exatamente o toast com o id informado
- [T] Múltiplos toasts: array deve manter ordem de inserção

**`middleware/auth.spec.ts`**

- [T] Sem cookie → deve retornar `navigateTo('/login?redirect=%2Fadmin%2Fappointments')` para rota `/admin/appointments`
- [T] Com cookie válido → não deve redirecionar

**`middleware/admin.spec.ts`**

- [T] Sem login → deve retornar `navigateTo('/login')`
- [T] Logado como User (role !== Admin) → deve retornar `navigateTo('/')`
- [T] Logado como Admin → não deve redirecionar

#### E2E (Playwright) — `tests/e2e/auth.spec.ts`

> Pré-condição: API rodando em `http://localhost:8080` com usuário `admin@barbershop.com` / `Admin@123`

- [T] **Login com sucesso (admin):** Acessa `/login` → preenche email `admin@barbershop.com` e senha `Admin@123` → clica Sign in → URL muda para `/admin` → sidebar visível
- [T] **Login com credenciais inválidas:** Acessa `/login` → preenche email/senha errados → clica Sign in → permanece em `/login` → toast de erro visível com texto não vazio
- [T] **Lockout após 5 tentativas:** Faz login com senha errada 5x → na 6ª tentativa recebe mensagem de lockout
- [T] **Logout:** Faz login → clica "Sign out" na sidebar → URL muda para `/login` → cookie `bs_token` ausente
- [T] **Proteção de rota sem login:** Acessa `/admin` diretamente → redireciona para `/login?redirect=%2Fadmin`
- [T] **Proteção de rota admin:** Faz login como User (role não Admin) → acessa `/admin` → redireciona para `/`
- [T] **Redirecionamento pós-login:** Acessa `/admin/appointments` sem login → redireciona para login → faz login → vai para `/admin/appointments`
- [T] **Toggle de senha:** Campo senha exibe `type="password"` → clica no ícone olho → muda para `type="text"` → clica novamente → volta para `password`

#### DoD — Sprint 1 completo

- ✓ `npm run test:unit` — 100% passando (0 falhas, 0 skipped)
- ✓ `npm run test:e2e` — todos os 8 testes E2E passando
- ✓ `npm run build` — sem erros
- ✓ `npm run lint` — 0 erros, 0 warnings
- ✓ `tsc --noEmit` — 0 erros com `strict: true`
- ✓ Branch `sprint-1` mergeada em `main` via PR com CI verde

---

## Sprint 2 — Admin CRUD: Appointments e Workers

**Duração:** 1 semana  
**Objetivo:** Telas de appointments e workers 100% funcionais com CRUD completo, filtros e ações em lote.  
**Bloqueador de entrada:** DoD Sprint 1 satisfeito

---

### S2.1 — Stores Pinia

#### Tarefas

**Padrão obrigatório para todos os stores:**

```typescript
// Estado
const items   = ref<T[]>([])
const loading = ref(false)
const error   = ref<string | null>(null)

// fetchAll sempre reseta error e seta loading
async function fetchAll() {
  loading.value = true
  error.value   = null
  try { items.value = await api.xxx.all() }
  catch (e: unknown) { error.value = (e as Error).message }
  finally { loading.value = false }
}
```

- [ ] Criar `stores/appointments.ts`:
  - Estado: `items: Appointment[]`, `loading`, `error`
  - `fetchAll()`: GET `/api/appointments/all`
  - `fetchByStatus(status)`: GET `/api/appointments/status/{status}`, substitui `items`
  - `fetchByRange(start, end)`: GET `/api/appointments/range`, substitui `items`
  - `create(body)`: POST → `toast.success('Appointment created')` → retorna `true`; erro → `toast.error(msg da API)` → retorna `false`
  - `update(id, body)`: PUT → `toast.success('Appointment updated')` → retorna `true`; erro → `toast.error` → retorna `false`
  - `remove(id)`: DELETE → `toast.success('Appointment cancelled')` → retorna `true`; erro → `toast.error` → retorna `false`
  - `delayMany(idList, minutes)`: converte minutes para timeSpan `HH:MM:00`, POST → `toast.success` → retorna `true`
  - `cancelMany(idList)`: POST → `toast.success` → retorna `true`
  - Computed: `scheduled`, `ongoing`, `completed` (filtros por status), `todayItems` (scheduledFor no dia de hoje por UTC)
  - `subscribeRealtime()`: chama `signalr.onAppointmentsChanged(() => fetchAll())`; retorna função de unsubscribe

- [ ] Criar `stores/workers.ts`:
  - Estado: `items: Worker[]`, `loading`, `error`
  - `fetchAll()`, `create(body)`, `update(id, body)`, `remove(id)` — mesmo padrão
  - `subscribeRealtime()`: `signalr.onWorkersChanged(() => fetchAll())`

#### DoD — S2.1

- ✓ Testes unitários de store passando (ver S2.5)
- ✓ Nenhum `any` nos stores; todos os parâmetros e retornos tipados

---

### S2.2 — Página `/admin/appointments`

#### Tarefas

- [ ] `definePageMeta({ layout: 'admin', middleware: 'admin' })`
- [ ] `onMounted`: `fetchAll()` em appointments + workers + customers + services (para popular os selects); `subscribeRealtime()`; `onUnmounted` com a função de unsubscribe
- [ ] **Filtros client-side** (computed `filtered`):
  - Busca por texto: filtra `customerName`, `workerName`, `serviceName` com `toLowerCase().includes(q)`
  - Status: dropdown com opções All/Scheduled/OnGoing/Completed/Cancelled; usa `Number()` para comparar com `AppointmentStatus`
  - Worker: dropdown populado pelo store de workers; filtra por `workerId`
  - Range de datas: dois inputs `date`; filtra por `scheduledFor` entre `dateStart` e `dateEnd`
- [ ] **Tabela** com colunas: checkbox de seleção, Customer, Worker, Service, Scheduled (formato `MMM DD, HH:mm`), Status (`AppointmentsStatusBadge`), Ações (edit + cancel)
- [ ] **Skeleton**: renderiza 6 linhas com `UiSkeleton height="h-12"` enquanto `loading`
- [ ] **Estado vazio**: quando `filtered.length === 0` e `!loading`, exibe célula centralizada "No appointments found"
- [ ] **Seleção em lote**:
  - Checkbox no header seleciona/deseleciona todos os `filtered`
  - Barra de ações aparece (Transition) quando `selected.length > 0`
  - Barra exibe: "N selected", botão "Delay", botão "Cancel all"
- [ ] **Modal criação/edição**:
  - Campos: select Customer (populado pelo store), select Worker, select Service, `datetime-local`, select Status (só em edição), textarea Extra Details
  - Validação: todos os selects devem ter valor `> 0` antes de salvar
  - Botão Save: spinner + disabled durante `saving`
  - Em sucesso: fecha modal e `fetchAll()`
- [ ] **Modal delay em lote**: input number (5-480 min), botão confirmar chama `delayMany`
- [ ] **Modal de confirmação de cancelamento**: usa `UiConfirmDialog` com `dangerous=true`, texto "This will cancel {customerName}'s appointment with {workerName}"

**`components/appointments/StatusBadge.vue`**

- [ ] Props: `status: AppointmentStatus`
- [ ] Map: `Scheduled → badge-blue "Scheduled"`, `OnGoing → badge-yellow "On Going"`, `Completed → badge-green "Completed"`, `Cancelled → badge-gray "Cancelled"`, `Deleted → badge-red "Deleted"`

#### DoD — S2.2

- ✓ Tabela renderiza com dados reais da API
- ✓ Todos os filtros funcionam de forma combinada
- ✓ CRUD completo: criar, editar, cancelar um appointment via UI
- ✓ Batch delay: seleciona 2 appointments → delay → ambos têm `scheduledFor` acrescido
- ✓ Batch cancel: seleciona 2 → cancel → ambos com status `Cancelled`
- ✓ Skeleton visível durante carregamento inicial
- ✓ Testes E2E passando (ver S2.5)

---

### S2.3 — Página `/admin/workers`

#### Tarefas

- [ ] `definePageMeta({ layout: 'admin', middleware: 'admin' })`
- [ ] `onMounted`: `fetchAll()` + `subscribeRealtime()` do workers store + fetchAll do services store
- [ ] **Filtros**: busca por texto em `name`, `position`, `email`
- [ ] **Tabela** com colunas: Avatar (div com inicial do nome em gold), Nome, Posição, Telefone, Salário/h (formato `$XX.XX/h`), Serviços (tags usando `badge-gold` para cada serviço em `providedServices`), Ações
- [ ] **Serviços como tags**: se `providedServices.length > 3`, exibe as 3 primeiras + badge cinza `"+N"`
- [ ] **Modal criação/edição**:
  - Campos: Nome (required, min 10 chars), Email (required), Telefone, Endereço, Posição, Salário/h (required, > 0), Data de nascimento
  - **Multi-select de serviços**: lista de checkboxes com todos os serviços disponíveis; estado em `form.servicesId: number[]`
  - Validações client-side espelhando a API: nome mínimo 10 chars, salário > 0
- [ ] **Confirmação de exclusão**: `UiConfirmDialog` com "Remove {workerName} from the team?"

#### DoD — S2.3

- ✓ CRUD completo de workers via UI
- ✓ Tags de serviços visíveis na tabela
- ✓ Multi-select de serviços funciona no modal: serviços selecionados são enviados como `servicesId`
- ✓ Validações client-side bloqueiam submissão com nome < 10 chars ou salário ≤ 0
- ✓ Testes E2E passando (ver S2.5)

---

### S2.5 — Testes do Sprint 2

#### Unitários (Vitest) — `tests/unit/stores/`

**`appointments.store.spec.ts`**

- [T] `fetchAll()`: `items` recebe o array retornado pela API, `loading` é `false` ao final
- [T] `fetchAll()` com erro de rede: `error` é setado com mensagem, `loading` é `false`, `items` não é alterado
- [T] `create()` com sucesso: `toast.success` chamado, retorna `true`
- [T] `create()` com erro 400: `toast.error` chamado com mensagem da API, retorna `false`
- [T] `update()` com sucesso: `toast.success` chamado, retorna `true`
- [T] `remove()` com sucesso: `toast.success('Appointment cancelled')` chamado
- [T] `delayMany([1,2], 30)`: chama `api.appointments.delay` com `timeSpan = '00:30:00'`
- [T] `cancelMany([1,2])`: chama `api.appointments.cancel` com lista correta
- [T] Computed `scheduled`: retorna apenas items com `status === AppointmentStatus.Scheduled`
- [T] Computed `todayItems`: retorna apenas items cujo `scheduledFor` é hoje

**`workers.store.spec.ts`**

- [T] `fetchAll()`: `items` recebe o array, `loading` falso ao final
- [T] `create()` com sucesso: `toast.success('Worker created')`, retorna `true`
- [T] `create()` com erro: `toast.error`, retorna `false`
- [T] `remove()` com sucesso: `toast.success('Worker removed')`

#### Integração (Vitest + MSW) — `tests/integration/`

**`appointments.integration.spec.ts`**

> MSW intercepta `http://localhost:8080/*`

- [T] Montar página `/admin/appointments` → tabela exibe os items retornados pelo handler MSW
- [T] Clicar "New appointment" → preencher form → clicar Create → MSW retorna 201 → modal fecha → `toast.success` visível
- [T] MSW retorna 400 com body `"Email already exists"` → `toast.error` exibe a mensagem exata
- [T] Clicar cancel em appointment → confirmar → MSW retorna 204 → `toast.success` visível

#### E2E (Playwright) — `tests/e2e/appointments.spec.ts`

> Pré-condição: API rodando, admin logado (fixture de login)

- [T] **Criar appointment:** Clica "New appointment" → seleciona customer, worker, service → define data futura → clica Create → appointment aparece na tabela com status "Scheduled"
- [T] **Editar status:** Clica editar em appointment Scheduled → muda status para OnGoing → salva → badge muda para "On Going"
- [T] **Cancelar appointment:** Clica trash → modal confirma → confirma → status vira "Cancelled"
- [T] **Filtro por status:** Seleciona "Completed" no dropdown → tabela exibe somente appointments com badge "Completed"
- [T] **Filtro por texto:** Digita nome de customer existente → somente linhas com esse customer visíveis
- [T] **Delay em lote:** Seleciona 2 appointments → clica "Delay" → digita 60 → confirma → toast de sucesso visível
- [T] **Cancel em lote:** Seleciona 2 appointments Scheduled → "Cancel all" → ambos somem (ou status muda)

**`tests/e2e/workers.spec.ts`**

- [T] **Criar worker:** Preenche nome (≥ 10 chars), email, salário → seleciona 1 serviço → cria → worker aparece na tabela com tag do serviço
- [T] **Validação nome curto:** Digita nome com 5 chars → botão Create permanece bloqueado ou exibe erro
- [T] **Editar worker:** Clica editar → muda posição → salva → nova posição visível na tabela
- [T] **Excluir worker:** Clica trash → confirma → worker sumiu da tabela

#### DoD — Sprint 2 completo

- ✓ `npm run test:unit` — 100% passando
- ✓ `npm run test:integration` — 100% passando
- ✓ `npm run test:e2e` — todos os testes de appointments e workers passando
- ✓ `npm run build` — sem erros
- ✓ `npm run lint` — 0 erros

---

## Sprint 3 — Admin CRUD: Customers, Services, Users e Schedule

**Duração:** 1 semana  
**Objetivo:** Completar todos os módulos de gestão restantes.  
**Bloqueador de entrada:** DoD Sprint 2 satisfeito

---

### S3.1 — Stores Restantes

#### Tarefas

- [ ] `stores/customers.ts`: fetchAll, create, update, remove + subscribeRealtime
- [ ] `stores/services.ts`: fetchAll, create, update, remove + subscribeRealtime
- [ ] `stores/users.ts`: fetchAll, create, update, remove + subscribeRealtime; método extra `unlock(userId)` → POST `/api/auth/unlock/{userId}` → `toast.success('User unlocked')`
- [ ] `stores/schedule.ts`:
  - Estado: `schedules: BusinessSchedule[]`, `closures: WorkingHours[]`, `loading`
  - `fetchSchedule()`, `fetchClosures()`
  - `updateSchedule(id, body)` → PUT → `toast.success` → chama `fetchSchedule()`
  - `addClosure(body)` → POST → `toast.success` → chama `fetchClosures()`
  - `removeClosure(id)` → DELETE → `toast.success` → chama `fetchClosures()`
  - `checkIsOpen(dateTime: string): Promise<boolean>`

#### DoD — S3.1

- ✓ Testes unitários dos 4 stores passando

---

### S3.2 — Páginas de Customers e Services

#### Tarefas

**`/admin/customers`**

- [ ] Tabela: Nome, Email, Telefone, Data de nascimento (formatada `MMM DD, YYYY`), Ações
- [ ] Filtro: busca em nome e email
- [ ] Modal: Nome (required), Email, Telefone, Data de nascimento
- [ ] Validação: nome não pode ser vazio

**`/admin/services`**

- [ ] Tabela: Nome, Descrição (truncada a 60 chars), Duração (formato `Xmin`), Preço (formato `$X.XX`), Ações
- [ ] Filtro: busca em nome e descrição
- [ ] Modal: Nome (required, min 3 chars), Descrição, Duração (required, > 0, input number), Preço (required, > 0, input number step 0.01)
- [ ] Validações client-side: nome mínimo 3 chars, duração > 0, preço > 0

#### DoD — S3.2

- ✓ CRUD completo de customers e services via UI
- ✓ Validações bloqueiam submissão com dados inválidos
- ✓ Testes de integração e E2E passando

---

### S3.3 — Página `/admin/users`

#### Tarefas

- [ ] Tabela: Email, Role (badge: Admin=badge-gold, User=badge-blue, Client=badge-gray), Ativo (badge-green "Active" ou badge-red "Inactive"), Criado em, Lockout (se `lockoutEnd` > now, exibe "Locked until {data}" em vermelho), Ações
- [ ] Filtro: busca em email; filtro por role
- [ ] Modal criação: Email (required), Senha (required, min 8 chars), Role (select: Client/User/Admin), Ativo (toggle), Customer ID (opcional), Worker ID (opcional)
- [ ] Modal edição: mesmos campos exceto Senha (campo oculto em edição)
- [ ] **Botão "Unlock"**: visível somente quando `lockoutEnd && new Date(lockoutEnd) > new Date()` → chama `store.unlock(user.id)` → `toast.success`

#### DoD — S3.3

- ✓ CRUD completo de users
- ✓ Botão Unlock funciona e limpa o lockout
- ✓ Badge de Role correto por valor numérico
- ✓ Testes passando

---

### S3.4 — Página `/admin/schedule`

#### Tarefas

**Seção 1 — Horário semanal**

- [ ] Tabela com 7 linhas (Sunday a Saturday) ordenadas por `dayOfWeek`
- [ ] Cada linha: nome do dia (ex: "Monday"), toggle IsOpen, OpenTime (input time, disabled se !isOpen), CloseTime (input time), BreakStart (input time, opcional), BreakEnd (input time, opcional), botão Save que chama `updateSchedule(id, body)`
- [ ] Ao clicar Save: botão exibe spinner, chama store, re-habilita
- [ ] Quando `isOpen = false`: campos de horário ficam `opacity-50 pointer-events-none`
- [ ] Mapeamento de dia: `{ 0: 'Sunday', 1: 'Monday', ..., 6: 'Saturday' }`

**Seção 2 — Fechamentos excepcionais**

- [ ] Lista de closures: para cada item exibe ClosedFrom (data/hora), ClosedUntil ou "Until next opening", Reason, botão X para remover
- [ ] Botão "Add closure" abre modal:
  - `closedFrom`: input datetime-local (required)
  - `closureType`: radio/select "Until specific date" ou "Until next opening"
  - `closedUntil`: input datetime-local (visível e required somente se tipo = UntilSpecificDate)
  - `reason`: input text (required)
- [ ] Ao remover closure: `UiConfirmDialog` com "Remove this closure?"

#### DoD — S3.4

- ✓ Todos os 7 dias editáveis individualmente
- ✓ Toggle isOpen desabilita inputs de horário visualmente
- ✓ Closure adicionado aparece na lista
- ✓ Closure removido desaparece da lista
- ✓ Testes passando

---

### S3.5 — Testes do Sprint 3

#### Unitários

- [T] Todos os stores (customers, services, users, schedule) com os mesmos padrões do Sprint 2
- [T] `users.store.spec.ts — unlock()`: chama `api.auth.unlock(userId)`, `toast.success('User unlocked')`, retorna `true`
- [T] `schedule.store.spec.ts — checkIsOpen()`: retorna `true` quando API retorna `{ isOpen: true }`

#### E2E

**`customers.spec.ts`**: criar, editar, excluir customer  
**`services.spec.ts`**: criar com nome < 3 chars (bloqueado), criar válido, editar preço, excluir  
**`users.spec.ts`**: criar admin, ver badge "Admin", unlock de usuário bloqueado  
**`schedule.spec.ts`**: toggle Monday de aberto para fechado → Save → recarregar → Monday fechado; adicionar closure → aparece na lista; remover closure → desaparece

#### DoD — Sprint 3 completo

- ✓ `npm run test:unit` — 100% passando
- ✓ `npm run test:integration` — 100% passando
- ✓ `npm run test:e2e` — todos os módulos passando
- ✓ `npm run build` — sem erros
- ✓ `npm run lint` — 0 erros

---

## Sprint 4 — SignalR Tempo Real e Dashboard Admin

**Duração:** 1 semana  
**Objetivo:** Atualizações em tempo real funcionando em todos os módulos e dashboard com KPIs e gráficos.  
**Bloqueador de entrada:** DoD Sprint 3 satisfeito

---

### S4.1 — SignalR nos Stores

#### Tarefas

- [ ] Verificar que cada store tem `subscribeRealtime()` corretamente implementado com unsubscribe
- [ ] Verificar que cada página admin chama `subscribeRealtime()` no `onMounted` e o unsubscribe no `onUnmounted`
- [ ] Indicador visual no header do layout admin:
  - `isConnected = true`: `●` verde + texto "Live"
  - `isConnected = false`: `●` vermelho animado + texto "Reconnecting..."
- [ ] Ao reconectar (`onreconnected`): chamar `fetchAll()` em todos os stores ativos na página corrente

#### DoD — S4.1

- ✓ Testes de SignalR passando (ver S4.4)
- ✓ Indicador visual correto nos dois estados

---

### S4.2 — Dashboard `/admin`

#### Tarefas

- [ ] `definePageMeta({ layout: 'admin', middleware: 'admin' })`
- [ ] `onMounted`: fetch de appointments (all) + workers (all) + customers (all) + `checkIsOpen(new Date().toISOString())`
- [ ] Subscreve `onAppointmentsChanged`, `onWorkersChanged` para atualizar KPIs sem reload

**KPI Cards** (grid 2 colunas mobile, 3 colunas md, 5 colunas xl):

| Card | Dado | Cor do valor |
|---|---|---|
| Today | `todayItems.length` | gold-400 |
| Scheduled | `scheduled.length` | blue-400 |
| On Going | `ongoing.length` | yellow-400 |
| Workers | `workersStore.items.length` | emerald-400 |
| Customers | `customersStore.items.length` | violet-400 |

- [ ] Enquanto loading: cada card exibe `UiSkeleton height="h-8" class="w-10"`
- [ ] Badge "Shop Open" / "Shop Closed" no header do dashboard

**Gráfico: Appointments por status (últimos 7 dias)**

- [ ] Buscar dados: `GET /api/appointments/range?dateStart={7 dias atrás}&dateEnd={hoje}`
- [ ] Agrupar client-side por `status` e por dia: função pura `groupByDayAndStatus(appointments): Record<string, Record<AppointmentStatus, number>>`
- [ ] Renderizar com `vue-chartjs` usando `Bar` chart:
  - Labels: 7 dias no formato `"Mon 12"`
  - Datasets: um por status (Scheduled=azul, OnGoing=amarelo, Completed=verde, Cancelled=cinza)
  - `stacked: true`
  - Fundo: transparente; linhas de grid: `rgba(255,255,255,0.05)`
  - Tooltip: custom com cores matching dos badges

**Gráfico: Distribuição por serviço**

- [ ] Dados: agrupar `appointments.items` por `serviceName` e contar
- [ ] Renderizar com `vue-chartjs` usando `Doughnut` chart
- [ ] Cores: variações de gold e accent colors
- [ ] Legenda abaixo com nome + contagem

**Tabela "Today's appointments"**

- [ ] Filtra `todayItems`, ordena por `scheduledFor` ASC
- [ ] Colunas: Time (HH:mm), Customer, Worker, Service, Status
- [ ] Link "View all →" para `/admin/appointments`

**Tabela "Recent activity"**

- [ ] Exibe os 8 primeiros de `appointments.items` (ordenados por `createdAt` DESC)
- [ ] Colunas: Customer, Service, Date, Status

#### DoD — S4.2

- ✓ KPIs refletem dados reais
- ✓ Gráfico de barras renderiza com 7 barras corretamente agrupadas
- ✓ Gráfico donut renderiza com distribuição por serviço
- ✓ Testes unitários de `groupByDayAndStatus` passando
- ✓ Dashboard atualiza KPIs quando SignalR notifica mudança

---

### S4.4 — Testes do Sprint 4

#### Unitários

- [T] `groupByDayAndStatus(appointments)`: dado array com 3 appointments em dias diferentes com status diferentes, retorna objeto correto com contagens corretas por dia e status
- [T] `groupByService(appointments)`: dado array com appointments de 3 serviços, retorna `{ 'Haircut': 3, 'Beard Trim': 1, ... }`
- [T] Store: `subscribeRealtime()` chama `fetchAll()` quando o callback do SignalR é invocado
- [T] Store: a função retornada por `subscribeRealtime()` remove o listener quando chamada

#### Integração (SignalR)

- [T] Montar layout admin → verificar que `connect()` foi chamado 5 vezes (uma por hub)
- [T] Desmontar layout admin → verificar que `disconnectAll()` foi chamado

#### E2E (Playwright — 2 contextos/abas)

- [T] **Appointments — propagação:** contexto A cria appointment → contexto B (aberto em `/admin/appointments`) recebe atualização sem reload — tabela reflete novo item em até 3 segundos
- [T] **Workers — propagação:** contexto A cria worker → contexto B vê novo worker em `/admin/workers`
- [T] **Reconexão:** contexto único — desconecta (simula via `page.route` bloqueando o WebSocket) → indicador muda para vermelho → reconecta → indicador volta a verde → fetchAll executado

#### DoD — Sprint 4 completo

- ✓ `npm run test:unit` — 100%
- ✓ `npm run test:e2e` — propagação entre contextos passando
- ✓ Dashboard com gráficos visíveis e corretos
- ✓ `npm run build` — sem erros

---

## Sprint 5 — Portal do Cliente

**Duração:** 1 semana  
**Objetivo:** Landing page pública e fluxo de agendamento completo para clientes sem conta admin.  
**Bloqueador de entrada:** DoD Sprint 4 satisfeito

---

### S5.1 — Landing Page `/`

#### Tarefas

- [ ] `definePageMeta({ layout: 'default' })`
- [ ] **Seção Hero**:
  - Background: imagem de fundo escura com overlay gold sutil + textura noise
  - Título em `font-display` com gradient gold
  - Subtítulo em `font-body text-secondary`
  - Dois CTAs: "Book Now" (btn-primary → âncora para `#booking`) e "Our Services" (btn-outline → âncora para `#services`)

- [ ] **Componente `schedule/IsOpenBanner.vue`**:
  - Props: nenhuma
  - Chama `api.schedule.isOpen(new Date().toISOString())` no `onMounted`
  - Se aberto: badge verde "Open Now", texto com horário de fechamento do dia (busca schedule do dia)
  - Se fechado: badge vermelho "Closed", texto com próxima abertura
  - `setInterval` a cada 5 minutos para re-verificar
  - Limpa o interval no `onUnmounted`
  - Estado de loading: skeleton de 120x32px

- [ ] **Seção `#services`**:
  - Fetch de `GET /api/services/all` no `onMounted`
  - Grid de cards: 1 col mobile, 2 cols sm, 3 cols md
  - Cada card: nome em `font-display`, descrição truncada, duração em `font-mono`, preço formatado com `$`, botão "Book this service" → navega para `/book?serviceId={id}`

- [ ] **Seção `#team`**:
  - Fetch de `GET /api/workers/all`
  - Grid de cards: 1 col mobile, 2 cols sm, 3 cols lg
  - Cada card: avatar com inicial, nome, posição, lista de serviços (até 3 tags)

- [ ] **Navbar pública** (`components/layout/PublicNavbar.vue`):
  - Logo à esquerda
  - Links: Services, Team, Book
  - Botão "Admin" (btn-ghost) visível somente se `isLoggedIn` — navega para `/admin`
  - Sticky top-0 com backdrop-blur

#### DoD — S5.1

- ✓ Landing carrega em < 2s (rede local)
- ✓ `IsOpenBanner` exibe estado correto comparado com API
- ✓ Cards de serviços e workers renderizam com dados reais
- ✓ Links de navegação âncora funcionam
- ✓ Testes E2E da landing passando

---

### S5.2 — Fluxo de Agendamento `/book`

#### Tarefas

- [ ] `definePageMeta({ layout: 'default' })`
- [ ] Lê `route.query.serviceId` no `onMounted` para pré-selecionar serviço

**Componente `BookingStepper.vue`**

- [ ] Props: `currentStep: number` (1-3), `steps: string[]`
- [ ] Exibe barra de progresso horizontal com 3 etapas numeradas
- [ ] Etapa concluída: círculo verde com ícone check
- [ ] Etapa atual: círculo gold com número
- [ ] Etapa futura: círculo cinza com número

**Etapa 1 — Serviço**

- [ ] Fetch `GET /api/services/all`
- [ ] Grid de cards clicáveis; card selecionado: `border-gold-500 shadow-gold-glow`
- [ ] Botão "Continue" habilitado apenas se serviço selecionado

**Etapa 2 — Profissional e Horário**

- [ ] Fetch `GET /api/workers/by-service/{selectedServiceId}`
- [ ] Cards de workers; seleção com destaque visual
- [ ] Após selecionar worker: exibir calendar picker (input `date` estilizado, min = hoje)
- [ ] Após selecionar data: busca `GET /api/working-hours/schedule/{dayOfWeek}` do dia selecionado
- [ ] Se dia fechado ou schedule null: exibe "Closed on this day. Please select another date."
- [ ] Se dia aberto: gera slots de horário a cada 30 minutos entre `openTime` e `closeTime` excluindo `breakStart-breakEnd`
- [ ] Exibe grade de botões de horário; clique seleciona o slot
- [ ] Botão "Continue" habilitado somente se worker + data + horário selecionados

**Etapa 3 — Dados e Confirmação**

- [ ] Resumo do agendamento: service card (nome, duração, preço), worker (nome, posição), data e hora formatada
- [ ] Formulário do cliente: Nome (required), Email (required, formato email), Telefone
- [ ] Botão "Confirm Booking": `loading` durante operação
- [ ] Lógica ao confirmar:
  1. POST `/api/customers` com `{ name, email, phoneNumber }` → obtém `customerId`
  2. POST `/api/appointments` com `{ customerId, workerId, serviceId, scheduledFor: ISO string, status: 0 }`
  3. Em sucesso: navega para `/book/success?appointmentId={id}`
- [ ] Em erro: exibe `toast.error` com mensagem da API, permanece na etapa 3

**`pages/book/success.vue`**

- [ ] Lê `route.query.appointmentId`
- [ ] Exibe: ícone de check grande, "Booking Confirmed!", "Your appointment has been scheduled.", número do agendamento
- [ ] Botão "Book another" → `/book`
- [ ] Botão "Back to Home" → `/`

#### DoD — S5.2

- ✓ Fluxo completo de 3 etapas funciona contra API real
- ✓ `route.query.serviceId` pré-seleciona corretamente o serviço
- ✓ Slots de horário gerados corretamente (excluindo break e respeitando openTime/closeTime)
- ✓ Dia fechado exibe mensagem de indisponibilidade
- ✓ Appointment criado visível no painel admin após booking
- ✓ Testes E2E de booking passando

---

### S5.3 — Testes do Sprint 5

#### Unitários

- [T] `generateTimeSlots(openTime, closeTime, breakStart, breakEnd, intervalMinutes)`: dado `09:00/18:00/12:00/13:00/30`, retorna 18 slots corretos (9h a 11:30h + 13h a 17:30h)
- [T] `generateTimeSlots` sem break: dado `09:00/12:00/null/null/30`, retorna 6 slots
- [T] `IsOpenBanner`: quando `isOpen = true`, exibe texto "Open"; quando `false`, texto "Closed"
- [T] `BookingStepper`: com `currentStep=2`, etapa 1 exibe ícone check, etapa 2 destaque, etapa 3 cinza

#### E2E — `tests/e2e/booking.spec.ts`

- [T] **Fluxo completo:** Acessa `/book` → seleciona serviço → seleciona worker → seleciona data de amanhã (weekday) → seleciona primeiro slot → preenche nome/email → confirma → URL muda para `/book/success` → appointmentId visível
- [T] **Pré-seleção via query:** Acessa `/book?serviceId=1` → serviço com id 1 já selecionado na etapa 1
- [T] **Dia fechado:** Seleciona uma domingo (se fechado na API) → mensagem "Closed on this day" → botão Continue desabilitado
- [T] **Validação de dados:** Etapa 3 com email inválido → botão Confirm bloqueado ou erro de validação

#### DoD — Sprint 5 completo

- ✓ `npm run test:unit` — 100%
- ✓ `npm run test:e2e` — booking completo passando
- ✓ `npm run build` — sem erros

---

## Sprint 6 — PWA e Performance

**Duração:** 1 semana  
**Objetivo:** App instalável, score Lighthouse ≥ 90 em Performance, SEO e Acessibilidade.  
**Bloqueador de entrada:** DoD Sprint 5 satisfeito

---

### S6.1 — PWA

#### Tarefas

- [ ] Criar `public/manifest.json`:
  ```json
  {
    "name": "BarberShop",
    "short_name": "BarberShop",
    "description": "Premium barbershop management & booking",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0a0a0a",
    "theme_color": "#0a0a0a",
    "icons": [
      { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
      { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
    ]
  }
  ```
- [ ] Criar ícones `public/icon-192.png` e `public/icon-512.png` (logo "B" dourado em fundo escuro)
- [ ] Configurar `@vite-pwa/nuxt` em `nuxt.config.ts`:
  - `registerType: 'autoUpdate'`
  - Estratégia: `generateSW`
  - `workbox.runtimeCaching`:
    - Fonts Google: `CacheFirst`, maxAge 1 ano
    - Imagens: `CacheFirst`, maxEntries 50
    - API `/api/services/all`, `/api/workers/all`: `StaleWhileRevalidate`, maxAge 5 min
    - API `/api/working-hours/*`: `NetworkFirst`
  - `manifest`: apontar para o arquivo acima

- [ ] Componente `UiUpdatePrompt.vue`:
  - Usa `useRegisterSW` do `@vite-pwa/nuxt`
  - Quando `needRefresh` é true: exibe banner fixo no topo "New version available" com botão "Update"
  - Botão chama `updateServiceWorker()`

#### DoD — S6.1

- ✓ Chrome DevTools Application tab: service worker registrado, manifest válido
- ✓ Chrome em mobile: botão "Add to Home Screen" disponível
- ✓ `/api/services/all` e `/api/workers/all` servidas pelo service worker na segunda visita (network tab mostra "ServiceWorker")
- ✓ Teste Playwright: modo offline + acessa `/` → página carrega (assets do cache)

---

### S6.2 — Performance

#### Tarefas

- [ ] Todas as imagens com `loading="lazy"` e dimensões explícitas (`width` e `height`)
- [ ] Fontes com `font-display: swap` (já via Google Fonts parâmetro `display=swap`)
- [ ] Componentes pesados (gráficos) com `defineAsyncComponent(() => import('./HeavyChart.vue'))` + `<Suspense>` com skeleton fallback
- [ ] Dados estáticos (services, workers) fetchados com `useLazyFetch` e cache de 5 minutos na landing: `useLazyFetch('/api/services/all', { key: 'services', getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] })`
- [ ] Prefetch de `/admin` quando usuário está logado (link com `prefetch`)
- [ ] Remover console.logs de desenvolvimento (exceto `console.warn` para SignalR)
- [ ] Verificar bundle size: `nuxt build --analyze` e documentar tamanho de cada chunk

#### DoD — S6.2

- ✓ Lighthouse CI na `/`: Performance ≥ 90, Accessibility ≥ 85, SEO ≥ 90, Best Practices ≥ 90
- ✓ Lighthouse CI na `/book`: Performance ≥ 85
- ✓ FCP ≤ 1.8s, LCP ≤ 2.5s (medido pelo Lighthouse)
- ✓ Bundle principal (JS inicial) ≤ 300KB gzipped (verificado com `nuxt build --analyze`)

---

### S6.3 — Testes do Sprint 6

- [T] **Lighthouse CI (automatizado no pipeline):** Score ≥ 90 em `/` e ≥ 85 em `/book`
- [T] **PWA instalável:** Playwright abre Chrome headless → verifica `beforeinstallprompt` event disparado
- [T] **Offline `/`:** `page.setOffline(true)` → navega para `/` → título da página visível (HTML do cache)
- [T] **Service worker cache:** Primeira visita → desconecta rede → segunda visita → `/api/services/all` retorna do cache (verificado via `page.route` interceptando e verificando `fromServiceWorker`)

#### DoD — Sprint 6 completo

- ✓ Lighthouse CI verde no pipeline
- ✓ `npm run test:e2e` incluindo testes PWA passando
- ✓ `npm run build` sem erros e bundle dentro dos limites

---

## Sprint 7 — QA e Staging

**Duração:** 1 semana  
**Objetivo:** Validação completa em ambiente de staging. Zero bugs críticos. Acessibilidade e cross-browser aprovados.  
**Bloqueador de entrada:** DoD Sprint 6 satisfeito

---

### S7.1 — Ambiente de Staging

#### Tarefas

- [ ] Criar `docker-compose.staging.yml` com os serviços: `frontend` (build local), `api`, `sqlserver`, `redis`
- [ ] Criar `.env.staging` com variáveis apontando para staging (gitignored; documentar no README quais variáveis são necessárias)
- [ ] `frontend` no staging: `NUXT_PUBLIC_API_BASE=http://api:8080` (rede interna Docker), `NODE_ENV=production`
- [ ] Verificar que `sqlserver-init` roda e o seed está correto (usuário admin + schedules seedados)
- [ ] Comando de start: `docker compose -f docker-compose.staging.yml up -d`
- [ ] Verificar que `GET http://localhost:8080/health/detail` retorna todos os serviços healthy

#### DoD — S7.1

- ✓ Stack staging sobe com `docker compose up` sem erros
- ✓ `/health/detail` retorna status healthy para redis e sqlserver
- ✓ Login com `admin@barbershop.com` / `Admin@123` funciona no staging

---

### S7.2 — Testes de Regressão no Staging

#### Tarefas

- [ ] Re-executar todos os testes E2E com `BASE_URL=http://localhost:3001` (porta do frontend staging):
  ```bash
  BASE_URL=http://localhost:3001 npm run test:e2e
  ```
- [ ] Documentar qualquer falha: abrir issue com título `[STAGING] {descrição}`, steps to reproduce, expected vs actual

#### DoD — S7.2

- ✓ 100% dos testes E2E passando contra o staging
- ✓ Nenhuma issue aberta sem resolução

---

### S7.3 — Testes de Acessibilidade (a11y)

#### Tarefas

- [ ] Instalar e configurar `@axe-core/playwright`
- [ ] Criar `tests/e2e/a11y.spec.ts` com `checkA11y()` nas seguintes rotas:
  - `/login`
  - `/` (landing)
  - `/book` (todas as 3 etapas)
  - `/admin`
  - `/admin/appointments`
  - `/admin/workers`
  - `/admin/schedule`
- [ ] Corrigir todas as violações críticas (`critical`) e sérias (`serious`) reportadas pelo axe
- [ ] Verificações manuais adicionais:
  - [ ] Tab navegação: todos os botões e inputs acessíveis via teclado em ordem lógica
  - [ ] Modal: focus trap funciona (Tab dentro do modal não sai do modal)
  - [ ] Botões de ícone têm `aria-label` descritivo
  - [ ] Inputs de formulário têm `<label>` associado via `for`/`id` ou `aria-label`
  - [ ] Tabelas têm `<thead>` com `scope="col"`
  - [ ] Contraste: todas as combinações text/bg com ratio ≥ 4.5:1 (AA)

#### DoD — S7.3

- ✓ `axe-core` retorna 0 violações `critical` e 0 violações `serious` em todas as rotas testadas
- ✓ Checklist de acessibilidade manual 100% completo

---

### S7.4 — Testes Cross-Browser

#### Tarefas

- [ ] Configurar `playwright.config.ts` com projetos:
  ```typescript
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ]
  ```
- [ ] Executar o suite completo em todos os 5 projetos
- [ ] Corrigir incompatibilidades encontradas

#### DoD — S7.4

- ✓ 100% dos testes passando em: Chrome, Firefox, WebKit, Pixel 5 (Chrome mobile), iPhone 13 (Safari mobile)

---

### S7.5 — Testes de Responsividade

#### Tarefas

- [ ] Criar `tests/e2e/responsive.spec.ts` verificando:
  - `375px` (mobile): sidebar não visível; existe botão hamburger para abrir como drawer; tabelas têm scroll horizontal
  - `768px` (tablet): layout admin com sidebar colapsada por padrão; grid do dashboard 2 colunas
  - `1280px` (desktop): sidebar expandida; grid do dashboard 5 colunas
  - `1920px` (wide): sem overflow horizontal em nenhuma página

#### DoD — S7.5

- ✓ Testes de responsividade passando nas 4 larguras

---

### S7.6 — Checklist QA Manual

> Executar manualmente em staging com Chrome desktop e iPhone (ou emulação)

- [ ] Fluxo completo de agendamento (portal cliente) do início ao sucesso
- [ ] Login como Admin → navegar em todos os módulos → logout
- [ ] Login como Client (role=0) → tentar acessar `/admin` → redirecionado para `/`
- [ ] Fazer 5 tentativas de login com senha errada → mensagem de lockout na 6ª tentativa
- [ ] Admin faz unlock do usuário bloqueado → usuário consegue logar
- [ ] SignalR: abrir duas abas de `/admin/appointments` → criar appointment na aba A → aba B atualiza automaticamente
- [ ] PWA no mobile: Chrome abre banner "Add to Home Screen" → instalar → abrir como app standalone → funciona
- [ ] Página `/book` funciona offline (após primeira visita online)
- [ ] Todos os formulários com dados inválidos exibem erros antes de enviar
- [ ] Toast de sucesso aparece após cada operação de criação/edição/exclusão
- [ ] Toast de erro aparece quando API retorna erro (testar com campo inválido)
- [ ] Tema escuro consistente em todas as páginas (sem fundo branco ou texto ilegível)
- [ ] Gráficos do dashboard renderizam corretamente e têm tooltips funcionais

#### DoD — Sprint 7 completo

- ✓ Regressão E2E 100% no staging
- ✓ a11y: zero violações critical/serious
- ✓ Cross-browser: 5 browsers/dispositivos passando
- ✓ Checklist manual: todos os 13 itens marcados como OK
- ✓ Zero issues abertas com label `[STAGING]` sem resolução

---

## Sprint 8 — CI/CD e Produção

**Duração:** 1 semana  
**Objetivo:** Pipeline de CI/CD automatizado, Dockerfile otimizado, Nginx configurado e smoke tests em produção.  
**Bloqueador de entrada:** DoD Sprint 7 satisfeito

---

### S8.1 — Dockerfile e Docker Compose

#### Tarefas

- [ ] Criar `Dockerfile` multi-stage para o frontend:
  ```dockerfile
  FROM node:22-alpine AS build
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --frozen-lockfile
  COPY . .
  RUN npm run build

  FROM node:22-alpine AS runtime
  WORKDIR /app
  ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
  COPY --from=build /app/.output ./.output
  EXPOSE 3000
  HEALTHCHECK --interval=30s --timeout=10s --start-period=20s \
    CMD wget -qO- http://localhost:3000/ || exit 1
  CMD ["node", ".output/server/index.mjs"]
  ```

- [ ] Atualizar `docker-compose.yml` existente da API adicionando serviço `frontend` e `nginx`:
  ```yaml
  frontend:
    build:
      context: ./barbershop-frontend
      dockerfile: Dockerfile
    environment:
      - NUXT_PUBLIC_API_BASE=https://barbershop.com
      - NUXT_PUBLIC_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
    depends_on:
      api:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - api
  ```

- [ ] Criar `nginx/nginx.conf`:
  ```nginx
  upstream frontend { server frontend:3000; }
  upstream api      { server api:8080; }

  server {
    listen 80;
    server_name _;

    # Frontend
    location / {
      proxy_pass http://frontend;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API REST
    location /api {
      proxy_pass http://api;
      proxy_set_header Host $host;
    }

    # API – preflight metrics e health
    location /metrics { proxy_pass http://api; }
    location /health  { proxy_pass http://api; }

    # SignalR WebSockets
    location ~ ^/(appointmentsHub|workersHub|customersHub|servicesHub|usersHub) {
      proxy_pass http://api;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
      proxy_read_timeout 86400;
    }
  }
  ```

#### DoD — S8.1

- ✓ `docker build -t barbershop-frontend .` conclui sem erros
- ✓ `docker compose up` inicia todos os serviços (frontend, api, sqlserver, redis, nginx)
- ✓ `curl http://localhost/` retorna 200
- ✓ `curl http://localhost/api/working-hours/schedule` retorna 200
- ✓ WebSocket: `wscat -c ws://localhost/appointmentsHub` realiza handshake com sucesso

---

### S8.2 — CI/CD (GitHub Actions)

#### Tarefas

- [ ] Criar `.github/workflows/frontend-ci.yml`:

  ```yaml
  name: Frontend CI

  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main]

  jobs:
    lint:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '22', cache: 'npm' }
        - run: npm ci
        - run: npm run lint
        - run: npx tsc --noEmit

    unit-tests:
      runs-on: ubuntu-latest
      needs: lint
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '22', cache: 'npm' }
        - run: npm ci
        - run: npm run test:unit -- --reporter=verbose --coverage
        - uses: actions/upload-artifact@v4
          with: { name: unit-coverage, path: coverage/ }

    build:
      runs-on: ubuntu-latest
      needs: lint
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '22', cache: 'npm' }
        - run: npm ci
        - run: npm run build
          env:
            NUXT_PUBLIC_API_BASE: http://localhost:8080
            NUXT_PUBLIC_GOOGLE_CLIENT_ID: ''

    e2e:
      runs-on: ubuntu-latest
      needs: [unit-tests, build]
      services:
        api:
          image: eduardohanacleto/barbershop-api:1.0.0
          ports: ['8080:8080']
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '22', cache: 'npm' }
        - run: npm ci
        - run: npx playwright install --with-deps chromium
        - run: npm run build
        - run: npm run preview &
        - run: npx wait-on http://localhost:3000
        - run: npm run test:e2e
          env:
            BASE_URL: http://localhost:3000
            API_URL: http://localhost:8080
        - uses: actions/upload-artifact@v4
          if: failure()
          with: { name: playwright-report, path: playwright-report/ }

    lighthouse:
      runs-on: ubuntu-latest
      needs: build
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '22', cache: 'npm' }
        - run: npm ci && npm run build
        - run: npm run preview &
        - run: npx wait-on http://localhost:3000
        - run: npx lhci autorun
          env:
            LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

    deploy:
      runs-on: ubuntu-latest
      needs: [e2e, lighthouse]
      if: github.ref == 'refs/heads/main' && github.event_name == 'push'
      steps:
        - uses: actions/checkout@v4
        - name: Deploy to production
          run: echo "Deploy step — configurar conforme infraestrutura (SSH, Kubernetes, etc.)"
  ```

- [ ] Criar `.lighthouserc.json`:
  ```json
  {
    "ci": {
      "collect": { "url": ["http://localhost:3000/", "http://localhost:3000/book"] },
      "assert": {
        "assertions": {
          "categories:performance": ["error", { "minScore": 0.9 }],
          "categories:accessibility": ["error", { "minScore": 0.85 }],
          "categories:seo": ["error", { "minScore": 0.9 }],
          "categories:best-practices": ["error", { "minScore": 0.9 }]
        }
      }
    }
  }
  ```

- [ ] Configurar `package.json` scripts:
  ```json
  {
    "scripts": {
      "dev": "nuxt dev",
      "build": "nuxt build",
      "preview": "nuxt preview",
      "lint": "eslint .",
      "test:unit": "vitest run",
      "test:unit:watch": "vitest",
      "test:e2e": "playwright test",
      "test:e2e:ui": "playwright test --ui",
      "test:all": "npm run test:unit && npm run test:e2e"
    }
  }
  ```

#### DoD — S8.2

- ✓ Pipeline executa sem erros em PR de teste para `main`
- ✓ Job `lint` falha corretamente quando ESLint encontra erro
- ✓ Job `unit-tests` falha corretamente quando teste unitário falha
- ✓ Job `e2e` falha corretamente quando teste E2E falha
- ✓ Job `lighthouse` falha quando score < threshold
- ✓ Job `deploy` executa somente em push para `main` e somente se todos os anteriores passarem

---

### S8.3 — Smoke Tests de Produção

#### Tarefas

- [ ] Criar `tests/e2e/smoke.spec.ts` executado após cada deploy:

  ```typescript
  // Testa somente que a infra está em pé — não testa dados
  test('landing page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/BarberShop/)
    await expect(page.locator('nav')).toBeVisible()
  })

  test('API health is healthy', async ({ request }) => {
    const res = await request.get(`${process.env.API_URL}/health`)
    expect(res.status()).toBe(200)
  })

  test('login endpoint is reachable', async ({ request }) => {
    const res = await request.post(`${process.env.API_URL}/api/auth/login`, {
      data: { email: 'nonexistent@test.com', password: 'wrong' }
    })
    // 400 é esperado (credenciais erradas), mas confirma que a API está respondendo
    expect([400, 401]).toContain(res.status())
  })

  test('admin page requires auth', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('SignalR handshake succeeds', async ({ page }) => {
    // Navega para admin logado e verifica indicador verde
    await page.goto('/login')
    await page.fill('[type=email]', process.env.ADMIN_EMAIL!)
    await page.fill('[type=password]', process.env.ADMIN_PASSWORD!)
    await page.click('[type=submit]')
    await page.waitForURL('/admin')
    const indicator = page.locator('[data-testid="signalr-indicator"]')
    await expect(indicator).toHaveClass(/bg-emerald-400/, { timeout: 10000 })
  })
  ```

#### DoD — S8.3

- ✓ Smoke tests passando em produção após deploy
- ✓ Tempo de execução dos smoke tests < 2 minutos

---

### S8.4 — Monitoramento

#### Tarefas

- [ ] Adicionar `data-testid="signalr-indicator"` no elemento de status do SignalR no header admin (necessário para smoke test)
- [ ] Configurar Sentry (ou equivalente): instalar `@sentry/nuxt`, configurar `SENTRY_DSN` como variável de ambiente, capturar exceções não tratadas e erros de promise
- [ ] Adicionar `robots.txt` em `public/`:
  ```
  User-agent: *
  Allow: /
  Disallow: /admin
  ```
- [ ] Adicionar `sitemap.xml` estático com `/`, `/book`
- [ ] Documentar no `README.md`:
  - Como rodar em desenvolvimento (`npm run dev`)
  - Como rodar os testes (`npm run test:all`)
  - Como fazer build e preview (`npm run build && npm run preview`)
  - Como subir o stack completo (`docker compose up`)
  - Variáveis de ambiente necessárias (referência ao `.env.example`)

#### DoD — S8.4

- ✓ `robots.txt` acessível em `/robots.txt`
- ✓ Sentry configurado: erro de teste (`throw new Error('test')`) aparece no dashboard Sentry
- ✓ README completo e revisado

---

### DoD — Sprint 8 completo (= DoD de Produção)

- ✓ `docker compose up` inicia toda a stack sem erros
- ✓ Pipeline CI/CD verde em push para `main`
- ✓ Smoke tests passando em produção
- ✓ Lighthouse CI ≥ 90 Performance, ≥ 85 Accessibility, ≥ 90 SEO
- ✓ Sentry recebendo eventos
- ✓ README atualizado e completo
- ✓ Nenhuma issue aberta com label `[BUG]` sem resolução

---

## Sumário de Testes por Sprint

| Sprint | Unitários (Vitest) | Integração (Vitest + MSW) | E2E (Playwright) | Lighthouse |
|---|---|---|---|---|
| 1 | useApi, useAuth, useToast, middleware | — | auth (8 cenários) | — |
| 2 | appointments store, workers store | appointments CRUD | appointments (7), workers (4) | — |
| 3 | customers, services, users, schedule stores | — | customers, services, users, schedule | — |
| 4 | groupByDayAndStatus, SignalR subscription | SignalR connect/disconnect | propagação entre abas (3) | — |
| 5 | generateTimeSlots, IsOpenBanner, BookingStepper | — | booking completo (4) | — |
| 6 | — | — | PWA offline (2) | `/` ≥ 90, `/book` ≥ 85 |
| 7 | — | — | regressão completa, a11y, cross-browser, responsividade | re-execução |
| 8 | — | — | smoke tests produção (5) | re-execução em produção |

---

## Regras Globais de Qualidade

1. **Nenhum `any` explícito** em qualquer arquivo `.ts` ou `.vue` — ESLint bloqueia o merge
2. **Cobertura mínima de testes unitários:** 80% de branches em `composables/` e `stores/`
3. **Nenhum `console.log`** em código de produção — apenas `console.warn` e `console.error` permitidos
4. **Todos os inputs de formulário** têm `<label>` associado e atributo `autocomplete` adequado
5. **Nenhuma rota admin** sem `middleware: 'admin'` no `definePageMeta`
6. **Nenhum componente** com mais de 300 linhas — dividir em sub-componentes
7. **Toda chamada à API** tratada com try/catch e `toast.error` em caso de falha
8. **Nenhuma PR** mergeada com pipeline vermelha — sem exceções
