# CLAUDE.md — SolarHub Commerce

> **Este é o arquivo-mestre de instruções para agentes de IA (Claude Code, Codex).**
> Leia este arquivo por completo antes de escrever qualquer linha de código.
> Ele define como o projeto deve ser construído, mantido e evoluído.

---

## ⚠️ REGRA CRÍTICA DE TERMINOLOGIA

> **NUNCA use a palavra "Vendedor" ou "Seller".**
> O papel comercial desta plataforma é chamado de **"Consultor"** (`consultant`).
> - Role no banco: `consultant`
> - Label na UI: "Consultor"
> - Método no User model: `isConsultant()`
> - Em todo código, comentário, label e documentação: sempre "consultor"

---

## 0. TL;DR para o Agente

Você está trabalhando no **SolarHub Commerce**, uma plataforma de e-commerce completa e robusta para o segmento fotovoltaico/energia solar no Brasil. A plataforma está em produção com MVP+ completo — todas as fases do roadmap original (0–9) foram implementadas, mais dezenas de funcionalidades extras.

**Stack:**
- **Backend:** Laravel 12 · PHP 8.5 (Sail) / 8.3 (host) · MySQL 8.4 · Redis · Meilisearch
- **Frontend:** React 18 · TypeScript 5.9 · Inertia.js 2.3 · Material UI 9 · Vite 8 (rolldown)
- **Infra:** Docker (Sail) · Laravel Horizon · Laravel Telescope · Laravel Socialite

**Regras inegociáveis:**

1. **Nunca** escreva regra de negócio em Controllers. Controllers apenas orquestram.
2. **Toda** persistência passa por um Repository (exceto casos triviais documentados).
3. **Toda** regra de negócio vive em um Service ou Action.
4. **Todo** dado que cruza camadas é um DTO tipado.
5. **Toda** feature tem: Repository + Service + DTO + Validação + Testes + Logs + Permissões.
6. Escreva testes (Pest) para tudo. Cobertura mínima **80%**.
7. Código, nomes de variáveis e comentários técnicos em **inglês**. Conteúdo de UI em **português (pt-BR)**.
8. Antes de criar um arquivo novo, verifique se já existe um padrão equivalente no projeto e siga-o.
9. Imagens de produto **sempre** usam `object-fit: contain` (sem cortar a foto em nenhuma direção), com `bgcolor` neutro no container para preencher as bordas — nunca `cover`.
10. Sempre rodar `npm run build` ao final para confirmar 0 erros TypeScript.

Quando estiver em dúvida sobre uma decisão arquitetural, **consulte os arquivos em `/docs`** listados na seção 2.

---

## 1. Identidade do Projeto

| Item | Valor |
|------|-------|
| Nome | SolarHub Commerce |
| Tipo | E-commerce B2C (base B2B já estruturada) |
| Segmento | Energia solar, fotovoltaico, mobilidade elétrica, produtos elétricos |
| Mercado | Brasil (pt-BR, BRL, fuso America/Sao_Paulo) |
| Objetivo | Maior plataforma de venda online no segmento fotovoltaico do Brasil |
| Status | **MVP+ Completo** — em contínua evolução |

**Atributos da plataforma:** confiança, modernidade, tecnologia, segurança, alta performance e escalabilidade.

---

## 2. Mapa da Documentação

Leia os documentos na ordem indicada conforme a tarefa:

| Arquivo | Quando ler |
|---------|-----------|
| `CLAUDE.md` (este) | Sempre, primeiro |
| `PROGRESS.md` | No início de cada sessão — estado atual da plataforma |
| `docs/01-architecture.md` | Antes de criar qualquer módulo |
| `docs/02-conventions.md` | Antes de escrever código |
| `docs/03-domain-model.md` | Ao modelar entidades e banco |
| `docs/04-database.md` | Ao criar migrations |
| `docs/05-frontend.md` | Ao trabalhar com React/Inertia/MUI |
| `docs/06-features-storefront.md` | Ao implementar páginas da loja |
| `docs/07-features-admin.md` | Ao implementar o painel admin |
| `docs/08-integrations.md` | Ao trabalhar com estoque/pagamentos/frete/ERP |
| `docs/09-security.md` | Ao lidar com auth, dados sensíveis, LGPD |
| `docs/10-testing.md` | Ao escrever testes |
| `docs/11-roadmap.md` | Para entender faseamento e próximos passos |

