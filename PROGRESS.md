# SolarHub Commerce — Progresso e Estado da Plataforma

> **Leia este arquivo no início de cada sessão antes de escrever qualquer código.**
> Registra exatamente o que foi feito, o que falta e decisões tomadas.

---

## Estado Atual

**Última atualização:** 2026-06-04
**Status:** ✅ Plataforma MVP+ Completa — em evolução contínua
**Build Frontend:** ✓ TypeScript 0 erros · Vite 8 · ~1.800 módulos
**Testes:** 49 unit tests locais · Feature tests no Sail

---

## Stack e Ambiente

| Componente | Versão | Onde roda |
|---|---|---|
| Laravel | 12 | Sail (Docker) |
| PHP | 8.5 (Sail) / 8.3 (host) | Container / Host |
| React + TypeScript | 18 + 5.9 | Host |
| Inertia.js | 2.3 | Sail |
| Material UI | 9.0.1 | Host |
| Vite | 8.0.16 (rolldown) | Host (Node 22.22.3) |
| MySQL | 8.4 | Sail (porta 3306) |
| Redis | alpine | Sail (porta 6379) |
| Meilisearch | latest | Sail (porta 7700) |
| Mailpit | latest | Sail (porta 8026) |
| phpMyAdmin | 5 | Sail (porta 8001) |
| Recharts | latest | Host (gráficos admin) |
| laravel/socialite | 5.x | Sail (Google OAuth) |

### Iniciar o Ambiente

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate
./vendor/bin/sail artisan db:seed          # seed completo (dev)
./vendor/bin/sail artisan storage:link
./vendor/bin/sail artisan scout:import "App\Domains\Catalog\Models\Product"
npm run dev
# Filas (terminal separado):
./vendor/bin/sail artisan horizon
```

### Credenciais Padrão

| Usuário | E-mail | Senha | Role |
|---|---|---|---|
| Admin | admin@solarhub.com.br | password | admin |
| Cliente | cliente@solarhub.com.br | password | customer |
| Consultor | consultor@solarhub.com.br | password | consultant |

### URLs dos Serviços

| Serviço | URL |
|---|---|
| Loja | http://localhost:8000 |
| Admin | http://localhost:8000/admin |
| Portal Consultor | http://localhost:8000/consultor |
| Portal B2B | http://localhost:8000/portal-b2b |
| phpMyAdmin | http://localhost:8001 |
| Mailpit | http://localhost:8026 |
| Meilisearch | http://localhost:7700 |
| Horizon | http://localhost:8000/horizon |
| Telescope | http://localhost:8000/telescope |

---

## Banco de Dados — Todas as Migrations

```
0001_01_01_000000  create_users_table
0001_01_01_000001  create_cache_table
0001_01_01_000002  create_jobs_table
2026_06_01_230744  create_permission_tables
2026_06_01_230754  create_telescope_entries_table
2026_06_02_000001  create_categories_table
2026_06_02_000002  create_brands_table
2026_06_02_000003  create_attributes_table
2026_06_02_000004  create_products_table
2026_06_02_000005  create_product_images_table
2026_06_02_000006  create_product_variants_table
2026_06_02_000007  create_catalog_pivot_tables
2026_06_02_100001  create_customers_table          (customers, addresses, favorites)
2026_06_02_200001  create_orders_tables            (carts, cart_items, orders, order_items, shipments, coupons)
2026_06_02_300001  create_inventory_tables         (warehouses, stocks, stock_movements, sync_logs, audit_logs)
2026_06_02_400001  create_payments_tables          (payments, payment_webhooks)
2026_06_02_500001  create_reviews_and_questions_tables
2026_06_02_500002  create_blog_tables              (post_categories, posts, newsletter_subscribers)
2026_06_02_600001  create_financial_tables         (transactions, reconciliations, commissions)
2026_06_02_700001  create_settings_table
2026_06_02_800001  add_two_factor_to_users_table
2026_06_02_900001  create_notifications_table
2026_06_03_000001  create_stock_alerts_and_abandoned_carts
                   → stock_alerts
                   → ALTER carts: abandoned_at, recovery_email_sent_at
2026_06_03_000002  create_flash_sales_table
2026_06_03_100001  create_product_relations_and_quotes_and_returns_and_tickets
                   → product_relations
                   → quotes
                   → returns
                   → support_tickets
                   → support_replies
                   → ALTER users: google_id, avatar_url, auth_provider
                   → ALTER reviews: images JSON
