# SolarHub Commerce — Progresso e Próximos Passos

> **Leia este arquivo no início de cada sessão antes de escrever qualquer código.**
> Ele registra exatamente o que foi feito, o que falta e decisões tomadas.

---

## Estado Atual: Plataforma MVP+ Completa

**Última atualização:** 2026-06-02 (sessão 6)
**Build:** ✓ TypeScript 0 erros · Vite 8 · 1787 módulos
**Fases concluídas:** 0–9 + todos os extras
**Build:** ✓ TypeScript 0 erros · Vite 8 · 1776 módulos
**Testes:** ✓ 49 unit tests locais (115 assertions) · Feature tests no Sail
**PHP host:** php8.3-mbstring + php8.3-intl instalados — PHPStan roda dentro do Sail (requer Redis extension)

---

## Stack e Ambiente

| Componente | Versão | Onde roda |
|---|---|---|
| Laravel | 12 | Sail (Docker) |
| PHP | 8.5 (Sail) / 8.3 (host) | Container |
| Inertia | 2.3 | Sail |
| React + TypeScript | 18 + 5.9 | Host |
| Material UI | 9.0.1 | Host |
| Vite | 8.0.16 (rolldown) | Host |
| Node.js | 22.22.3 LTS | Host (nvm default=22) |
| MySQL | 8.4 | Sail (porta 3306) |
| Redis | alpine | Sail (porta 6379) |
| Meilisearch | latest | Sail (porta 7700) |
| Mailpit | latest | Sail (porta 1025 / 8025) |
| phpMyAdmin | 5 | Sail (**porta 8080**) |

### Comandos para iniciar ambiente

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate
./vendor/bin/sail artisan db:seed
./vendor/bin/sail artisan storage:link
./vendor/bin/sail artisan scout:import "App\Domains\Catalog\Models\Product"
npm run dev
# Horizon em terminal separado (opcional):
./vendor/bin/sail artisan horizon
```

### Credenciais padrão (após seed)

| Usuário | E-mail | Senha | Role |
|---|---|---|---|
| Admin | admin@solarhub.com.br | password | admin |
| Cliente | cliente@solarhub.com.br | password | customer |

### URLs dos serviços

| Serviço | URL |
|---|---|
| Loja | http://localhost |
| phpMyAdmin | http://localhost:8080 |
| Mailpit | http://localhost:8025 |
| Meilisearch | http://localhost:7700 |
| Horizon | http://localhost/horizon |
| Telescope | http://localhost/telescope |

---

## O que foi construído

### Fase 0 — Fundação ✅

- Laravel 12 + Sail configurado com MySQL, Redis, Meilisearch, Mailpit, phpMyAdmin
- Estrutura de domínios em `app/Domains/` (todos os 14 domínios)
- Providers: `AppServiceProvider`, `EventServiceProvider`, `HorizonServiceProvider`, `TelescopeServiceProvider`, `RepositoryServiceProvider`
- Value Object `Money` em `app/Support/ValueObjects/Money.php`
- Tema MUI (`resources/js/Theme/theme.ts`) — azul `#0B5FFF`, amarelo `#FFB300`
- `StorefrontLayout.tsx` e `AdminLayout.tsx` e `AccountLayout.tsx` completos
- `composer check` (Pint + PHPStan nível 6 + Pest)
- `.env` configurado: `APP_TIMEZONE=America/Sao_Paulo`, `APP_LOCALE=pt_BR`, `DB=solarhub`
- Storage local (sem S3): discos `public`, `products`, `exports`

### Fase 1 — Catálogo ✅