---

## 3. Princípios Arquiteturais (resumo)

O projeto segue **Clean Architecture** adaptada ao Laravel, com **Domain-Driven Design** leve. Detalhes em `docs/01-architecture.md`.

### Estrutura de Domínios

```
app/Domains/
├── Auth/          — autenticação e login social
├── Catalog/       — produtos, categorias, marcas, attributes
├── Checkout/      — fluxo de checkout e ações
├── Customers/     — clientes, endereços, favoritos, alertas de estoque
├── Financial/     — transações, DRE, conciliação
├── Integrations/  — ERP/distribuidor HTTP client
├── Inventory/     — estoque, movimentações, sync
├── Marketing/     — cupons, flash sales, reviews, Q&A, newsletter, blog
├── Orders/        — pedidos, carrinhos, itens, frete, cotações, devoluções
├── Payments/      — gateways, webhooks, histórico
├── Reports/       — KPIs e exportações
├── Settings/      — configurações globais com cache
└── Support/       — tickets de suporte e respostas
```

### Fluxo de Requisição

```
Request → FormRequest (validação) → Controller
              → Service/Action → Repository → Model → DB
                   → DTO ↔ Resource/Array → Inertia → React
                   → Event → Listener (jobs, emails, notificações)
```

---

## 4. Stack Técnica Detalhada

### Backend
| Componente | Versão | Observação |
|---|---|---|
| PHP | 8.5 (Sail) / 8.3 (host) | mbstring + intl instalados no host |
| Laravel | 12 | com Sail Docker |
| Spatie Permissions | — | 6 roles, 26 permissões |
| Laravel Scout | — | Meilisearch para busca |
| Laravel Horizon | — | 4 supervisors: default, emails, payments, sync |
| Laravel Socialite | 5.x | Login via Google |
| pragmarx/google2fa | — | 2FA TOTP para admins |
| Spatie Laravel Data | — | DTOs tipados |

### Frontend
| Componente | Versão | Observação |
|---|---|---|
| React | 18 | com TypeScript estrito |
| Inertia.js | 2.3 | server-driven SPA |
| Material UI | 9.0.1 | `sx` prop, não styled-components |
| Vite | 8.0.16 (rolldown) | Node 22.22.3 via nvm |
| Recharts | — | gráficos no dashboard admin |

### Banco e Infra
| Componente | Porta | Observação |
|---|---|---|
| MySQL | 3306 | v8.4, banco `solarhub` |
| Redis | 6379 | sessions, cache, filas |
| Meilisearch | 7700 | full-text search de produtos |
| Mailpit | 8026 (dashboard) | SMTP local para dev |
| phpMyAdmin | 8001 | administração visual do banco |

---

## 5. Comandos Essenciais

```bash
# ── Ambiente ───────────────────────────────────────────────────────────────────
./vendor/bin/sail up -d                        # iniciar containers Docker
./vendor/bin/sail artisan migrate              # rodar migrations pendentes
./vendor/bin/sail artisan migrate:fresh --seed # reset completo (dev)
./vendor/bin/sail artisan db:seed --class=RichCatalogSeeder  # seed de produtos
./vendor/bin/sail artisan storage:link         # link do storage público
./vendor/bin/sail artisan scout:import "App\Domains\Catalog\Models\Product"
npm run dev                                    # Vite dev server (host)
npm run build                                  # build de produção (sempre rodar ao fim)

# ── Filas ──────────────────────────────────────────────────────────────────────
./vendor/bin/sail artisan horizon              # iniciar worker Horizon
./vendor/bin/sail artisan queue:work           # worker simples (alternativa)

# ── Qualidade ──────────────────────────────────────────────────────────────────
composer check                                 # pint + phpstan + pest
./vendor/bin/pint                              # formatação PHP
./vendor/bin/phpstan analyse --memory-limit=2G # análise estática nível 6
./vendor/bin/pest tests/Unit --no-coverage     # testes unitários locais
./vendor/bin/sail artisan test                 # todos os testes (feature + unit)

# ── Utilitários ────────────────────────────────────────────────────────────────
./vendor/bin/sail artisan route:list           # listar rotas
./vendor/bin/sail artisan config:cache         # recache de config após .env
./vendor/bin/sail artisan route:clear          # limpar cache de rotas
./vendor/bin/sail artisan inventory:sync       # sync manual ERP/distribuidor
```

