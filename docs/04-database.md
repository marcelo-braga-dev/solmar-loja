# 04 — Banco de Dados

## 1. Princípios

- **MySQL 8** com charset `utf8mb4` / collation `utf8mb4_unicode_ci`.
- Dinheiro sempre em **inteiros (centavos)**: colunas `*_cents BIGINT UNSIGNED`. Nunca `FLOAT`/`DOUBLE`.
- Toda tabela tem `id BIGINT UNSIGNED AUTO_INCREMENT` + `created_at` / `updated_at`.
- Entidades expostas em URL/API têm também `uuid CHAR(36)` único.
- **Soft deletes** (`deleted_at`) em entidades de negócio que não devem sumir (produtos, pedidos, clientes).
- **Índices** em toda FK e em colunas usadas para filtro, ordenação e busca.
- **Foreign keys** com `ON DELETE` apropriado (restrict por padrão; cascade só quando o filho não faz sentido sozinho).

---

## 2. Convenções de Migration

- Uma migration por mudança. Nome descritivo: `2025_01_01_000000_create_products_table.php`.
- Use os helpers do Schema builder; defina índices na própria migration.
- Para enums, use coluna `string` + cast no Model (não `ENUM` nativo do MySQL — difícil de evoluir).
- Migrations devem ser reversíveis (`down()`).

```php
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->uuid('uuid')->unique();
    $table->string('name');
    $table->string('slug')->unique();
    $table->string('sku')->unique();
    $table->text('short_description')->nullable();
    $table->longText('description')->nullable();
    $table->unsignedBigInteger('price_cents');
    $table->unsignedBigInteger('compare_at_price_cents')->nullable();
    $table->unsignedBigInteger('cost_cents')->nullable();
    $table->string('status')->default('draft')->index();
    $table->foreignId('brand_id')->nullable()->constrained()->nullOnDelete();
    $table->unsignedInteger('weight_grams')->nullable();
    $table->unsignedInteger('length_mm')->nullable();
    $table->unsignedInteger('width_mm')->nullable();
    $table->unsignedInteger('height_mm')->nullable();
    $table->json('specifications')->nullable();
    $table->boolean('featured')->default(false)->index();
    $table->string('external_id')->nullable()->index();
    $table->timestamp('published_at')->nullable();
    $table->timestamp('synced_at')->nullable();
    $table->timestamps();
    $table->softDeletes();

    $table->index(['status', 'featured']);
    $table->index('price_cents');
});
```

---

## 3. Principais Tabelas

### Catálogo
- `products`, `product_images`, `product_variants`, `product_downloads`
- `categories` (com `parent_id` self-FK + `_lft`/`_rgt`/`depth` se usar nested set)
- `brands`
- `attributes`, `attribute_values`, `product_attribute_values` (pivot)
- `category_product` (pivot N-N)

### Clientes
- `users`, `customers`, `addresses`, `favorites`
- `roles`, `permissions`, `model_has_roles`, etc. (spatie)

### Pedidos
- `carts`, `cart_items`
- `orders`, `order_items`, `shipments`

### Pagamentos
- `payments`, `payment_webhooks`

### Estoque
- `warehouses`, `stocks`, `stock_reservations`, `stock_movements`, `sync_logs`

### Financeiro
- `transactions`, `reconciliations`, `commissions`

### Marketing
- `coupons`, `coupon_usages`, `campaigns`, `banners`, `landing_pages`

### Suporte / Conteúdo
- `reviews`, `questions`, `answers`, `tickets`, `ticket_messages`
- `posts`, `post_categories` (blog)

### Sistema
- `settings`, `audit_logs`, `notifications`, `jobs`, `failed_jobs`

---

## 4. Auditoria (audit_logs)

Tabela central de auditoria (ver `docs/09-security.md` §Logs):

```php
Schema::create('audit_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->string('action');               // ex.: product.updated
    $table->string('auditable_type');       // model
    $table->unsignedBigInteger('auditable_id');
    $table->json('before')->nullable();
    $table->json('after')->nullable();
    $table->string('ip_address', 45)->nullable();
    $table->string('user_agent')->nullable();
    $table->timestamp('created_at');
    $table->index(['auditable_type', 'auditable_id']);
});
```

---

## 5. Índices e Busca

- Filtros de catálogo (preço, marca, atributos) → índices compostos pensados a partir de `docs/06`.
- Busca textual de produtos → **Meilisearch** via Laravel Scout (não `LIKE %%`). Indexe: nome, sku, descrição curta, marca, categorias.
- Reindexação disparada por `ProductSynced` / `ProductUpdated`.

---

## 6. Seeders e Factories

- Factories para **toda** entidade (usadas em testes).
- Seeders de desenvolvimento: categorias do segmento, marcas reais do mercado fotovoltaico, ~100 produtos fake, cupons, 1 admin e 1 cliente de teste.
- Seeder de produção: papéis/permissões, configurações iniciais, categorias base.

---

## 7. Estratégia de Migração de Dados

- Migrations nunca editadas depois de mergeadas — crie novas.
- Para mudanças de dados em produção, use migrations de dados separadas ou comandos Artisan idempotentes.
- Backups automáticos diários antes da sincronização de estoque.