**Backend:**
- Migrations: `categories`, `brands`, `attributes`, `attribute_values`, `products`, `product_images`, `product_variants`, `category_product`, `product_attribute_values`, `product_downloads`
- Enums: `ProductStatus` (draft/published/archived), `AttributeType`
- Models: `Category`, `Brand`, `Attribute`, `AttributeValue`, `Product` (com Scout/Meilisearch), `ProductImage`, `ProductVariant`
- DTOs: `CategoryData`, `BrandData`, `ProductData`, `ProductFilterData`
- Repositórios: `CategoryRepositoryInterface` + `EloquentCategoryRepository`, `BrandRepositoryInterface` + `EloquentBrandRepository`, `ProductRepositoryInterface` + `EloquentProductRepository`
- Services: `CategoryService`, `BrandService`, `ProductService` (publish/unpublish, upload imagem)
- Events: `ProductPublished`, `ProductUpdated`
- Resources: `CategoryResource`, `BrandResource`, `ProductResource`
- Form Requests: `StoreProductRequest`, `UpdateProductRequest`
- Controllers Admin: `DashboardController`, `ProductController`, `CategoryController`, `BrandController`, `ProductImageController`
- Controllers Storefront: `HomeController`, `CategoryController`, `ProductController`
- Seeders: `CatalogSeeder` (árvore de categorias solar, 12 marcas, 10 produtos)
- Factories: `CategoryFactory`, `BrandFactory`, `ProductFactory`

**Frontend:**
- `Pages/Storefront/Home.tsx` — hero, benefícios, categorias, ofertas, destaque, marcas, CTA
- `Pages/Storefront/Category.tsx` — filtros (marca, preço, promoção), ordenação, chips ativos
- `Pages/Storefront/Product.tsx` — galeria, preços, parcelamento, specs, tabs, relacionados
- `Pages/Storefront/Search.tsx` — resultados de busca paginados
- `Components/storefront/ProductCard.tsx` — com skeleton, desconto, parcelamento
- `Components/storefront/Breadcrumb.tsx`
- `Components/storefront/Pagination.tsx`
- `Components/storefront/SmartSearch.tsx` — autocomplete Meilisearch com debounce 300ms
- `Hooks/useSearch.ts`

### Fase 2 — Auth + Clientes ✅

**Backend:**
- Migrations: `customers`, `addresses`, `favorites`
- Models: `Customer`, `Address` (com `fullAddress()`)
- `User` model atualizado com Spatie `HasRoles`, `customer()` relation, `isAdmin()`, `isCustomer()`
- `AuthService` (register cria Customer + role, login, logout)
- Controllers Auth: `LoginController`, `RegisterController`, `PasswordResetController`, `EmailVerificationController`
- `AccountController` (dashboard, perfil, senha, endereços, favoritos, pedidos, orderShow)
- `EnsureAdmin` middleware (alias `'admin'`)
- Seeders: `RolesAndPermissionsSeeder` — 6 roles + 26 permissões

