# 03 — Modelo de Domínio

Este documento descreve as entidades de negócio, seus atributos principais, relacionamentos e responsabilidades de cada domínio.

---

## Mapa de Domínios

```
app/Domains/
├── Auth/                  — autenticação, login social Google
├── B2b/                   — empresas B2B, projetos/obras, portal para integradores
├── Catalog/               — produtos, categorias, marcas, atributos, relações, tabelas de preço
├── Checkout/              — ações de checkout e fluxo de compra
├── Consultant/            — perfil do consultor, comissão, metas
├── Customers/             — clientes, endereços, favoritos, alertas de estoque
├── Financial/             — transações, DRE, conciliação financeira
├── Integrations/          — clientes HTTP para APIs externas (ERP/distribuidor)
├── Inventory/             — estoque, movimentações, sync, alertas
├── Marketing/             — cupons, flash sales, reviews+fotos, Q&A, newsletter, blog
├── Orders/                — carrinhos, pedidos, cotações, devoluções/RMA, propostas comerciais
├── Payments/              — gateways, transações, webhooks
├── Reports/               — KPIs e serviço de relatórios
├── Settings/              — configurações globais com cache automático
└── Support/               — tickets de suporte e respostas
```

---

## Domínio: Auth (e User model)

### `User` — campos adicionados para B2B e Consultor

```
price_list_id — FK para price_lists (nullable) — tabela explícita do usuário
company_id    — FK para companies (nullable) — empresa B2B vinculada
```

**Métodos de role adicionados:**
```php
isAdmin(): bool         // hasRole(['admin', 'consultant']) — acesso ao /admin
isSuperAdmin(): bool    // hasRole('admin') — apenas admin puro
isConsultant(): bool    // hasRole('consultant')
effectivePriceList(): ?PriceList  // prioridade: explícita → empresa → role → null
priceFor(int $priceCents): int    // preço final para o usuário
```

**Relacionamentos adicionados:**
```php
proposals(): HasMany        // propostas criadas pelo consultor
company(): BelongsTo        // empresa B2B do usuário
consultantProfile(): HasOne // perfil de consultor (comissão, metas)
```

---

## Domínio: Auth (OAuth)

**Models:** usa diretamente `App\Models\User`

**Serviços:**
- `AuthService` — `register()` (cria Customer + atribui role), `login()`, `logout()`
- `TwoFactorService` — `generateSecret()`, `enable()`, `disable()`, `verify()`, `verifyRecoveryCode()`
- `SocialiteController` — OAuth Google: redirect, callback, merge por email, criação automática de conta

**Campos especiais em `users`:**
```
google_id              — ID único do Google (nullable, unique)
avatar_url             — URL da foto de perfil do Google
auth_provider          — 'email' | 'google'
two_factor_secret      — segredo TOTP (hidden)
two_factor_recovery_codes — códigos de recuperação (JSON hidden)
two_factor_confirmed_at   — quando o 2FA foi confirmado
```

---

## Domínio: Catalog

### `PriceList` — tabelas de preço por segmento

```
id, name, code (unique, uppercase), description
type  — 'retail' | 'consultant' | 'wholesale' | 'special'
discount_percent  — % aplicado sobre price_cents do produto
is_default (bool) — a tabela PUBLICO (retail) é a padrão
is_active  (bool)
is_public  (bool) — visível na loja
valid_from (nullable), valid_until (nullable)
```

**Métodos:**
- `applyTo(int $priceCents): int` — calcula preço com desconto
- `typeLabel(): string` — descrição legível do tipo
- Scope `active()` — is_active + validade

### `ProductPrice` — preços customizados por tabela

```
price_list_id, product_id
price_cents        — preço específico para este produto/tabela
compare_at_cents   — preço "de" opcional
```

Permite sobrescrever o desconto percentual da tabela com um valor fixo por produto.

### `Product` — modelo central

| Campo | Tipo | Descrição |
|---|---|---|
| uuid | string | Identificador público (em URLs admin) |
| name | string | Nome completo |
| slug | string | URL amigável |
| sku | string | Código interno |
| price_cents | int | Preço de venda em centavos |
| compare_at_price_cents | int? | Preço "de" para desconto |
| cost_cents | int? | Custo interno |
| status | enum | draft \| published \| archived |
| brand_id | int? | FK para brands |
| weight_grams | int? | Peso em gramas |
| specifications | JSON? | Objeto chave-valor de especificações técnicas |
| featured | bool | Produto em destaque |
| external_id | string? | ID no ERP/distribuidor |
| published_at | datetime? | Quando foi publicado |

