# 03 — Modelo de Domínio

Este documento descreve as entidades de negócio, seus atributos principais e relacionamentos. Os domínios espelham as pastas em `app/Domains`.

---

## 1. Catalog (Catálogo)

### Product
O coração do catálogo. Pode ser simples ou variável (com variações).

Atributos: `id`, `uuid`, `name`, `slug`, `sku`, `description` (rich text), `short_description`, `price_cents`, `compare_at_price_cents` (preço "de"), `cost_cents`, `status` (draft/published/archived), `brand_id`, `weight_grams`, `length_mm`, `width_mm`, `height_mm`, `specifications` (JSON), `featured` (bool), `published_at`, `external_id` (id no ERP/distribuidor), `synced_at`.

Relacionamentos: pertence a `Brand`; muitos-para-muitos com `Category`; tem muitos `ProductImage`, `ProductVariant`, `ProductAttributeValue`, `Review`, `Question`, `ProductDownload` (datasheets, manuais).

### Category
Hierarquia infinita (árvore). Use padrão **nested set** ou `parent_id` + path materializado.

Atributos: `id`, `name`, `slug`, `parent_id`, `description`, `image`, `icon`, `position`, `is_active`, campos de SEO.

Exemplo de árvore:
```
Energia Solar
├── Kits
│   ├── On Grid
│   ├── Off Grid
│   └── Híbrido
├── Painéis / Módulos
├── Inversores
└── Baterias
Mobilidade Elétrica
├── Bicicletas
└── Patinetes
```

### Brand (Marca)
`id`, `name`, `slug`, `logo`, `description`, `is_active`, SEO.

### Attribute / AttributeValue
Atributos filtráveis e específicos por categoria (ex.: Potência, Tensão, Tecnologia da célula, Garantia).
- `Attribute`: `name`, `slug`, `type` (select, range, boolean, text), `unit` (ex.: W, V).
- `AttributeValue`: valor possível. Ligado a produtos via `product_attribute_values`.

### ProductVariant
Para produtos com variações (ex.: potências diferentes). `sku`, `price_cents`, `stock`, atributos da variação.

---

## 2. Inventory (Estoque)

### Stock
Saldo por produto/variante. `product_id`, `variant_id`, `quantity_available`, `quantity_reserved`, `warehouse_id`, `updated_at`.

### StockReservation
Reserva temporária durante checkout. `order_id`, `product_id`, `quantity`, `expires_at`, `status`.

### StockMovement
Histórico de toda movimentação (auditoria). `product_id`, `type` (in/out/reservation/release/sync), `quantity`, `reason`, `reference`, `user_id`, `created_at`.

### SyncLog
Log de cada sincronização com fonte externa (ver `docs/08-integrations.md`). Nunca apaga dados sem registro aqui.

---

## 3. Customers (Clientes)

### Customer
Estende/relaciona com `User` (auth). `name`, `email`, `phone`, `cpf_cnpj`, `type` (pf/pj), `birth_date`, `accepts_marketing`, pontuação/segmentação.

### Address
`customer_id`, `label`, `recipient`, `cep`, `street`, `number`, `complement`, `district`, `city`, `state`, `is_default_shipping`, `is_default_billing`.

### Favorite (Wishlist)
`customer_id`, `product_id`, `created_at`.

---

## 4. Orders (Pedidos)

### Cart
Carrinho. Pode ser de sessão (visitante) ou persistido (logado). `customer_id` (nullable), `session_id`, itens, `coupon_id`, totais calculados.

### CartItem
`cart_id`, `product_id`, `variant_id`, `quantity`, `unit_price_cents` (snapshot).

### Order
Pedido fechado. `uuid`, `customer_id`, `status` (enum `OrderStatus`), `subtotal_cents`, `discount_cents`, `shipping_cents`, `total_cents`, `coupon_id`, `shipping_address` (snapshot JSON), `billing_address` (snapshot), `notes`, `placed_at`.

### OrderItem
`order_id`, `product_id`, `variant_id`, `name` (snapshot), `sku` (snapshot), `unit_price_cents`, `quantity`, `total_cents`.

### Shipment (Expedição)
`order_id`, `carrier`, `service`, `tracking_code`, `label_url`, `status`, `shipped_at`, `delivered_at`, `cost_cents`.

---

## 5. Payments (Pagamentos)

### Payment
`order_id`, `method` (enum `PaymentMethod`: pix/boleto/credit_card), `gateway`, `gateway_transaction_id`, `status` (enum `PaymentStatus`), `amount_cents`, `installments`, `paid_at`, `payload` (JSON da resposta do gateway), `expires_at`.

### PaymentWebhook
Registro de webhooks recebidos para idempotência e auditoria. `gateway`, `event`, `payload`, `processed_at`.

---

## 6. Financial (Financeiro)

### Transaction
Lançamento financeiro. `type` (revenue/expense), `category`, `amount_cents`, `order_id` (nullable), `description`, `date`, `status`.

### Reconciliation (Conciliação)
Casamento entre `Payment` recebido e extrato do gateway/banco.

### Commission
Comissões (para vendedores/representantes — base para o futuro). `order_id`, `beneficiary_id`, `amount_cents`, `status`.

Relatórios derivados: Fluxo de caixa, DRE. Ver `docs/07-features-admin.md`.

---

## 7. Marketing

### Coupon
`code`, `type` (percentage/fixed/free_shipping), `value`, `min_order_cents`, `max_uses`, `used_count`, `starts_at`, `expires_at`, `is_active`, restrições (categorias/produtos/clientes).

### Campaign / Banner / LandingPage
Conteúdo promocional. Banners com posição, imagem, link, agendamento. Landing pages com builder simples (blocos).

---

## 8. Support (Suporte)

### Ticket
`customer_id`, `subject`, `status`, `priority`, mensagens relacionadas. Base para SAC.

### Review (Avaliação)
`product_id`, `customer_id`, `rating` (1-5), `title`, `comment`, `status` (pending/approved/rejected), `verified_purchase`.

### Question
Perguntas e respostas na página de produto.

---

## 9. Settings (Configurações)

Chave-valor tipado para configurações da loja: dados da empresa, métodos de pagamento ativos, regras de frete, notificações, integrações. Cache agressivo.

---

## 10. Auth

`User` (Laravel base) + papéis e permissões (`spatie/laravel-permission`). Papéis sugeridos: `customer`, `admin`, `manager`, `finance`, `stock`, `support`. Ver `docs/09-security.md`.

---

## 11. Diagrama de Relacionamentos (resumo textual)

```
Customer 1—N Address
Customer 1—N Order
Customer 1—N Favorite N—1 Product
Order 1—N OrderItem N—1 Product
Order 1—1 Shipment
Order 1—N Payment
Product N—N Category
Product N—1 Brand
Product 1—N ProductImage
Product 1—N ProductVariant
Product 1—N Review N—1 Customer
Product 1—1 Stock 1—N StockMovement
Coupon 1—N Order
```
