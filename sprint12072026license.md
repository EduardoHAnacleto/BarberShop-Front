# Sprint 12/07/26 — Licenciamento, Legal & Modelo de Aluguel (Opção A)

> Escopo: **BarberShop** (API ASP.NET Core 10) + **BarberShop-Front** (Nuxt 3).
> Origem: decisão do dono em 12/07/26 — manter o projeto público como portfólio **e** viabilizar
> aluguel de instâncias dedicadas por cliente (Opção A da análise de modelos: uma barbearia = um
> stack próprio com domínio/banco/segredos próprios; multi-tenant SaaS explicitamente fora de
> escopo até haver demanda que o justifique).
> Convenções: `[x]` concluído · `[ ]` pendente · Esforço: **P** (≤2h) / **M** (2-8h) / **G** (1-3 dias).
> Disciplina: mesma do Sprint070726 — TDD (teste primeiro, vermelho→verde), suítes completas +
> verificação ao vivo no stack Docker após cada item, writeup "Feito" por item neste arquivo.

---

## Princípio norteador

O demo público (repos + stack demo) permanece **byte-idêntico em comportamento** com os defaults —
todo mecanismo novo de white-label/hardening é opt-in por env/flag, com default igual ao valor
atual. "Portfólio para baixar e observar" e "instância de produção alugada" são o **mesmo código**
com configurações diferentes; o que muda entre eles é gerado pelo provisionamento (item 5).

---

## Itens

### 1. [x] UX: badges ilegíveis no tema claro (seção Team da home) — **P**
**Feito (12/07/26):** as 6 variants `.badge-*` em `assets/css/global.css` ganharam valores
por-tema — `:root` (light) com fundo tintado claro + texto escuro da mesma matiz (`gold-700`,
`emerald-700`, `blue-700`, `yellow-700`, `red-700`, `zinc-600`); `.dark` mantém **exatamente** os
valores dark-translúcidos originais. O sintoma reportado era o `badge-gray` dos chips de serviço,
mas o defeito era da classe inteira (usada em 9 arquivos: status de agendamento, worker portal,
tabelas admin, `IsOpenBanner`, `StatusBadge`) — todas corrigidas de uma vez.
**Verificado ao vivo (Playwright MCP, dark + light):** chips da seção Team legíveis nos dois
temas — dark visualmente idêntico ao original; light com texto escuro sobre fundo claro,
totalmente legível (o bug reportado). `vitest` 181/181, `vue-tsc`/`eslint` limpos.