2026_06_04_000001  create_price_lists_consultants_and_companies
                   → price_lists                (tabelas de preço por segmento)
                   → product_prices             (preços customizados por tabela)
                   → consultant_profiles        (perfil do consultor: comissão, meta, região)
                   → services                   (catálogo de serviços da empresa)
                   → proposals                  (propostas comerciais com UUID, reference)
                   → proposal_items             (itens de proposta com desconto individual)
                   → companies                  (empresas B2B: CNPJ, tipo, crédito)
                   → company_users              (pivot empresa ↔ usuário)
                   → company_projects           (obras/projetos das empresas)
                   → ALTER users: price_list_id, company_id
                   → Seeds 4 tabelas de preço inline (PUBLICO, CONSULTOR, INTEGRADOR, DISTRIB)
```

---

## Funcionalidades Implementadas — Detalhado

### FASE 0 — Fundação ✅
- Docker Sail com MySQL 8.4, Redis, Meilisearch, Mailpit, phpMyAdmin
- 13 domínios em `app/Domains/` seguindo DDD leve
- Providers: AppServiceProvider, EventServiceProvider, HorizonServiceProvider, TelescopeServiceProvider, RepositoryServiceProvider
- Value Object `Money` com operações de centavos
- Tema MUI: azul `#0B5FFF`, amarelo `#FFB300`, dark `#1A1A2E`
- Layouts: StorefrontLayout, AdminLayout, AccountLayout
- Storage local: discos `public`, `products`, `exports`
- PHPStan nível 6, Pint, Pest configurados via `composer check`

### FASE 1 — Catálogo ✅
- **Models:** Product (Scout/Meilisearch, SoftDeletes), Category (árvore), Brand, Attribute, AttributeValue, ProductImage, ProductVariant
- **DTOs:** CategoryData, BrandData, ProductData, ProductFilterData
- **Repositories:** EloquentCategoryRepository (tree 4 níveis eager), EloquentBrandRepository, EloquentProductRepository
- **Services:** CategoryService, BrandService, ProductService (publish/unpublish, upload imagem)
- **Events:** ProductPublished, ProductUpdated
- **Admin Controllers:** ProductController (CRUD + publish/unpublish), CategoryController, BrandController, ProductImageController, BulkProductController
- **Storefront Controllers:** HomeController, CategoryController (filtros + SKU no payload), ProductController
- **Seeders:** CatalogSeeder (árvore solar, 12 marcas), RichCatalogSeeder (57 produtos, 94 imagens Picsum, 53 reviews)

### FASE 2 — Auth + Clientes ✅
- **Models:** Customer, Address (com `fullAddress()`)
- **AuthService:** register (cria Customer + role), login, logout
- **Controllers:** LoginController, RegisterController, PasswordResetController, EmailVerificationController
- **2FA TOTP:** TwoFactorService, TwoFactorController, `RequiresTwoFactor` middleware
- **Login Social Google:** SocialiteController, laravel/socialite 5.x, merge de conta por email
- Roles: `admin`, `manager`, `customer`, `support`, `analyst`, `viewer` (6 roles, 26 permissões)
- **Páginas Auth:** Login.tsx (botão Google), Register.tsx, ForgotPassword.tsx, ResetPassword.tsx, VerifyEmail.tsx
- **Conta do cliente:** Dashboard, Perfil, Segurança, Endereços, Favoritos, Pedidos, Devoluções, Tickets

### FASE 3 — Carrinho e Checkout ✅
- **Models:** Cart (com `abandoned_at`), CartItem, Order, OrderItem, Shipment
- `OrderStatus` enum com `canTransitionTo()` e labels/cores em pt-BR
- **CartService:** add, update, remove, merge pós-login, apply coupon, `toArray()`
- IDOR protection via `authorizeCartItem()` privado
- **Páginas:** Cart.tsx (barra de progresso frete grátis dinâmica via `branding.free_shipping_min_cents`), Checkout.tsx

### FASE 4 — Pagamentos ✅
- **Models:** Payment, PaymentWebhook
- **Gateways:** MockGateway (dev), AsaasGateway (PIX, Boleto, Cartão via HTTP)
- **PaymentService:** initiate, webhook idempotente, approve, fail, refund
- **Events:** PaymentApproved → ReleaseStockOnPaymentApproved + CreateTransactionOnPaymentApproved
- Webhook `/webhooks/{gateway}` sem CSRF, verificação de assinatura Asaas