### Credenciais padrão (após seed)
| Usuário | E-mail | Senha | Role |
|---|---|---|---|
| Admin | admin@solarhub.com.br | password | admin |
| Cliente | cliente@solarhub.com.br | password | customer |

### URLs dos Serviços
| Serviço | URL |
|---|---|
| Loja | http://localhost:8000 |
| Admin | http://localhost:8000/admin |
| phpMyAdmin | http://localhost:8001 |
| Mailpit | http://localhost:8026 |
| Meilisearch | http://localhost:7700 |
| Horizon | http://localhost:8000/horizon |
| Telescope | http://localhost:8000/telescope |

---

## 6. Convenções Críticas do Projeto

### PHP
```php
declare(strict_types=1);  // obrigatório em todo arquivo PHP

// Dinheiro: SEMPRE em centavos (int), nunca float
$price = 19990;  // R$ 199,90
$reais = $price / 100;  // só na exibição

// Storage: SEMPRE local, NUNCA S3
Storage::disk('public')->url($path);
Storage::disk('products')->url($path);
Storage::disk('exports')->url($path);

// ImageUrl externa: verificar antes de usar Storage
public function url(): string {
    if (str_starts_with($this->path, 'http')) return $this->path;
    return Storage::disk('public')->url($this->path);
}
```

### TypeScript / React
```typescript
// ElementType: importar de 'react', NÃO de '@mui/material'
import { type ElementType } from 'react';

// Props do MUI 9: TUDO em sx, nunca como prop direta
<Box sx={{ fontWeight: 700, textAlign: 'center' }}>

// Pagination: sempre usar prop 'pagination=', NUNCA 'data='
<Pagination pagination={products} />

// Preços: exibição em reais, armazenamento em centavos
value={data.price_cents ? (data.price_cents / 100).toFixed(2) : ''}
onChange={(e) => setData('price_cents', Math.round(Number(e.target.value) * 100))}
```

### Rotas
- Usar `[Controller::class, 'method']` para controllers com métodos nomeados
- Usar `Controller::class` APENAS para controllers com `__invoke()`
- Nunca registrar um controller como invokable se não tiver `__invoke()` — causa 500 em TODAS as rotas

### Models
- `Return` é palavra reservada no PHP — usar `ReturnRequest` com `protected $table = 'returns'`
- Relações `BelongsToMany` em pivot tables sem `updated_at`: não usar `using(Pivot::class)`
- `frequentlyBoughtWith()` no Product model usa co-ocorrência real em `order_items`

---

## 7. Variáveis de Ambiente Críticas

```dotenv
# Pagamentos
PAYMENT_GATEWAY=mock          # mock | asaas
ASAAS_API_KEY=                # chave Asaas (produção)
ASAAS_ENVIRONMENT=sandbox     # sandbox | production

# ERP / Distribuidor
ERP_BASE_URL=                 # https://api.seu-distribuidor.com.br
ERP_API_KEY=                  # chave Bearer
ERP_TIMEOUT=30
ERP_SYNC_ENABLED=false        # true = sync automático diário 03:00

# Login Social
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=/auth/google/callback

# Frete grátis (configurável via Admin > Configurações)
# Gerenciado pelo SettingsService, não direto no .env
```

---

## 8. Workflow do Agente (como trabalhar neste repo)