**Relacionamentos:** `brand`, `categories` (M:M pivot `is_primary`), `images`, `variants`, `attributeValues`, `relatedProducts`

**Métodos especiais:**
- `hasDiscount()` — compare_at > price
- `discountPercent()` — % de desconto arredondado
- `coverImage()` — primeira imagem com `is_cover=true` ou a primeira
- `frequentlyBoughtWith(int $limit)` — busca relações manuais + fallback co-ocorrência em `order_items`
- `relatedProducts()` — BelongsToMany via `product_relations`

**Scopes:** `published()`, `featured()`

**Scout/Meilisearch:** `shouldBeSearchable()` só quando published; `toSearchableArray()` inclui brand_name, categories

### `ProductRelation` — tabela `product_relations`

```
product_id, related_product_id, type, position
type: 'frequently_bought' | 'cross_sell' | 'upsell'
```
Permite gerenciar upsell e produtos frequentemente comprados via admin.

### `ProductImage` — tabela `product_images`

```
product_id, path, alt, position, is_cover
```

**`url()`** — detecta se `path` começa com `http` para URLs externas (Picsum/CDN):
```php
if (str_starts_with($this->path, 'http')) return $this->path;
return Storage::disk('public')->url($this->path);
```

### `Category` — árvore auto-referente

```
name, slug, parent_id, description, image, icon
position, is_active, depth, meta_title, meta_description
```

Repository `tree()` eager-loads **4 níveis** de `children`:
```php
->with(['children', 'children.children',
        'children.children.children',
        'children.children.children.children'])
```
`CategoryController::mapCategory()` usa `$category->relationLoaded('children')` como guard.

### `Brand`, `Attribute`, `AttributeValue`

Simples. Brand tem `is_active`. Attribute tem `type` (text/select/number/boolean).

---

## Domínio: Customers

### `Customer` — 1:1 com User

```
user_id, type (individual|company), phone, cpf_cnpj, birth_date
```

### `Address`

```
customer_id, label, recipient, cep, street, number, complement
district, city, state, country, is_default_shipping, is_default_billing
```
`fullAddress()` — string formatada.

### Tabela `favorites` (pivot simples)

```
customer_id, product_id, created_at   ← SEM updated_at
```

> **IMPORTANTE:** não usar `using(Pivot::class)` neste relacionamento — a classe Pivot tem `$timestamps = true` e tentaria gravar `updated_at` que não existe. Relacionamento: `BelongsToMany` sem `using()`.

---

## Domínio: Inventory

### `StockAlert` — tabela `stock_alerts`

```
product_id, email, name (nullable)
token — Str::random(64), gerado no booted(), unique
notified_at (nullable) — quando a notificação foi enviada
```

### Tabelas via `DB::table()` (sem Model dedicado)

**`warehouses`:**
```
id, name, code, is_default, address (JSON)
```

**`stocks`** — saldo atual por produto/variante/armazém:
```
product_id, variant_id (nullable), warehouse_id
quantity_available   ← nome correto (não 'quantity')
quantity_reserved
```

**`stock_movements`** — auditoria completa:
```
product_id, variant_id, warehouse_id
type (in|out|reservation|release|sync|adjustment)
quantity (positivo = entrada, negativo = saída)
reason, reference, user_id
```

**`sync_logs`** — histórico de sincronizações:
```
source (erp|csv_import), started_at, finished_at, status
total_items, created_items, updated_items, error_items, errors (JSON)
```

---

## Domínio: Marketing

### `Coupon`

```
code, type (percentage|fixed|free_shipping), value
min_order_cents, max_uses, used_count, starts_at, expires_at, is_active
```
`isValid()`, `calculateDiscount(int $subtotalCents)`.

### `FlashSale`

```
title, product_id (nullable — null = todos os produtos em promoção)
discount_percent, max_quantity (nullable), sold_count
starts_at, ends_at, is_active
```
`isRunning()`, `hasStock()`, `remainingSeconds()`, `progressPercent()`
Scope `active()` — filtra por is_active + starts_at/ends_at.