### FASE 5 — Admin Operacional ✅
- **OrderAdminController:** listagem, detalhe, troca de status, expedição
- **CustomerAdminController:** listagem, perfil 360°
- **InventoryController:** listagem + ajuste manual com `stock_movements`
- **BulkProductController:** publicar/arquivar/destacar/excluir até 100 produtos em massa

### FASE 6 — Sincronização de Estoque ✅
- **ErpClientInterface** → HttpErpClient (paginado, cache 5min, retry)
- **StockService:** reserve, release, syncFromErp
- **InventorySyncService:** idempotente, auditável, resiliente (falhas parciais não abortam)
- **SyncInventoryJob:** fila `sync`, 3 tries, 1h timeout, agendado 03:00 diário
- **Alertas de Volta ao Estoque:** `StockAlert` model, `StockAlertService`, `NotifyStockAlerts` listener, `StockAvailableNotification` mailable queued
  - Rotas: `POST /produtos/{product}/alertas`, `GET /alertas/cancelar/{token}`

### FASE 7 — Financeiro ✅
- **Models:** Transaction, Reconciliation
- **FinancialService:** DRE, fluxo de caixa, `createFromOrder()`
- **ExportReportJob:** CSV de pedidos ou DRE para `storage/exports/`

### FASE 8 — Marketing ✅
- **Cupons:** Coupon model, CouponService (3 tipos: % / fixo / frete grátis), admin CRUD
- **Flash Sales:** FlashSale model (starts_at, ends_at, max_qty, sold_count), FlashSaleController, `FlashSaleBanner.tsx` com countdown por segundo + barra de unidades
- **Simulador Solar:** SolarSimulatorService (27 estados, irradiância, kWp, painéis, economia, CO₂, payback) + **botão "Gerar Proposta PDF"** (HTML profissional via `window.print()`)
- **Reviews:** Review, Question, Answer models; ReviewController com upload de até 4 fotos; ReviewSection.tsx com galeria de fotos nas reviews
- **Blog:** Post (SoftDeletes, slug automático, `readingTime()`), PostCategory, PostService
- **Newsletter:** NewsletterSubscriber + double opt-in via token
- **Kit Builder:** wizard 4 passos (Painel → Inversor → Estrutura → Cabos), KitBuilderController, `KitBuilder.tsx` com sidebar e total acumulado

### FASE 9 — SEO, Performance e Config ✅
- **Horizon:** 4 supervisors (default, emails, payments, sync)
- **Telescope:** protegido por `isAdmin()`, mascaramento de dados sensíveis em produção
- **SitemapController:** `/sitemap.xml` com cache 1h
- **robots.txt** com áreas privadas bloqueadas
- **SearchController:** autocomplete JSON (throttle 60/min) + página de resultados
- **ReportController:** KPIs, receita/dia, top produtos, DRE, exportação CSV, **exportação PDF** via `window.print()`
- **SettingsController + SettingsSeeder:** 16 configurações, 4 grupos, cache invalidado automaticamente

### FASE 10 — Tabelas de Preço (Price Lists) ✅

- **`PriceList` model:** código único, tipo (retail/consultant/wholesale/special), discount_percent, is_default, is_active, is_public, valid_from/until
- **`ProductPrice` model:** preço customizado por produto + tabela (price_cents, compare_at_cents)
- **4 tabelas padrão:** PUBLICO (0%), CONSULTOR (−12%), INTEGRADOR (−18%), DISTRIB (−25%)
- **`User::effectivePriceList()`:** cadeia de prioridade — tabela explícita → empresa B2B → role → null (público)
- **`User::priceFor(int $priceCents)`:** calcula preço final para o usuário logado
- **`Product::priceForList(int $listId)`:** preço customizado ou % da tabela
- **`HandleInertiaRequests`:** compartilha `priceList` em todos os shared props do frontend
- **`PriceList` na `inertia.d.ts`:** interface `PriceListInfo` tipada
- **Admin `/admin/price-lists`:** CRUD completo com cards visuais coloridos por tipo, barra superior colorida, desconto em destaque, contagem de preços customizados
- **`PriceListSeeder`:** seeds as 4 tabelas + role `consultant` + usuário de teste