**Bug incidental encontrado e corrigido (fora do escopo do item, achado ao verificar ao vivo):**
ao limpar dados de teste da seção Team, `DELETE /api/workers/{id}` retornava **400** ("existing
appointments, reviews, or other linked records") para workers de teste **sem nenhum** agendamento/
review/waitlist/schedule — só com atribuições de serviço. Causa: `WorkersService.Delete` não
carregava nem limpava `ProvidedServices` antes do delete, e a tabela de junção `WorkersService`
não tem cascade no banco → SQL Server vetava a exclusão mesmo sem histórico real (o `catch`
genérico do fix de FK do Sprint070726 mascarava isso como "linked records"). Corrigido: `Delete`
agora carrega `ProvidedServices` (`GetByIdAsync(id, w => w.ProvidedServices)`) e faz `.Clear()`
antes de excluir — atribuições de serviço são configuração, não histórico que deva bloquear.
Testes: +1 via TDD (`Delete_ClearsServiceAssignmentsBeforeDeleting`, vermelho→verde) — backend
**316**. **Verificado ao vivo:** os 8 workers de teste ("John Doe Barber", sem histórico) que antes
davam 400 agora excluem com **204**, restando só os 4 workers do seed.
**Sintoma reportado:** na seção *Team* da home (`/#team`, link "Team" do navbar), os chips de
serviço de cada card de funcionário ficam com fundo cinza e texto escuro/apagado no tema claro —
ilegíveis.
**Causa raiz:** as 6 variants `.badge-*` em `assets/css/global.css` (`gray`, `green`, `blue`,
`yellow`, `red`, `gold`) têm fundo escuro translúcido + texto claro **fixos**, herdados da era
dark-only (mesma família do bug nº 3 do item 4.5 do Sprint070726 — valores que o tema único
sempre escondeu). O sintoma reportado é o `badge-gray` do chip de serviço, mas a classe inteira
de defeito afeta todos os variants — usados em 9 arquivos (status de agendamento em `/my`,
worker portal, tabelas do admin, `IsOpenBanner`, `StatusBadge`).
**Fix:** valores por tema — `:root` ganha versões claras (fundo tintado claro + texto escuro da
mesma matiz), `.dark` recebe **exatamente os valores atuais** (dark permanece byte-idêntico).
**TDD/Verificação:** screenshots Playwright MCP (dark + light) de `/#team` e de uma superfície
com badges de status (`/my` ou admin) antes/depois; `npx vitest run` + `eslint`/`vue-tsc` limpos.
**DoD:** chips legíveis no claro; dark sem nenhuma mudança visual; nenhum uso de badge quebrado.

### 2. [x] LICENSE "todos os direitos reservados" (source-available) — **P**
**Feito (12/07/26):** `LICENSE` idêntico nos dois repos — copyright integral do dono; grant
explícito de ver/clonar/buildar/rodar localmente para avaliação, estudo e portfolio review;
proibição de uso comercial/produção/redistribuição/derivadas sem contrato escrito; cláusula de
contribuições (PR cede licença ao dono); AS-IS/sem garantia; rescisão por violação; contato
comercial (`eduardohanacleto@gmail.com`, o e-mail público do README). `package.json` ganhou
`"license": "SEE LICENSE IN LICENSE"`; os dois `README.md` ganharam a seção "📜 License"
(portfólio livre para avaliar; produção somente como instância alugada/gerenciada sob contrato).
**O quê:** arquivo `LICENSE` na raiz dos **dois** repos com licença proprietária source-available:
copyright do dono; permissão explícita de **ver/clonar/executar localmente para avaliação e
estudo** (o objetivo de portfólio); proibição de uso comercial/produção, redistribuição e obras
derivadas sem contrato escrito; contato para licenciamento/aluguel. Hoje nenhum repo tem LICENSE
(= copyright implícito, mas sem a permissão de avaliação explícita nem o convite comercial).
**Também:** `"license": "SEE LICENSE IN LICENSE"` no `package.json` (front); seção "License" nos
dois `README.md` resumindo o modelo (portfólio livre para avaliar; produção somente sob contrato).
**TDD/Verificação:** n/a (artefato textual) — conferência de presença/consistência nos 2 repos.
**DoD:** LICENSE presente e idêntico em intenção nos 2 repos; READMEs e package.json referenciam.
**Nota:** o texto é um template técnico, não aconselhamento jurídico — revisão por advogado
recomendada antes do primeiro contrato assinado.

### 3. [x] Privacy Policy + Terms of Service — **M**
**Feito (12/07/26):** `pages/privacy.vue` + `pages/terms.vue` (layout default, SSR, título por
página via `useHead`), conteúdo 100% via i18n — namespace `legal` com 36 chaves novas em cada
locale (paridade re-verificada por script: 183/183, zero divergência de placeholders). Conteúdo
cobre exatamente o que a aplicação faz: dados coletados (nome/e-mail/telefone/nascimento
opcional/histórico/avaliações), cookies reais (`bs_token` sessão-ou-longo com "Remember me",
idioma, tema), finalidades (agenda, lembretes, waitlist), papéis LGPDs no modelo de aluguel
(barbearia=controladora, operador=operador), direitos do titular com contato via
`shopEmail`/`shopName` do runtime config (white-label-ready), aviso de ambiente demo ("as is",
dados podem ser resetados) e cláusula de precedência do contrato nas instâncias alugadas.
**Links nos 3 pontos de coleta:** footer da home (junto ao copyright), aviso de consentimento no
`register.vue` e no `StepConfirm.vue` do booking (visitante anônimo entregando dados) — todos com
`useLocalePath()` para preservar o locale ativo. **Verificado ao vivo:** curl SSR das 4 URLs
(`/privacy`, `/pt-BR/privacy`, `/terms`, `/pt-BR/terms`) → 200 com `<h1>` correto em cada idioma;
E2E novo `tests/e2e/legal.spec.ts` (6 specs: render en/pt das duas páginas, links do footer,
consentimento do register) — **6/6 verdes** contra o stack Docker.
**O quê:** páginas públicas `/privacy` e `/terms` (SSR, indexáveis, mesmo layout default),
conteúdo bilíngue **en/pt-BR** via i18n (mantendo a paridade 100% de chaves), redigido para o
contexto real da aplicação e LGPD-aware:
- *Privacy:* quais dados são coletados (nome, e-mail, telefone, data de nascimento opcional,
  histórico de agendamentos, avaliações), finalidade (operação da agenda, lembretes por e-mail,
  waitlist), cookies usados (`bs_token` sessão/30d, `i18n_redirected`, preferência de tema),
  papéis LGPD no modelo de aluguel (barbearia = controladora; operador da plataforma = operador),
  direitos do titular e canal de contato (e-mail do runtime config), retenção e exclusão.
- *Terms:* natureza do serviço (agendamento), contas e responsabilidades, cancelamento/no-show,
  disponibilidade "as is" para o demo, e cláusula de que instâncias alugadas são regidas pelo
  contrato de prestação de serviço específico (o contrato prevalece sobre os termos genéricos).
**Links:** footer da home (junto ao copyright), página de registro ("ao criar conta você
concorda...") e passo de confirmação do booking (onde visitante anônimo entrega nome/e-mail/
telefone — o ponto de coleta LGPD-relevante).
**TDD:** E2E novo (`legal.spec.ts` ou seção no sprint spec): as 2 páginas respondem 200 com o
heading correto em **ambos** os locales (`/privacy`, `/pt-BR/privacy`, ...), e os 3 pontos de
link navegam para elas; axe-core sem violações novas nas páginas.
**DoD:** SSR retorna o conteúdo real (view-source), paridade i18n mantida (script de auditoria),
suítes verdes. Mesma nota do item 2: template técnico, não aconselhamento jurídico.

### 4. [x] White-label por instância — **M**
**Feito (12/07/26):** novo composable `useShopIdentity()` (TDD: 3 specs vermelho→verde em
`tests/unit/composables/useShopIdentity.spec.ts` — nome do runtime config, fallback "BarberShop",
monograma derivado/uppercase) consumido por 8 superfícies: `PublicNavbar`, `AdminSidebar`,
monogramas "B" de `login`/`staff-login`/`register`/`about` (o de about não estava no inventário
original — achado ao aplicar), título da aba via `app.vue`, e copy do calendário em
`book/success.vue`. As 4 chaves i18n com a marca viraram interpolação `{shop}`
(`footer.copyright`, `about.storyParagraph1`, `bookingSuccess.calendarTitle`/`Description`) —
"Premium Barbershop" (hero) mantido deliberadamente: é copy genérico de marketing, não o nome da
marca. Build-args novos no `Dockerfile`/compose (`NUXT_PUBLIC_SHOP_NAME`, `DEFAULT_LOCALE`) +
envs de runtime no serviço frontend; routeRules ganharam os gêmeos `/en/{admin,worker,my}/**`
(quando `DEFAULT_LOCALE=pt-BR`, é o inglês que ganha prefixo).
**Descoberta de mecanismo (verificada empiricamente):** env `NUXT_PUBLIC_*` em build time **não**
assa valores no `runtimeConfig` (só a leitura direta de `process.env` no `nuxt.config.ts` — caso
do manifest PWA e do `defaultLocale`); a identidade via `runtimeConfig` é sobrescrita em
**runtime** — por isso o compose passa `NUXT_PUBLIC_SHOP_NAME` também como environment (nome novo
sem rebuild). O build-arg `NUXT_PUBLIC_API_BASE` pré-existente tem a mesma característica
(placebo para runtimeConfig — o valor efetivo do demo sempre foi o default `''` relativo).
**Verificado ao vivo (imagem de prova descartável, `SHOP_NAME="Navalha de Ouro"` +
`DEFAULT_LOCALE=pt-BR`):** `/` responde `lang="pt-BR"` com "Barbearia Premium" **sem prefixo**,
`/en` responde o inglês prefixado, manifest PWA `"name":"Navalha de Ouro"`; com o env de runtime,
navbar/monograma "N"/título/copyright todos "Navalha de Ouro". Demo com defaults: byte-idêntico
("BarberShop" na navbar/título, copyright interpolado corretamente, 4 hreflang intactos).
**O quê:** remover a marca "BarberShop" hardcoded, tornando-a configurável por instância sem
tocar no código. Inventário atual (auditoria 12/07): `PublicNavbar` (1), `AdminSidebar` (2),
monograma "B" em login/staff-login/navbar/sidebar, 4 chaves i18n em cada locale
(`footer.copyright`, `about.storyParagraph1`, `bookingSuccess.calendarTitle`/`calendarDescription`),
`nuxt.config.ts` (title, meta description, PWA manifest name/short_name) e `public/manifest.json`.
**Como:**
- `runtimeConfig.public.shopName` (default `"BarberShop"`, override `NUXT_PUBLIC_SHOP_NAME`) —
  consumido por navbar/sidebar/monograma (primeira letra derivada) e passado por interpolação
  `{shop}` às chaves i18n acima (as strings dos locales passam a usar `{shop}`).
- `useHead` com título derivado do runtime config (título de aba por instância sem rebuild).
- Manifest/meta build-time: `SHOP_NAME` como build-arg do serviço `frontend` no compose (o front
  **já é buildado por instância** — `build: context: .` — então build-args funcionam no modelo de
  aluguel; a imagem demo continua com os defaults).
- `DEFAULT_LOCALE` como build-arg (barbearia BR quer pt-BR sem prefixo; demo continua `en`) —
  lido no bloco i18n do `nuxt.config.ts` em build time (estratégia de rotas é build-time por
  natureza).
**TDD:** unit test do `PublicNavbar` exibindo o nome vindo do runtime config (mock); paridade
i18n re-verificada; build local com `NUXT_PUBLIC_SHOP_NAME` custom + curl comprovando o nome
trocado no HTML SSR; build default comprovando demo idêntico.
**DoD:** zero "BarberShop" hardcoded fora de defaults de config/locales-com-interpolação; demo
ao vivo inalterado com defaults; suítes verdes.

### 5. [x] Provisionamento de instância de cliente — **M**
**Feito (12/07/26):** `deploy/new-client.ps1` gera o pacote completo em `deploy/clients/<slug>/`:
`.env` (segredos únicos por execução via RNG criptográfico — `JWT_KEY` base64 88 chars,
`SA_PASSWORD` 24 chars com as 4 classes garantidas e charset sem `$;'"` que quebraria
compose/connection-string/bash), `docker-compose.client.yml` (hardening do item 6 +
`Shop__TimeZone` + CORS/Frontend__BaseUrl no domínio + SMTP real com fallback de log + serviço
Caddy TLS com `!override` zerando as portas do nginx — requer compose ≥2.24, anotado),
`Caddyfile` (HTTPS automático Let's Encrypt) e `README-DEPLOY.md` (runbook: primeiro deploy com
`--profile client`, troca imediata da senha admin seed, atualização, backup/restore).
`deploy/clients/` adicionado ao `.gitignore` — pacotes gerados carregam segredos reais.
**Testado:** duas execuções → segredos distintos entre si e com comprimento/charset corretos;
domínio inválido e SMTP parcial rejeitados com mensagem clara; pacote gerado colocado no layout
real e validado com `docker compose --env-file ... -f ... -f ... --profile client config` →
exit 0, com `Swagger__Enabled=false`/`HealthChecks__DetailEnabled=false`/`Shop__TimeZone`
presentes no serviço api e os serviços `caddy`/`db-backup` resolvidos. **Limitação anotada
(prevista no plano):** emissão real de certificado só é verificável com domínio público
apontando para o host — template validado sintaticamente.
**O quê:** `deploy/new-client.ps1` (PowerShell; host de referência é Windows) que gera o pacote
de uma instância nova a partir de parâmetros: nome da barbearia, domínio, timezone IANA/Windows,
locale default, SMTP (host/porta/usuário/senha/from), e-mail de contato.
- Gera `.env` da instância com **segredos únicos por execução**: `JWT_KEY` (≥64 chars aleatórios
  criptográficos), `SA_PASSWORD` forte, senha Redis opcional — nunca os valores demo do repo.
- Seta os hardening flags do item 6 (`Swagger__Enabled=false`, health detail off).
- Emite `docker-compose.client.yml` (override: build-args de white-label, envs de runtime,
  restart policies) + template TLS (Caddyfile reverse-proxy com HTTPS automático na frente do
  nginx do stack) + `README-DEPLOY.md` da instância (passo a passo, incl. backup/restore do
  item 7).
**TDD:** execução do script em diretório temporário validando: segredos diferentes entre duas
execuções, campos obrigatórios validados (falha clara se domínio/SMTP ausentes),
`docker compose -f ... config -q` passa com o pacote gerado.
**DoD:** pacote gerado sobe um stack local funcional (smoke: `/` responde com o nome da
barbearia, Swagger off); emissão real de certificado TLS só é verificável com domínio público —
**limitação anotada**, template validado sintaticamente.

### 6. [x] Hardening flags por instância (API) — **P**
**Feito (12/07/26):** `HealthChecks:DetailEnabled` (default `true` em `appsettings.json` —
portfólio inalterado) condiciona o mapeamento de `/health/detail` no `Program.cs`; o `/health`
simples continua incondicional (healthcheck do container depende dele). `Swagger:Enabled` já
existia (2.3) — ambos entram desligados no `.env`/override gerados pelo item 5.
**Desvio consciente do plano:** o teste prometido era xUnit, mas o `Program.cs` conecta o Redis
eagerly no startup (`ConnectionMultiplexer.Connect`) e o projeto não tem infraestrutura de teste
de integração (`WebApplicationFactory`) — os 315 testes são unitários puros. Criar essa infra só
para um flag seria um projeto próprio; em vez disso, verificação ao vivo **nos dois estados**
(mesmo padrão aceito no item 3.2 do Sprint070726): demo com default → `/health/detail` **200**;
container descartável da mesma imagem com `HealthChecks__DetailEnabled=false` →
`/health/detail` **404** com `/health` **200**. Build da solução limpo; 315/315 verdes.
**O quê:** os pontos "conscientemente abertos para portfólio" viram flags com default portfólio:
- `Swagger:Enabled` já existe ✓ (2.3) — só entra no provisionamento.
- **Novo:** `HealthChecks:DetailEnabled` (default `true`) — com `false`, `/health/detail`
  responde 404 (o `/health` simples continua público para o healthcheck do container).
**TDD:** teste(s) xUnit vermelho→verde do comportamento da flag nos dois estados.
**DoD:** demo inalterado (flag default on, verificado ao vivo); suíte backend verde; flag
documentada no provisionamento (item 5).

### 7. [x] Backup automatizado do banco — **P/M**
**Feito (12/07/26):** serviço `db-backup` no compose sob `profiles: ["client"]` (não sobe no demo
por default) — loop `BACKUP DATABASE` → `RESTORE VERIFYONLY` → poda de retenção → sleep, com
intervalo (`BACKUP_INTERVAL_MINUTES`, default diário) e retenção (`BACKUP_RETENTION`, default 14)
configuráveis; volume `sqlserver_backups` compartilhado com o serviço `sqlserver` (o `BACKUP`
escreve no filesystem do **servidor**, não do sidecar). Sem `WITH COMPRESSION` (não suportado na
edição Express do stack).
**Dois bugs reais encontrados no teste ao vivo da primeira versão** (a "verificação" passava
falsamente): (1) `sqlcmd` **sem `-b` retorna exit 0 mesmo quando o T-SQL falha** — a cadeia `&&`
imprimia "backup verified" com o backup falhando; (2) o backup falhava de verdade: volume nomeado
nasce `root:root` e o mssql roda como uid 10001 → `Operating system error 5 (Access is denied)`.
Corrigidos: `-b` em todos os sqlcmd (a cadeia agora é veraz) e `user: root` **só no sidecar** com
`chown 10001:10001 /backups` no arranque. **Verificado ao vivo (intervalo 1 min, retenção 2):**
4 ciclos → `.bak` real de 5,8 MB no volume, `The backup set on file 1 is valid` (VERIFYONLY) em
cada ciclo, e exatamente os **2** arquivos mais novos mantidos (poda funcionando). Sidecar de
teste removido; demo segue sem o serviço (profile off) — só ganhou o mount vazio de `/backups`
no sqlserver, inerte.
**O quê:** serviço `db-backup` no compose sob `profiles: ["client"]` (não sobe no demo por
default): container leve com `sqlcmd` executando `BACKUP DATABASE` agendado (loop com intervalo
configurável, default diário) para um volume dedicado, com retenção configurável (default 14
backups). Doc de restore no `README-DEPLOY.md` do item 5.
**TDD/Verificação:** rodar o serviço uma vez contra o demo ao vivo (profile ativado
manualmente), confirmar `.bak` gerado e íntegro via `RESTORE VERIFYONLY`; restore completo num
banco descartável dentro do próprio container SQL (mesmo padrão de verificação usado no item
3.3 do Sprint070726), depois descartar o banco e o serviço de teste.
**DoD:** `.bak` verificado; demo sem serviço novo rodando por default; retenção funciona (arquivo
mais antigo removido além do limite).

---

## Ordem de execução

| # | Item | Motivo |
|---|------|--------|
| 1 | 1 (badges) | Bug de UX reportado pelo dono — visível a qualquer visitante do portfólio |
| 2 | 2 (LICENSE) | Pré-requisito legal de tudo — define o que o público pode fazer com o código |
| 3 | 3 (Privacy/ToS) | Depende só do i18n existente; páginas públicas novas |
| 4 | 4 (white-label) | Base para o provisionamento fazer sentido |
| 5 | 6 (hardening) | Pequeno, backend-only, destrava o item 5 completo |
| 6 | 5 (provisionamento) | Consome 4 + 6 |
| 7 | 7 (backup) | Fecha o pacote de instância |

## Correções avulsas pós-sprint (reportadas pelo dono, 13/07/26)

- **Link "My Schedule" (/worker) sumido da navbar para o worker.** Reportado: depois de sair da
  página `/worker`, o barbeiro não tinha como voltar. Causa: `PublicNavbar` decidia se mostrava o
  link buscando o perfil via `api.users.byId(uid)` → `GET /users/{id}`, que é **Admin-only** (403
  para um worker); o `catch` zerava `isWorker` e o link nunca aparecia. O item 1.1 do Sprint070726
  migrou os portais de `byId`→`me`, mas esta navbar ficou para trás. Corrigido para `api.users.me()`
  (self-service, gate em `isLoggedIn`). Teste: `tests/integration/publicNavbar.integration.spec.ts`
  (4, TDD — worker vê o link, resolve via `me` e não `byId`, client/deslogado não veem). Verificado
  ao vivo: logado como `james.carter`, o link "My Schedule" aparece na home e navega para `/worker`.
- **Hydration mismatch na seção de auth da navbar** (achado ao verificar o fix acima). O
  `useAuth` só re-hidrata o token do cookie no cliente (`import.meta.client`, `useAuth.ts:87`), então
  o SSR renderizava a navbar como visitante e o cliente re-renderizava logado — o Vue reusava o
  `<a>` do "Register" e trocava só o texto, deixando **"My Account" com href preso em `/register`**
  (navegava para a página errada). Corrigido envolvendo a seção auth-dependente da navbar em
  `<ClientOnly>` (padrão idiomático do Nuxt para chrome que depende de estado de auth client-side;
  fix contido, sem mexer no SSR global de auth — evita reescrita de cookie no servidor a cada render
  e redirect-em-SSR de token expirado). Trade-off anotado: um flash breve dos links de auth no load
  de páginas públicas. Verificado ao vivo: "My Account" → `/my`, "My Schedule" → `/worker`, e o erro
  `Hydration completed but contains mismatches` desapareceu do console. Vitest **185**.
- **`/worker` ("My Schedule") não atualizava sozinha via SignalR quando um cliente agendava.**
  Reportado pelo dono. Diferente do dashboard admin e do `book/index` (que assinam o hub), a página
  `worker.vue` só carregava os agendamentos uma vez no `onMounted` e **nunca assinava** o SignalR —
  não chamava `useSignalR()` nem `onAppointmentsChanged`. O backend já emite `AppointmentsChanged`
  em todo mutation de agendamento (`Create`/`Update`/`ChangeStatus`/`Delete`/`Cancel`/`Delay`/
  `CreateRecurring` — confirmado em `AppointmentsService`), então a lacuna era puramente no front.
  Corrigido: `worker.vue` resolve o `workerId` uma vez, extrai `loadAppointments()` (refetch
  silencioso, sem skeleton, para não piscar a página) e assina `onAppointmentsChanged(loadAppointments)`
  no `onMounted`, com `onUnmounted(() => unsubscribe?.())` — mesmo padrão do `book/index.vue`.
  Testes: `tests/integration/workerSchedule.integration.spec.ts` (3, TDD — assina no mount, refaz o
  fetch quando o hub dispara, cancela a assinatura no unmount). **Verificado ao vivo, ponta a ponta:**
  logado como `james.carter` em `/worker` (Upcoming=1), um `POST /api/appointments` para esse worker
  feito por fora → a lista subiu para **Upcoming=2 sozinha, sem reload**, mostrando o novo card
  (Haircut, 23/07 09:00); ao deletar o agendamento de teste, voltou a Upcoming=1 automaticamente.
  Dado de teste removido do banco + Redis flush. Vitest **188**.
- **Dashboard admin: "Revenue (30d)" e os rankings de top-serviços/workers não atualizavam quando
  um agendamento era completado.** Reportado pelo dono. Causa: ao contrário dos cards de contagem
  (Today/Scheduled/On Going), que são `computed` sobre o `appointmentsStore` — e este já assina o
  hub via `subscribeRealtime()` — o painel de analytics (`reports`, vindo de
  `GET /api/reports/summary`) é estado local da própria página, carregado **uma única vez** no
  `onMounted` (`pages/admin/index.vue`) e nunca mais. Como o backend calcula receita somando o
  preço do serviço de todo agendamento `Completed` (`ReportsService.GetSummaryAsync`), marcar um
  agendamento como concluído mudava o número no servidor, mas o dashboard só refletia o valor do
  carregamento inicial até um reload manual da página. Corrigido: extraída `refreshReports()`
  (mesmo `try/catch` best-effort de antes) e assinado `onAppointmentsChanged(refreshReports)` no
  `onMounted`, com `unsubReports?.()` no `onUnmounted` — a página passa a ter sua própria assinatura
  ao hub de agendamentos, independente da do store, já que "revenue" não é um dado que qualquer
  store hoje possui. Teste: `tests/integration/adminDashboard.integration.spec.ts` (2, TDD — carrega
  o resumo no mount, refaz o fetch quando o hub dispara). **Verificado ao vivo, ponta a ponta:**
  logado como admin em `/admin` (Revenue 30d = $681.00), criado um agendamento por fora e marcado
  `PATCH .../status` → `Completed` (Haircut, $35) sem tocar no browser → o card **subiu sozinho para
  $716.00** e "Top services by revenue" refletiu o novo total do Haircut, sem reload. Agendamento de
  teste removido (hard-delete via SQL, já que a API rejeita cancelar um agendamento `Completed` —
  "Completed cannot be cancelled", comportamento correto e não alterado) + Redis flush; dashboard
  recarregado confirmou o valor original ($681.00) restaurado. Vitest **190**.

## Bugs incidentais corrigidos (achados ao verificar, fora do escopo dos itens)

- **SSR da home servia empty-state permanente para serviços/equipe.** `pages/index.vue` usava
  `useLazyFetch` contra o `apiBase` relativo do cliente — que não resolve no Node durante o SSR
  (sem origem de browser); o fetch falhava silenciosamente e o `getCachedData` re-servia o payload
  vazio ao cliente. As seções "Our Services" e "Meet the Team" ficavam vazias mesmo com a API
  cheia. Corrigido usando `apiBaseInternal` (DNS interno do Docker) no ramo `import.meta.server`,
  mesmo padrão do `useApi()` (Sprint070726 §4.8); `$development` do `nuxt.config.ts` ganhou o
  `apiBaseInternal` apontando pro localhost pra não quebrar `nuxt dev`. Verificado ao vivo: o HTML
  SSR agora inclui os serviços/workers reais no primeiro byte.
- **`DELETE /api/workers/{id}` recusava workers sem histórico** (ver item 1 — atribuições de
  serviço não eram limpas antes do delete).

## DoD global da sprint

- Suítes completas verdes após cada item: backend xUnit + frontend Vitest + `vue-tsc` + `eslint`.
- Imagens rebuildadas e **demo ao vivo verificado sem mudança de comportamento** com defaults
  (smoke E2E + curls de SSR/locale/tema).
- Paridade i18n 100% mantida (script de auditoria da sessão de 12/07).
- Cada item concluído ganha writeup "Feito" neste arquivo (o quê, bugs achados no caminho,
  verificação ao vivo, testes adicionados) — mesmo padrão do Sprint070726.md.
- Nada commitado sem pedido explícito do dono.

## Fora de escopo (decidido)

- Multi-tenant SaaS (Opção B) — só com demanda comprovada.
- Billing dentro da aplicação — cobrança dos primeiros contratos é externa (contrato + fatura).
- Emissão TLS real no ambiente local (sem domínio público) — template + doc entregues.
- Revisão jurídica dos textos legais — recomendada ao dono antes do primeiro contrato.