### `Review`

```
product_id, user_id, order_item_id, rating (1-5), title, comment
images (JSON — array de URLs, até 4 fotos)
status (pending|approved|rejected), verified_purchase, reviewer_name
```
`authorName()`, Scope `approved()`.

### `Post`

```
title, slug (auto-gerado no booted), excerpt, content, cover_image
status (draft|published), published_at, post_category_id, user_id
SoftDeletes
```
`readingTime()` — estimativa em minutos baseada em palavras.

### `NewsletterSubscriber`

```
email, name, token (auto-gerado no booted), confirmed, confirmed_at, unsubscribed_at
```

---

## Domínio: Orders

### `Cart`

```
uuid, user_id (nullable — null = guest), session_id
coupon_id (nullable)
abandoned_at (nullable)          ← adicionado para recuperação
recovery_email_sent_at (nullable) ← controle de envio
```
`totalCents()`, `itemCount()`, `isEmpty()`.

### `Order`

```
uuid, user_id, status (OrderStatus enum)
subtotal_cents, discount_cents, shipping_cents, total_cents
shipping_address (JSON), placed_at, notes
```

`OrderStatus` enum: `pending → awaiting_payment → paid → processing → shipped → delivered` (+ `canceled`, `refunded`)
`canTransitionTo(OrderStatus $next)` — máquina de estados.
`label()`, `color()` — retornam strings em pt-BR.

### `Quote`

```
uuid, user_id (nullable), name, email, phone, company, cnpj
items (JSON — [{product_id, name, sku, qty, price_cents}])
message, status, quoted_total_cents, discount_percent
admin_notes, expires_at, responded_at
```
Status flow: `pending → reviewing → sent → accepted → rejected`

### `ReturnRequest` — tabela `returns`

> **Nota:** `Return` é palavra reservada em PHP. O model é `ReturnRequest` com `protected $table = 'returns'`.

```
uuid, order_id, user_id, reason, description
items (JSON), images (JSON — fotos do produto com defeito)
status, refund_amount_cents, refund_method (original|credit|bank_transfer)
admin_notes, approved_at, received_at, refunded_at
```
Status flow: `requested → approved → received → refunded` (ou `rejected`)
Timestamps automáticos por transição de status no controller.

### `Proposal` — propostas comerciais

```
uuid, reference (PROP-XXXXXX — auto-gerado no booted)
user_id (consultor), customer_id (cliente/empresa)
price_list_id — tabela de preço aplicada
status  — draft | sent | viewed | accepted | rejected | expired | converted
valid_until, discount_percent (desconto global)
subtotal_cents, service_cents, total_cents
notes, pdf_path
sent_at, viewed_at, accepted_at, rejected_at, converted_at
```

**Métodos:**
- `isEditable()` — somente quando `draft`
- `isExpired()` — valid_until < now() quando não aceita/convertida
- `recalculate()` — recalcula subtotal + serviços + desconto
- `statusLabel()`, `statusColor()`

Status flow: `draft → sent → viewed → accepted|rejected → converted`

### `ProposalItem` — itens de uma proposta

```
proposal_id, product_id
sku, name — snapshot no momento da criação
unit_price_cents, discount_percent, quantity
total_cents — auto-calculado no booted() antes de salvar
```

`unitPriceAfterDiscount(): int` — aplica desconto individual.

### `Service` — catálogo de serviços da empresa

```
name, description, price_cents
category (installation|engineering|maintenance|consulting|other)
is_active
```

---

## Domínio: Payments

### `Payment`

```
uuid, order_id
method — PaymentMethod enum (Pix|Boleto|CreditCard)
status — PaymentStatus enum (pending|processing|paid|failed|refunded|canceled)
amount_cents, gateway (mock|asaas), gateway_id, gateway_data (JSON)
pix_qr_code, pix_copy_paste, boleto_url, boleto_barcode
paid_at, expires_at, failed_at, refunded_at
```

### `PaymentWebhook` — idempotência

```
gateway, event_type, gateway_event_id (unique por gateway), payload (JSON), processed_at
```

---

## Domínio: Support

### `SupportTicket`