### FASE 11 — Painel do Consultor ✅

- **`ConsultantProfile` model:** region, commission_pct, price_list_id, monthly_goal_cents, proposal_goal, total_revenue_cents, proposals_sent/accepted, `conversionRate()`, `monthlyGoalProgress()`
- **Role `consultant`** com permissões: products.view, orders.view/update, customers.view, proposals.*
- **Middleware `EnsureConsultant`:** verifica `isConsultant() || isSuperAdmin()`
- **`ConsultantLayout.tsx`:** layout próprio com sidebar gradiente `#0D1B3E → #0B2454 → #0F172A`, acento amarelo `#FFB300`, nav Dashboard/Propostas/Clientes, card de usuário no rodapé
- **`Consultant\DashboardController`** (invokable): KPIs — receita do mês, receita mês anterior, taxa de conversão, propostas por status, progresso da meta
- **Dashboard `/consultor`:**
  - Banner de boas-vindas com tabela de preço do consultor e comissão
  - 4 KPI cards: Receita do Mês, Comissão Estimada, Propostas Aceitas, Taxa de Conversão
  - `LinearProgress` de meta mensal com percentual
  - Lista de propostas recentes com chips de status coloridos
  - `PieChart` (Recharts) com distribuição de status das propostas
- **`User::isConsultant()`** e separação de acesso: consultores em `/consultor`, admins em `/admin`, `isAdmin()` retorna true para ambos

### FASE 12 — Portal B2B para Integradores ✅

- **`Company` model (domínio `B2b`):** uuid, razao_social, cnpj (único), nome_fantasia, ie, type (integrador/distribuidor/engenharia/revendedor), status flow (pending/active/suspended/rejected), price_list_id, credit_limit_cents, payment_terms_days, extra_discount_pct
  - `effectivePrice(int $publicPriceCents)`: aplica tabela + desconto extra
  - `statusLabel()`, `statusColor()`, `typeLabel()`
- **`CompanyProject` model:** name, client_name, city, state, type, system_kwp, status, notes, contract_value_cents
- **Tabela pivot `company_users`:** company_id, user_id, role (owner/member/viewer), is_primary
- **`B2bController` (storefront):**
  - `GET /portal-b2b` → landing page marketing
  - `GET /portal-b2b/cadastrar` → formulário de cadastro
  - `POST /portal-b2b/cadastrar` → cria company + vincula usuário
  - `GET /portal-b2b/dashboard` → painel da empresa (requer company ativa)
  - `GET /portal-b2b/projetos` + `POST` → gestão de projetos/obras
- **`CompanyController` (admin):**
  - `GET /admin/companies` → listagem com KPIs (pendentes/ativos/total), filtros, aprovação rápida inline
  - `GET /admin/companies/{uuid}` → detalhe: membros, projetos, condições comerciais
  - `POST /admin/companies/{uuid}/approve` → aprova + atribui tabela de preço automática (INTEGRADOR ou DISTRIB por tipo) + propaga a todos os usuários da empresa
  - `POST /admin/companies/{uuid}/reject` / `suspend`
  - `PATCH /admin/companies/{uuid}/commercial` → edita condições comerciais
- **Landing B2B `/portal-b2b`:** hero gradiente com chip dourado, benefícios (4 cards hover animado), tipos de empresa elegíveis (4 cards com checkmark), CTA final
- **AdminLayout:** seção "Portal B2B" com Empresas e Tabelas de Preço no menu lateral

### Propostas Comerciais — Estrutura Base ✅

- **`Proposal` model (domínio `Orders`):** uuid, reference (PROP-XXXXXX), user_id (consultor), customer_id, price_list_id, status flow (draft/sent/viewed/accepted/rejected/expired/converted), valid_until, discount_percent, service_cents, notes, pdf_path
  - `isEditable()`, `isExpired()`, `recalculate()`, `statusLabel()`, `statusColor()`
- **`ProposalItem` model:** product_id, sku, name, unit_price_cents, discount_percent, quantity, total_cents (auto-calculado no `booted()`)
  - `unitPriceAfterDiscount()`: aplica desconto individual do item
- **`Service` model:** name, description, price_cents, category, is_active
- UI de criação de propostas ainda não implementada (botão "Nova Proposta" no dashboard do consultor aponta para `/consultor/propostas/criar`)