**Frontend:**
- `Pages/Auth/Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `VerifyEmail.tsx`
- `Layouts/AccountLayout.tsx` — sidebar com avatar e navegação
- `Pages/Storefront/Account/Dashboard.tsx` — KPIs, alerta verificação e-mail
- `Pages/Storefront/Account/Profile.tsx` — dados pessoais + alterar senha
- `Pages/Storefront/Account/Addresses.tsx` — CRUD com busca CEP via ViaCEP
- `Pages/Storefront/Account/Favorites.tsx` — grid de produtos favoritos
- `Pages/Storefront/Account/Orders.tsx` — histórico de pedidos
- `Pages/Storefront/Account/OrderDetail.tsx` — detalhe completo com rastreamento

### Fase 3 — Carrinho e Checkout ✅

**Backend:**
- Migrations: `carts`, `cart_items`, `orders`, `order_items`, `shipments`, `coupons`
- Models: `Cart`, `CartItem`, `Order`, `OrderItem`, `Shipment`
- Enum `OrderStatus` com máquina de estados e `canTransitionTo()`
- `CartService` (add/update/remove, merge de sessão pós-login, `toArray()`)
- `CartController` — JSON API + `applyCoupon` + `removeCoupon`
- `CheckoutController` — cria Order em `DB::transaction()` e inicia Payment
- `HandleInertiaRequests` com `cartCount` real

**Frontend:**
- `Pages/Storefront/Cart.tsx` — lista itens, controle de quantidade, input de cupom, resumo
- `Pages/Storefront/Checkout.tsx` — endereços salvos, form entrega, seleção pagamento

### Fase 4 — Pagamentos ✅

**Backend:**
- Migrations: `payments`, `payment_webhooks`
- Enums: `PaymentMethod` (Pix/Boleto/CreditCard), `PaymentStatus`
- Models: `Payment`, `PaymentWebhook`
- `PaymentGatewayInterface` — contrato completo
- `MockGateway` — Pix (QR + copia-e-cola), Boleto, Cartão (aprovação imediata)
- `PaymentService` — initiate, webhook idempotente, approve, fail, refund
- Events: `PaymentApproved`, `PaymentFailed`
- Listeners: `ReleaseStockOnPaymentApproved`, `CreateTransactionOnPaymentApproved`
- `PaymentController`, `WebhookController`
- Endpoint `/webhooks/:gateway` sem CSRF

**Frontend:**
- `Pages/Storefront/Payment.tsx` — QR Code Pix, copia-e-cola, boleto com código de barras

### Fase 5 — Admin Operacional ✅

**Backend:**
- `OrderAdminController` — listagem, detalhe, troca de status (máquina estados), expedição
- `CustomerAdminController` — listagem, perfil 360° (pedidos, endereços, total gasto)
- `InventoryController` — listagem + ajuste manual com `stock_movements`

**Frontend:**
- `Pages/Admin/Orders/Index.tsx` — DataTable com filtros de status
- `Pages/Admin/Orders/Show.tsx` — detalhe completo, troca de status, dialog de expedição
- `Pages/Admin/Customers/Index.tsx` — DataTable com busca
- `Pages/Admin/Customers/Show.tsx` — perfil 360° com histórico
- `Pages/Admin/Inventory/Index.tsx` — DataTable + dialog de ajuste

### Fase 6 — Sincronização de Estoque ✅

**Backend:**
- Migrations: `warehouses`, `stocks`, `stock_movements`, `sync_logs`, `audit_logs`
- `ErpClientInterface` — contrato para fonte externa
- `ErpProductData` DTO
- `StockService` — reserve, release, syncFromErp (com `stock_movements`)
- `StockChanged` event
- `InventorySyncService` — idempotente, auditável, resiliente
- `SyncInventoryJob` — fila `sync`, 3 tries, 1h timeout
- Agendado diariamente às 03:00 via `Schedule::job()`
- Artisan: `php artisan inventory:sync`

### Fase 7 — Financeiro ✅

**Backend:**
- Migrations: `transactions`, `reconciliations`, `commissions`
- `Transaction` model (revenue/expense)
- `FinancialService` — DRE, fluxo de caixa, `createFromOrder()`
- `CreateTransactionOnPaymentApproved` listener

### Fase 8 — Marketing e Conteúdo ✅

**Backend:**
- `Coupon` model com `isValid()`, `calculateDiscount()` (3 tipos)
- `CouponService` — validação, aplicação no carrinho, remoção
- `CouponController` admin — CRUD + toggle
- `SolarSimulatorService` — cálculo real (irradiância 27 estados, kWp, painéis, economia, CO₂, payback)
- `SimulatorController` — page + endpoint JSON
- `Review`, `Question`, `Answer` models + migrations
- `ReviewController` — submissão, endpoint JSON de reviews
- Migrations blog: `post_categories`, `posts`, `newsletter_subscribers`

**Frontend:**
- `Pages/Admin/Coupons/Index.tsx` — DataTable + dialog de criação
- `Pages/Storefront/Simulator.tsx` — wizard 3 etapas com resultados e kit sugerido
- `Components/storefront/ReviewSection.tsx` — rating, formulário, listagem async

### Fase 9 — SEO, Performance e Config ✅

**Backend:**
- Horizon — 4 supervisors: `default`, `emails`, `payments`, `sync`
- Telescope — protegido por `isAdmin()`, filtros em produção, mascaramento de dados sensíveis
- `SitemapController` — `/sitemap.xml` com cache de 1h (categorias + produtos publicados)
- `robots.txt` com áreas privadas bloqueadas
- `SearchController` — autocomplete JSON + página de resultados
- `ReportController` — KPIs por período, receita/dia, top 10 produtos
- `SettingsController` + `SettingsSeeder` (16 configurações, 4 grupos)
- `Setting` model com cache + `SettingsService`

**Frontend:**
- `Pages/Admin/Reports/Index.tsx` — KPIs, tabela receita/dia, top produtos
- `Pages/Admin/Settings/Index.tsx` — configurações agrupadas com switches e fields

---

## Estrutura de Rotas Implementadas

```
GET  /                           HomeController
GET  /busca                      SearchController@results
GET  /api/search/autocomplete    SearchController@autocomplete
GET  /simulador                  SimulatorController@index
POST /api/simulator/calculate    SimulatorController@calculate
GET  /sitemap.xml                SitemapController
POST /webhooks/{gateway}         WebhookController@handle (sem CSRF)