```
uuid, user_id (nullable), name, email, subject
category (general|technical|order|payment|returns)
priority (low|normal|high|urgent)
status (open|in_progress|waiting|resolved|closed)
order_id (nullable)
```
`statusLabel()`, `statusColor()`, `priorityLabel()`, `categoryLabel()`.

**Lógica de status:**
- Admin responde → status = `waiting` (aguardando cliente)
- Cliente replica → status volta para `open`

### `SupportReply`

```
ticket_id, user_id (nullable), message, is_staff (bool), attachments (JSON)
```
`is_staff = true` → exibe badge da equipe na thread.

---

## Domínio: B2b

### `Company` — empresa B2B

```
uuid, razao_social, cnpj (unique), nome_fantasia, ie
type  — integrador | distribuidor | engenharia | revendedor
status — pending | active | suspended | rejected
contact_name, contact_email, contact_phone
address (JSON — cep, street, number, district, city, state)
price_list_id — FK para price_lists
credit_limit_cents — limite de crédito aprovado
payment_terms_days — prazo de pagamento (ex: 30 dias)
extra_discount_pct — desconto adicional além da tabela
approved_at, rejected_at, suspended_at
admin_notes
```

**Métodos:**
- `effectivePrice(int $publicPriceCents): int` — aplica tabela + extra_discount_pct
- `statusLabel()`, `statusColor()`, `typeLabel()`

**Relacionamentos:**
```php
users(): BelongsToMany via company_users (pivot: role, is_primary)
projects(): HasMany → CompanyProject
priceList(): BelongsTo → PriceList
```

### `CompanyProject` — projetos/obras da empresa

```
company_id, name, client_name
city, state
type (residential|commercial|industrial|rural|agro)
system_kwp (decimal) — potência do sistema
status (prospect|approved|in_progress|completed|canceled)
notes, contract_value_cents
started_at, completed_at
```

### Tabela pivot `company_users`

```
company_id, user_id
role — owner | member | viewer
is_primary (bool)
```

---

## Domínio: Consultant

### `ConsultantProfile` — perfil do consultor

```
user_id (unique, FK users)
region — ex: 'SP', 'RJ', 'Sul'
commission_pct — percentual de comissão (ex: 5.00)
price_list_id — FK para price_lists (tabela especial do consultor)
monthly_goal_cents — meta mensal de receita
proposal_goal — meta de propostas enviadas/mês
total_revenue_cents — receita acumulada total
proposals_sent, proposals_accepted — contadores
```

**Métodos:**
- `conversionRate(): float` — proposals_accepted / proposals_sent × 100
- `monthlyGoalProgress(int $currentMonthRevenue): float` — % da meta atingida

---

## Diagrama de Relacionamentos Principais

```
User (google_id, auth_provider, price_list_id, company_id)
  ├── Customer ──── Address[]
  │       └─────── Product[] (favorites — pivot SEM updated_at)
  │       └─────── StockAlert[]
  │
  ├── Order[] ──── OrderItem[] ──── Product
  │       ├─────── Payment[]
  │       └─────── Shipment
  │
  ├── Cart ──── CartItem[] ──── Product
  │       └── Coupon
  │
  ├── Quote (items JSON)
  ├── ReturnRequest (items JSON, images JSON)
  ├── SupportTicket[] ──── SupportReply[]
  ├── Proposal[] ──── ProposalItem[] ──── Product
  ├── Company (via company_users pivot)
  └── ConsultantProfile (1:1)

Company ──── CompanyProject[]
        ──── User[] (via company_users)
        ──── PriceList

PriceList ──── User[] (price_list_id)
          ──── Company[] (price_list_id)
          ──── ProductPrice[] (preços customizados)

Product ──── Brand
        ──── Category[] (M:M pivot is_primary — árvore 4 níveis)
        ──── ProductImage[] (url() detecta http externo)
        ──── ProductVariant[]
        ──── ProductRelation[] (frequently_bought|cross_sell|upsell)
        ──── Review[] (images JSON — até 4 fotos)
        ──── Question[] ──── Answer[]
        ──── FlashSale[] (nullable product_id = todos)
        ──── StockAlert[]
        ──── stocks (DB::table — quantity_available, quantity_reserved)
        ──── ProductPrice[] (preços por tabela de preço)

SyncLog — histórico de: ERP sync + CSV import
```