---

## Extras — Design e UX

### AdminLayout — Sidebar Redesenhada
- Gradiente `#0D1B3E → #111827`
- Itens ativos: borda azul esquerda 3px + fundo `rgba(11,95,255,0.2)`
- Card do usuário no rodapé com avatar gradiente + menu contextual
- AppBar com `backdropFilter: blur(12px)` glassmorphism
- 7 seções: Geral, Catálogo, Operações, Estoque, Marketing, Análises, Atendimento, Integrações
- Botão "Importar CSV" e "Flash Sales" e "ERP/API Externa" no menu

### Dashboard Admin — Gráficos Recharts
- `AreaChart` receita 30 dias com gradiente azul
- `BarChart` novos clientes 30 dias
- `PieChart` receita por categoria (top 5) com legenda
- KPI cards gradiente: azul (receita), roxo (pedidos), verde (produtos), laranja (clientes)
- Top 8 produtos com barras de progresso relativo + botão **"Exportar CSV"** client-side
- Alertas contextuais no banner: pedidos pendentes, estoque baixo

### Homepage — Redesign Completo
- **Hero:** gradiente profundo `#0D1B3E → #0B5FFF`, anéis decorativos, texto com gradiente amarelo, badges flutuantes (CO₂, garantia, ICMS)
- **Benefits bar:** 5 benefícios em grid horizontal com borda divisória
- **Stats section:** 15.000+ clientes, 50MW+ instalados, 12.000+ pedidos, 25 anos garantia
- **Categorias:** gradiente por tipo (`CAT_STYLE` map), emoji, hover com sombra colorida
- **Testimoniais:** 3 depoimentos com estrelas, nome, cidade, produto
- **Brands:** tags elegantes com hover colorido

### ProductGallery.tsx — Galeria Profissional
- **Layout:** thumbnails verticais à esquerda (desktop) / horizontais abaixo (mobile)
- **Thumbnails:** 82px, border-radius 12px, spring animation `cubic-bezier(0.34,1.56,0.64,1)`, overlay azul no ativo
- **Imagem principal:** `object-fit: cover` sem padding, border-radius 20px, crossfade 130ms
- **Painel de zoom externo:** 500×500px, `3.0×` ampliação, posicionado com `left: calc(100% + 20px)` — só em `xl+`
- **Sem círculo azul:** cursor de lupa removido; painel externo é o único indicador de zoom
- **Lightbox:** backdrop 95% + blur 12px, animação spring `lbIn`, thumbnails com hover scale, header pill estilo macOS
- **Dots de progresso:** pill animado que alarga no ativo (até 10 imagens)
- **Grid 50/50:** `md: 6` + `md: 6` com galeria `position: sticky; top: 88px`

### Componentes Storefront Criados

| Componente | Descrição |
|---|---|
| `AnnouncementBar.tsx` | Barra rotativa 4 mensagens, dots de navegação, auto-rotate 4.5s, botão fechar |
| `WhatsAppButton.tsx` | Botão flutuante verde com balão de chat macOS-style, pulsing badge |
| `ComparisonBar.tsx` | Barra sticky footer (fundo `#0D1B3E`, borda `#FFB300`), slots vazios, max 4 |
| `FrequentlyBought.tsx` | Checkboxes por produto, total dinâmico, botão add-all |
| `FlashSaleBanner.tsx` | Gradiente vermelho, countdown `HH:MM:SS` piscante <5min, barra de unidades |
| `QuoteModal.tsx` | Form empresa/CNPJ, feedback de sucesso |
| `ShippingCalculator.tsx` | CEP mask, ViaCEP, simulação PAC/SEDEX por faixa de CEP |
| `SocialProof.tsx` | Dot verde pulsante + "X vendo agora" flutuante + vendidos + urgência |
| `ProductGallery.tsx` | Galeria completa com zoom externo 3×, lightbox, sticky |

---

## Extras — Funcionalidades de Negócio

### Comparação de Produtos
- **Hook:** `useComparison.ts` (localStorage, max 4, persist entre páginas)
- **ComparisonBar:** fundo escuro, slots vazios indicativos, botão "Comparar (N)" habilitado com ≥2
- **Página `/comparar`:** tabela com preço, disponibilidade, SKU, peso, specs dinâmicas coloridas por produto
- **CompareController:** resolve por `ids` query param, verifica estoque via `DB::table('stocks')`
- **ProductCard:** botão "Comparar" roxo, muda para "Na comparação ✓"