GET  /produtos/{slug}            StorefrontProductController@show
GET  /categorias/{slug}          StorefrontCategoryController@show
POST /produtos/{product}/reviews ReviewController@store (auth)
GET  /api/products/{id}/reviews  ReviewController@productReviews

GET  /carrinho                   CartController@show
POST /carrinho/items             CartController@store
PATCH/carrinho/items/{item}      CartController@update
DELETE/carrinho/items/{item}     CartController@destroy
POST /carrinho/coupon            CartController@applyCoupon
DELETE/carrinho/coupon           CartController@removeCoupon

GET  /checkout                   CheckoutController@index (auth)
POST /checkout                   CheckoutController@store (auth)
GET  /pedidos/{uuid}/pagamento   PaymentController@show (auth)

GET/PUT /login /register /esqueci-minha-senha ...
GET/PUT /verify-email ...

GET/PUT /conta/*                 AccountController (auth+verified)
  /conta                         dashboard
  /conta/pedidos                 orders list
  /conta/pedidos/{uuid}          order detail
  /conta/perfil                  profile edit
  /conta/enderecos               addresses CRUD
  /conta/favoritos               favorites

GET /admin                       DashboardController (auth+admin)
GET /admin/products              ProductController@index
GET /admin/orders                OrderAdminController@index
GET /admin/customers             CustomerAdminController@index
GET /admin/inventory             InventoryController@index
GET /admin/coupons               CouponController@index
GET /admin/reports               ReportController@index
GET /admin/settings              SettingsController@index
... (CRUD completo em cada recurso)
```

---

## Decisões de Arquitetura Tomadas

| Decisão | Motivo |
|---|---|
| Storage local (sem S3) | Usuário não usa S3; disco `public` + `products` + `exports` |
| MockGateway para pagamentos | Aguardando escolha do gateway real (Mercado Pago / Asaas) |
| Eloquent não testável localmente | PHP host sem mbstring; testes com Models são Feature tests no Sail |
| Vite 5 → 8 com rolldown | Node 22.22.3 instalado via nvm; alias default configurado |
| MUI 9 (não 6) | Props do sistema movidas para `sx`; `ElementType` importado de `react` |
| `setRawAttributes()` nos testes | Único jeito de usar Eloquent Models em unit tests sem mbstring |

---

## Testes

### Rodando localmente (sem Sail)
```bash
./vendor/bin/pest tests/Unit --no-coverage
```
36 testes, 102 assertions — todos PASS.

### Rodando dentro do Sail (completo)
```bash
./vendor/bin/sail artisan test
# ou
./vendor/bin/sail artisan test --coverage --min=80
```

### Estrutura de testes
```
tests/
├── Unit/
│   ├── Domains/
│   │   ├── Catalog/ProductStatusTest.php        ✅ 3 testes
│   │   ├── Catalog/ProductModelTest.php         (requer Sail)
│   │   ├── Inventory/SolarSimulatorTest.php     ✅ 5 testes
│   │   ├── Marketing/CouponCalculationTest.php  ✅ 7 testes (lógica pura)
│   │   ├── Orders/OrderStatusTest.php           ✅ 4 testes
│   │   └── Payments/PaymentStatusTest.php       ✅ 4 testes
│   └── Support/ValueObjects/MoneyTest.php       ✅ 12 testes
└── Feature/
    ├── Auth/AuthFlowTest.php                    (requer Sail)
    ├── Admin/ProductAdminTest.php               (requer Sail)
    ├── Catalog/CouponServiceTest.php            (requer Sail, usa Eloquent)
    ├── Catalog/ProductModelTest.php             (requer Sail)
    ├── Storefront/ProductTest.php               (requer Sail)
    └── Storefront/CategoryTest.php              (requer Sail)
```

---

## Extras Implementados (sessão 2026-06-02 #2)

### Segurança — CartItem IDOR Fix ✅
- `CartController.update()` e `destroy()` agora verificam se o item pertence ao carrinho do usuário atual (via `user_id` ou `session_id`).
- Método privado `authorizeCartItem()` adicionado.

### 2FA TOTP para Admins ✅
- Migration `add_two_factor_to_users_table` (secret, recovery_codes, confirmed_at)
- `User` model atualizado com `hasTwoFactorEnabled()` e `hasTwoFactorConfirmedInSession()`
- `TwoFactorService` com `generateSecret()`, `enable()`, `disable()`, `verify()`, `verifyRecoveryCode()`
- `TwoFactorController` (setup, enable, disable, challenge, verify)
- `RequiresTwoFactor` middleware — aliás `'two-factor'`
- Rotas 2FA em `/two-factor/*`
- Admin routes agora usam `['auth', 'admin', 'two-factor']`
- Páginas React: `Auth/TwoFactor/Setup.tsx`, `Auth/TwoFactor/Challenge.tsx`
- Menu Admin: link "Autenticação 2FA" em Sistema
- Pacotes: `pragmarx/google2fa-laravel`, `bacon/bacon-qr-code` — QR SVG sem Imagick

### Blog Completo ✅
- Models: `Post` (com SoftDeletes, slug automático, `readingTime()`), `PostCategory`
- `PostService` com `create()`, `update()`, `delete()` (gerencia cover_image)
- `Admin/BlogController` — CRUD completo com upload de capa
- `Storefront/BlogController` — listagem paginada + detalhe com posts relacionados
- Rotas: `GET /blog`, `GET /blog/{slug}`, admin `/admin/posts/*`
- Páginas React: `Admin/Blog/Index.tsx`, `Admin/Blog/Form.tsx`, `Storefront/Blog/Index.tsx`, `Storefront/Blog/Post.tsx`
- Menu Admin: link "Blog" em Marketing

### Newsletter Double Opt-in ✅
- `NewsletterSubscriber` model com token gerado no `booted()`
- `NewsletterService` com `subscribe()`, `confirm()`, `unsubscribe()`
- `NewsletterController` — subscribe, confirm, unsubscribe
- `NewsletterConfirmation` Mailable (implements ShouldQueue)
- Template e-mail Blade em `resources/views/emails/newsletter/confirmation.blade.php`
- Rotas: POST `/newsletter/subscribe`, GET `/newsletter/confirmar/{token}`, GET `/newsletter/cancelar/{token}`

### Moderação de Reviews e Q&A no Admin ✅
- `ReviewAdminController` — listagem com paginação, approve, reject, answerQuestion
- Página `Admin/Reviews/Index.tsx` — tabs Avaliações / Perguntas, badges de pendentes, dialog de resposta
- Rotas: `/admin/reviews/*`, `/admin/questions/{question}/answer`
- Menu Admin: link "Avaliações" em Marketing

### Rate Limiting APIs ✅
- `/api/search/autocomplete` — `throttle:60,1`
- `/api/simulator/calculate` — `throttle:30,1`

---

## Extras Implementados (sessão 2026-06-02 #3)

## Extras Implementados (sessão 2026-06-02 #5)

### Bugs críticos corrigidos ✅
- **Migration de coupons**: reordenada para criar `coupons` antes de `carts` (FK)
- **Migration category_product**: adicionado `timestamps()` (requerido pelo `withTimestamps()` na relação)
- **Meilisearch PHP client**: instalado `meilisearch/meilisearch-php` dentro do Sail
- **Logout via GET**: corrigido no AdminLayout para usar `router.post('/logout')`
- **UserFactory**: adicionados campos 2FA (`null` defaults) para evitar `MissingAttributeException` em testes
- **Strict mode + hidden attributes**: `hasTwoFactorEnabled()` usa `getAttribute()` compatível
- **Inertia testing**: publicado `config/inertia.php` com `ensure_pages_exist: false`

### Portas Docker atualizadas ✅
- Loja: **8000** (era 80 — conflito resolvido)
- phpMyAdmin: **8001** (era 8080)
- Mailpit dashboard: **8026** (era 8025 — conflito resolvido)
- SMTP: 1025 (sem mudança)

### Webhook Asaas com verificação de assinatura ✅
- `WebhookController` verifica header `asaas-access-token` para gateway Asaas
- Rejeita com 401 se assinatura inválida

### Cookie consent banner LGPD ✅
- `CookieBanner.tsx` — slide-in com "Apenas essenciais" / "Aceitar todos"
- Salvo em `localStorage` (`solarhub_cookie_consent`)
- Integrado ao `StorefrontLayout`

### Blog — Categorias admin ✅
- `PostCategoryController` — CRUD completo
- `Admin/Blog/Categories.tsx` — tabela + dialogs criar/editar
- Menu admin: "Blog — Categorias"

### Produtos vistos recentemente ✅
- `useRecentlyViewed.ts` — hook + funções para localStorage (máx. 8 produtos)
- `RecentlyViewed.tsx` — grade de 4 produtos vistos recentemente
- `useTrackView()` integrado à página de produto

### Feature tests novos ✅
- `Feature/Storefront/CartTest.php` — 4 testes (add, show, IDOR protection)
- `Feature/Admin/DashboardTest.php` — 5 testes (acesso bloqueado/permitido)
- `Feature/Storefront/StaticPagesTest.php` — 8 testes (todas páginas institucionais)

### Correções de testes
- `ProductAdminTest`: adicionado `beforeEach` com admin autenticado
- `RefreshDatabase` adicionado ao `StaticPagesTest`

### Migrate:fresh funcionando ✅
- `sail artisan migrate:fresh --seed` — todas as migrations e seeders passando
- `sail artisan scout:import` — produtos indexados no Meilisearch

---

## Extras Implementados (sessão 2026-06-02 #4)

### mbstring instalado no host PHP ✅
- `php8.3-mbstring` e `php8.3-intl` instalados
- 49 unit tests rodando localmente (eram 36)

### Blog e Simulador na navegação ✅
- Links adicionados na barra de navegação desktop e mobile
- Flash messages melhorados (info, warning, error, success)

### Newsletter no footer ✅
- Formulário de inscrição no rodapé da loja (HTML form nativo com CSRF)

### Páginas institucionais ✅
- `/sobre` — Sobre a empresa com números e valores
- `/contato` — Formulário de contato com envio de e-mail
- `/privacidade` — Política de privacidade (LGPD)
- `StaticPageController` (sobre, contato, contatoStore, privacidade)

### Gerenciamento de Newsletter no Admin ✅
- `NewsletterAdminController` (index, destroy, exportCsv)
- `Admin/Newsletter/Index.tsx` com KPIs, filtros, tabela e exportação CSV
- Menu Admin: link "Newsletter" em Marketing

### ProductCard melhorado ✅
- Botão de favorito (coração) no canto superior direito — toggle via AJAX
- Botão "Adicionar ao carrinho" inline na base do card
- Hover effect com elevação
- Redireciona para login se não autenticado

### Testes unitários novos ✅
- `NewsletterSubscriberTest` — 4 testes
- `PostTest` — 5 testes (isPublished, readingTime)
- `TwoFactorTest` — 4 testes (hasTwoFactorEnabled)

---

### Notificações In-App para Admin ✅
- Migration `create_notifications_table` (Laravel database notifications)
- `NewOrderNotification`, `LowStockNotification`, `PaymentFailedNotification`
- Listeners: `NotifyAdminsOnNewOrder`, `NotifyAdminsOnPaymentFailed`, `NotifyAdminsOnLowStock`
- Evento `OrderPlaced` criado e disparado no `CheckoutController`
- `NotificationController` — index (últimas 20), markRead, markAllRead
- `HandleInertiaRequests` compartilha `notifyCount` para admins
- `AdminLayout.tsx` — badge real + popover dropdown com lista de notificações e "marcar todas lidas"

### DRE Completo + CSV Export ✅
- `ExportReportJob` — exporta DRE ou pedidos para CSV em `storage/app/public/exports/`
- `ReportController` expandido com `dre()`, `exportCsv()`, `downloadExport()`
- `Admin/Reports/Index.tsx` com 3 tabs: Vendas por dia · DRE · Exportar CSV

### Páginas de Erro 404/500 Customizadas ✅
- `resources/js/Pages/Error.tsx` — UI completa para 403/404/500/503
- `bootstrap/app.php` — `$exceptions->respond()` renderiza via Inertia

### Seeders de Produção ✅
- `ProductionSeeder.php` — roles + settings + categorias (sem fake data)
- `DevelopmentSeeder.php` — todos os seeders com guard `app()->isProduction()`
- `ProductionCategoriesSeeder.php` — idempotente (não recria se já existir)

### Gateway Asaas ✅
- `AsaasGateway.php` implementa PIX, Boleto e Cartão via HTTP + retry
- `PaymentService::gateway()` → Asaas quando `PAYMENT_GATEWAY=asaas`
- `config/services.php` e `.env.example` atualizados

### HttpErpClient ✅
- `HttpErpClient.php` — cliente HTTP genérico para distribuidor com paginação, cache 5min e retry
- `RepositoryServiceProvider` registra `ErpClientInterface → HttpErpClient`

---

## Próximos Passos

### 🔴 Alta Prioridade

#### 1. Configurar credenciais reais do Asaas
```
# No .env:
PAYMENT_GATEWAY=asaas
ASAAS_API_KEY=seu_api_key
ASAAS_ENVIRONMENT=sandbox  # mude para production ao subir
```
Testar fluxo completo de checkout com webhook real assinado.

#### 2. Configurar ERP/Distribuidor real
```
# No .env:
ERP_BASE_URL=https://api.seu-distribuidor.com.br
ERP_API_KEY=sua_chave
ERP_SYNC_ENABLED=true
```
Adaptar `HttpErpClient::mapProduct()` para o formato real da API.
Testar com `php artisan inventory:sync`.

### 🟢 Baixa Prioridade — Fases futuras

#### 3. PHPStan — Subir para Nível 8
**Atual:** nível 6. Roda apenas dentro do Sail:
```bash
./vendor/bin/sail artisan phpstan analyse
```

#### 6. Seeders de Produção
**O que falta:** Separar seeders de dev (produtos fake, usuários de teste) dos de produção (roles, settings, categorias).

```
DatabaseSeeder atual roda tudo. Criar:
---

## Arquivos-Chave para Referência Rápida

| O que | Arquivo |
|---|---|
| Bindings de repositórios | `app/Providers/RepositoryServiceProvider.php` |
| Registro de eventos | `app/Providers/EventServiceProvider.php` |
| Rotas completas | `routes/web.php` |
| Filas Horizon | `config/horizon.php` |
| Gateway de pagamento | `app/Domains/Payments/Contracts/PaymentGatewayInterface.php` |
| Gateway mock (dev) | `app/Domains/Payments/Gateways/MockGateway.php` |
| Gateway Asaas (produção) | `app/Domains/Payments/Gateways/AsaasGateway.php` |
| ERP HTTP client | `app/Domains/Integrations/Services/HttpErpClient.php` |
| Sync de estoque | `app/Domains/Inventory/Services/InventorySyncService.php` |
| Job de sync | `app/Jobs/SyncInventoryJob.php` |
| Simulador solar | `app/Domains/Marketing/Services/SolarSimulatorService.php` |
| Settings com cache | `app/Domains/Settings/Services/SettingsService.php` |
| Tema MUI | `resources/js/Theme/theme.ts` |
| Tipos TypeScript | `resources/js/Types/catalog.ts` e `Types/inertia.d.ts` |

---

## Convenções e Regras do Projeto

1. **Nunca** query Eloquent em Controller — vai pelo Repository
2. **Sempre** DTO entre camadas (nunca arrays soltos)
3. **Sempre** `declare(strict_types=1)` em todo arquivo PHP
4. **Storage:** usar `Storage::disk('public')` ou `Storage::disk('products')` — **nunca S3**
5. **Dinheiro:** sempre em centavos (`int`) — nunca `float`
6. **Testes locais com Eloquent:** usar `setRawAttributes()` — **não** `new Model(['key' => 'value'])`
7. **`ElementType`:** importar de `'react'` — **não** de `'@mui/material'`
8. **Props do sistema MUI 9:** `fontWeight`, `textAlign`, `alignItems`, etc. vão em `sx` — **não** como prop direta
9. **Conteúdo de UI:** sempre em **pt-BR**
10. **Código e nomes de variáveis:** sempre em **inglês**