1. **Leia `PROGRESS.md`** no início de cada sessão para entender o estado atual.
2. **Identifique o domínio** afetado (`app/Domains/<Domain>`).
3. **Verifique se já existe** um padrão equivalente antes de criar algo novo.
4. **Planeje** a mudança: migration, model, repository, service, controller, página React.
5. **Implemente** seguindo as convenções desta seção e de `docs/02-conventions.md`.
6. **Rode `npm run build`** ao final — deve ter 0 erros TypeScript.
7. **Rode a migration** dentro do Sail: `./vendor/bin/sail artisan migrate`.
8. **Atualize `PROGRESS.md`** e os docs relevantes.

---

## 9. A Regra de Ouro

> **Nenhuma funcionalidade pode ser criada sem:**
> Repository · Service (ou Action) · DTO · Validação · Testes · Logs · Permissões · Documentação.

Se algum desses oito itens não fizer sentido para uma feature trivial, **documente o porquê** no commit. O default é cumprir todos.

---

## 10. O que NUNCA fazer

- ❌ Query Eloquent dentro de Controller, Blade/JSX ou Service sem passar pelo Repository
- ❌ Regra de negócio em Controller, Model ou componente React
- ❌ Retornar Models direto para o front — use arrays mapeados ou Resources
- ❌ `dd()`, `dump()`, `var_dump()` ou `console.log` em código entregue
- ❌ Segredos hardcoded — tudo em `.env`
- ❌ Apagar dados em sincronização sem auditoria (ver `docs/08-integrations.md`)
- ❌ Usar a palavra "Vendedor" ou "Seller" — sempre "Consultor" / `consultant`
- ❌ Registrar controller como invokable se não tem `__invoke()` — quebra TODAS as rotas
- ❌ Usar `using(Pivot::class)` em relacionamentos ManyToMany com tabela pivot sem `updated_at`
- ❌ `Pagination data={items}` — a prop correta é `pagination={items}`
- ❌ Textos e labels da UI em inglês — sempre português (pt-BR)
- ❌ `objectFit: 'cover'` em imagens de produto — sempre `contain`, nunca cortar a foto

---

## 11. Definição de Pronto (Definition of Done)

Uma tarefa está pronta quando:

- [ ] Código segue as convenções de `docs/02-conventions.md` e seção 6 deste arquivo
- [ ] Migration criada e rodada dentro do Sail
- [ ] Repository + Service/Action + DTO implementados (quando aplicável)
- [ ] Validação via FormRequest ou `$request->validate()`
- [ ] Eventos/Jobs disparados quando aplicável
- [ ] Permissões/Policies aplicadas
- [ ] `npm run build` passa com **0 erros TypeScript**
- [ ] UI responsiva para xs/sm/md/lg breakpoints
- [ ] Rotas registradas em `routes/web.php`
- [ ] Menus do admin/cliente atualizados quando necessário
- [ ] `PROGRESS.md` atualizado com o que foi feito
- [ ] Documentação em `/docs` atualizada se introduziu novo padrão

---

## 12. Referência Rápida de Arquivos-Chave

| O que | Arquivo |
|---|---|
| Bindings de repositórios | `app/Providers/RepositoryServiceProvider.php` |
| Registro de eventos | `app/Providers/EventServiceProvider.php` |
| Rotas completas | `routes/web.php` |
| Agendamentos (cron) | `routes/console.php` |
| Shared props Inertia | `app/Http/Middleware/HandleInertiaRequests.php` |
| Tipos TypeScript | `resources/js/Types/inertia.d.ts` + `catalog.ts` |
| Tema MUI | `resources/js/Theme/theme.ts` |
| Gateway de pagamento | `app/Domains/Payments/Gateways/` |
| Sync de estoque | `app/Domains/Inventory/Services/InventorySyncService.php` |
| ERP HTTP client | `app/Domains/Integrations/Services/HttpErpClient.php` |
| Simulador solar | `app/Domains/Marketing/Services/SolarSimulatorService.php` |
| Settings com cache | `app/Domains/Settings/Services/SettingsService.php` |
| Galeria de imagens | `resources/js/Components/storefront/ProductGallery.tsx` |
| Kit Builder | `resources/js/Pages/Storefront/KitBuilder.tsx` |