### Cotação / Orçamento para Grandes Volumes
- **Quote model:** uuid, user_id, name, email, phone, company, cnpj, items JSON, status flow (5 estados)
- **QuoteModal.tsx:** form com empresa/CNPJ opcionais, feedback de sucesso
- **Botão** na página do produto: "🧾 Solicitar Cotação (Grandes Volumes)"
- **Admin `/admin/quotes`:** listagem com KPIs (pendentes, total, aceitas) + show/update
- **NewQuoteNotification:** email queued para admins com total estimado

### Gestão de Devoluções / RMA
- **ReturnRequest model** (tabela `returns`): uuid, order_id, reason, description, items JSON, images JSON, status flow (5 estados), timestamps por transição
- **ReturnController (cliente):** create (form + upload fotos), store (verifica ownership), list
- **ReturnAdminController:** listagem com KPIs, show, updateStatus (com timestamps automáticos)
- **Admin `/admin/returns`:** menu "Devoluções / RMA" na seção Atendimento

### Sistema de Suporte / Tickets
- **SupportTicket model:** uuid, categorias, prioridades, status flow (5 estados)
- **SupportReply model:** is_staff flag (define visual do lado da resposta)
- **SupportTicketController (cliente):** create, store (com primeira reply), show (thread), reply
- **SupportTicketAdminController:** listagem com filtros status/prioridade, KPIs, reply (muda status para "waiting"), updateStatus
- **Lógica:** Admin responde → "Aguardando cliente"; Cliente replica → volta para "Aberto"

### Recuperação de Carrinho Abandonado
- Colunas `abandoned_at` e `recovery_email_sent_at` na tabela `carts`
- **AbandonedCartNotification:** email queued com nome, contagem de itens, total
- **AbandonedCartRecoveryJob:** verifica carrinhos >2h sem atividade, não envia se já comprou recentemente
- Agendado **hourly** via `Schedule::job()->hourly()` no `console.php`

### Importação CSV de Produtos
- **ProductImportController:** 3 modos (create_only, update_existing, create_and_update)
- **15 colunas suportadas:** SKU\*, Nome\*, Descricao_curta, Descricao_completa, Preco_venda_reais\*, Preco_de_reais, Custo_reais, Status, Marca, Categoria_slug, Peso_gramas, Estoque, Destaque, Meta_titulo, Meta_descricao
- Pré-visualização das primeiras 5 linhas no frontend
- Resolução automática de marca (cria se não existir) e categoria por slug
- Conversão automática: reais → centavos (price_cents)
- Histórico de importações via `sync_logs` (source: 'csv_import')
- Download de template em `/admin/products/import/template`

### Kit Builder Interativo
- **Wizard 4 passos:** Painel Solar → Inversor → Estrutura de Fixação → Cabos → Resumo
- **KitBuilderController:** endpoints `GET /api/kit-builder/inverters`, `GET /api/kit-builder/accessories`
- **KitBuilder.tsx:** sidebar "Kit em andamento" com total acumulado e parcelamento
- Botão "Adicionar Kit Completo ao Carrinho" envia todos os produtos sequencialmente
- Acessível em `/monte-seu-kit`

### Upsell / Frequentemente Comprados Juntos
- **Tabela `product_relations`:** type (frequently_bought / cross_sell / upsell), position
- **`frequentlyBoughtWith()`** no Product model:
  1. Busca relações manuais cadastradas (`type = 'frequently_bought'`)
  2. Fallback: co-ocorrência em `order_items` (produtos no mesmo pedido, ordenado por frequência)
- **FrequentlyBought.tsx:** checkboxes individuais, total dinâmico, botão "Adicionar X itens ao carrinho"

### Integração ERP / API Externa
- **IntegrationController:** test connection, run sync, download schema JSON, clear logs
- **Admin `/admin/integration`** — 4 tabs:
  1. **Status & Config:** semáforo visual de variáveis + bloco código .env + guia de configuração
  2. **Histórico:** tabela de execuções (status, duração, totais, erros expandíveis)
  3. **Schema JSON:** viewer interativo com syntax highlighting (5 seções expansíveis) + download `.json`
  4. **Mapeamento de Campos:** tabela campos externos → internos com tipos e conversões
- KPIs: produtos sincronizados, total syncs, taxa de sucesso, última sync

### Frete Grátis Dinâmico
- `HandleInertiaRequests` compartilha `branding.free_shipping_min_cents` e `branding.free_shipping_enabled`
- Corrigido em 3 lugares: `StorefrontLayout` (top bar), `Home.tsx` (benefícios), `Product.tsx` (garantias)
- `Cart.tsx`: `LinearProgress` mostrando progresso até frete grátis com `formatBRL(remaining)`
- Configurável pelo admin em `/admin/settings` sem deploy

---

## Bugs Corrigidos

| Bug | Causa raiz | Fix aplicado |
|---|---|---|
| 500 em TODAS as rotas | `CompareController` como invokable sem `__invoke()` | `[CompareController::class, 'index']` |
| Favoritos 500 | `using(Pivot::class)` tentava gravar `updated_at` inexistente em `favorites` | Removido `using()` do `favoriteProducts()` |
| Pagination crash (`last_page` undefined) | Prop `data=` em vez de `pagination=` em 4 páginas (Newsletter, Blog, Reviews) | Corrigido + `Pagination.tsx` defensivo com `if (!pagination \|\| ...)` |
| Dashboard 500 (`Stock` model not found) | `Stock` model não existe — `StockService` usa `DB::table('stocks')` | Substituído por `DB::table('stocks')->where('quantity_available', ...')` |
| Category lazy loading violation | `mapCategory()` recursia além de 3 níveis eager | 4º nível adicionado no repository + `relationLoaded()` guard |
| Frete grátis hardcoded `R$ 2.000` | Valor fixo no código PHP/TSX | Lê `branding.free_shipping_min_cents` via Inertia shared props |
| Status de produto em inglês | `Chip label={product.status}` retornava valor raw `published` | `status_label` e `status_color` adicionados no InventoryController |
| Inputs de preço com `¢` | `InputAdornment` incorreto no `Products/Form.tsx` | Trocado por `R$` + conversão ÷100 para display e ×100 para armazenar |
| Pg admin/newsletter crash | `<Pagination data={subscribers} />` | `<Pagination pagination={subscribers} />` |
| Logout GET 405 | AdminLayout usava `<Link href="/logout">` (GET) | Trocado para `router.post('/logout')` |
| 2FA BaconQrCode TypeError | Versão incompatível de `bacon/bacon-qr-code` | Driver SVG sem Imagick |
| Containerização de largura excessiva | `Container maxWidth="xl"` (1536px) em todas as páginas | Alterado para `maxWidth="lg"` (1200px) |
| Cards estreitos após redução container | Grid `lg: 3` (4 colunas) com 1200px | Alterado para `lg: 4` (3 colunas) + `spacing={3}` |
| Espaço em branco abaixo da galeria | Grid `alignItems: 'stretch'` + galeria sem sticky | `alignItems: 'flex-start'` + `position: sticky; top: 88px` na galeria |

---

## Convenções e Regras do Projeto

```
✓ Nunca query Eloquent em Controller — vai pelo Repository
✓ Sempre DTO entre camadas
✓ declare(strict_types=1) em todo arquivo PHP
✓ Storage local: disk('public') ou disk('products') — NUNCA S3
✓ Dinheiro: sempre em centavos (int) — NUNCA float
✓ Testes com Eloquent em Sail (Feature tests) — locais só para lógica pura
✓ ElementType: importar de 'react' — NÃO de '@mui/material'
✓ Props MUI 9: sx prop — NÃO como prop direta
✓ Conteúdo UI: sempre pt-BR
✓ Código e variáveis: sempre inglês
✓ Pagination prop: 'pagination=' — NUNCA 'data='
✓ npm run build ao final: deve ter 0 erros TypeScript
✓ Return model: ReturnRequest (Return é reservado no PHP)
✓ Pivot sem updated_at: NÃO usar using(Pivot::class)
✓ ProductImage.url(): verifica str_starts_with($path, 'http') para URLs externas
✓ Imagens de produto: object-fit cover, sem padding
✓ Controller invokable: só com __invoke() — caso contrário usar [Class, 'method']
```

---

## Arquivos-Chave — Referência Rápida

| O que | Arquivo |
|---|---|
| Bindings de repositórios | `app/Providers/RepositoryServiceProvider.php` |
| Registro de eventos | `app/Providers/EventServiceProvider.php` |
| Rotas completas | `routes/web.php` |
| Agendamentos | `routes/console.php` |
| Shared props Inertia | `app/Http/Middleware/HandleInertiaRequests.php` |
| Gateway de pagamento | `app/Domains/Payments/Gateways/` |
| ERP HTTP client | `app/Domains/Integrations/Services/HttpErpClient.php` |
| Sync de estoque | `app/Domains/Inventory/Services/InventorySyncService.php` |
| Simulador solar | `app/Domains/Marketing/Services/SolarSimulatorService.php` |
| Settings com cache | `app/Domains/Settings/Services/SettingsService.php` |
| Galeria de imagens | `resources/js/Components/storefront/ProductGallery.tsx` |
| Kit Builder | `resources/js/Pages/Storefront/KitBuilder.tsx` |
| Tema MUI | `resources/js/Theme/theme.ts` |
| Tipos TypeScript | `resources/js/Types/inertia.d.ts` + `catalog.ts` |
| Tabelas de Preço (admin) | `resources/js/Pages/Admin/PriceLists/Index.tsx` |
| Empresas B2B (admin) | `resources/js/Pages/Admin/Companies/Index.tsx` |
| Portal B2B (loja) | `resources/js/Pages/Storefront/B2b/Landing.tsx` |
| Painel Consultor | `resources/js/Pages/Consultant/Dashboard.tsx` |
| Layout Consultor | `resources/js/Layouts/ConsultantLayout.tsx` |
| Middleware Consultor | `app/Http/Middleware/EnsureConsultant.php` |
| Model PriceList | `app/Domains/Catalog/Models/PriceList.php` |
| Model Company | `app/Domains/B2b/Models/Company.php` |
| Model Proposal | `app/Domains/Orders/Models/Proposal.php` |
| Model ConsultantProfile | `app/Domains/Consultant/Models/ConsultantProfile.php` |

---

## Configuração para Produção

```dotenv
# Gateway de pagamento
PAYMENT_GATEWAY=asaas
ASAAS_API_KEY=sua_chave_aqui
ASAAS_ENVIRONMENT=production

# ERP / Distribuidor
ERP_BASE_URL=https://api.seu-distribuidor.com.br
ERP_API_KEY=sua_chave_api
ERP_SYNC_ENABLED=true

# Login Social Google
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URL=https://seudominio.com.br/auth/google/callback
```

**Checklist de produção:**
- [ ] `php artisan config:cache && php artisan route:cache`
- [ ] `npm run build` e deploy de `public/build/`
- [ ] Horizon como serviço systemd
- [ ] Cron: `* * * * * php artisan schedule:run`
- [ ] Adaptar `HttpErpClient::mapProduct()` para o formato real do distribuidor
- [ ] Google OAuth: criar projeto no Google Console e habilitar Google+ API
- [ ] SSL configurado (obrigatório para OAuth e webhooks)

---

## Próximos Passos

### 🔴 Crítico
1. **Asaas** — `PAYMENT_GATEWAY=asaas` + `ASAAS_API_KEY`
2. **ERP** — `ERP_BASE_URL` + `ERP_API_KEY` + adaptar `mapProduct()`
3. **Google OAuth** — Google Console + variáveis GOOGLE_*
4. **Notas Fiscais** — integração Focus NFe / NFe.io (obrigatório B2B)

### 🟠 Alta Prioridade
1. **Proposta Comercial — UI completa** — formulário de criação (`/consultor/propostas/criar`), página de edição, envio por email, geração de PDF, página de aceite pública (`/proposta/{uuid}`)
2. Testes Feature para todas as features novas (cobertura ≥ 80%)
3. Email sequences pós-compra (entregue → avaliação → recomendação)
4. Conciliação financeira (Asaas × pedidos)

### 🟡 Média Prioridade
1. **Portal B2B — Dashboard da Empresa** — exibir tabela de preço ativa, crédito disponível, últimas compras, projetos
2. **Portal Consultor — Clientes** — lista de clientes com últimas interações, criação de proposta por cliente
3. PWA — manifest.json + Service Worker
4. Rastreamento Correios API (SRO)
5. PHPStan nível 8
6. Wishlist compartilhável (URL pública)
7. Notificações Push (browser notifications)
