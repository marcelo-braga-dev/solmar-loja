# 08 — Integrações

Todas as integrações externas vivem atrás de **interfaces** (contratos), permitindo trocar fornecedores sem afetar o resto do sistema. Credenciais em `.env`/Settings, nunca hardcoded.

---

## 1. ERP / Distribuidor (Sincronização de Estoque e Produtos)

### Princípios

- **Idempotente:** rodar duas vezes não duplica nem corrompe.
- **Auditável:** cada execução gera um `SyncLog` com início, fim, totais e erros.
- **Não destrutiva:** produtos ausentes na origem são arquivados, nunca deletados.
- **Resiliente:** falha parcial registra e continua; reprocessável.
- **Em fila:** roda como Job na fila `sync`, agendado diariamente às 03:00.

### Arquivos

| Arquivo | Descrição |
|---|---|
| `Inventory/Contracts/ErpClientInterface.php` | Contrato: `name()`, `fetchProducts()`, `isAvailable()` |
| `Integrations/Services/HttpErpClient.php` | Implementação HTTP genérica para REST APIs |
| `Inventory/Services/InventorySyncService.php` | Orquestra a sincronização (match, create, update, stock) |
| `Inventory/Services/StockService.php` | Operações de estoque: reserve, release, syncFromErp |
| `Jobs/SyncInventoryJob.php` | Job agendado (queue: sync, tries: 3, timeout: 1h) |
| `Providers/RepositoryServiceProvider.php` | Binding `ErpClientInterface → HttpErpClient` |

### Configuração (.env)

```dotenv
ERP_BASE_URL=https://api.seu-distribuidor.com.br
ERP_API_KEY=sua_chave_bearer
ERP_TIMEOUT=30
ERP_SYNC_ENABLED=true
```

### Schema JSON da API (formato esperado)

Disponível em `GET /admin/integration/schema` (download) e documentado em 4 tabs no painel.

**Endpoints que o SolarHub consome:**

```
GET {ERP_BASE_URL}/health           → HTTP 200 (health check)
GET {ERP_BASE_URL}/products         → lista paginada de produtos
  Query params: page, per_page, active, updated_since
```

**Formato do produto retornado:**

```json
{
  "id":          "CS7N-665MS",
  "sku":         "CS7N-665MS",
  "name":        "Módulo Solar Canadian Solar 665W",
  "description": "...",
  "price":       1159.00,
  "compare_price": 1399.00,
  "cost":        754.00,
  "stock":       48,
  "weight":      32.5,
  "active":      true,
  "brand":       "Canadian Solar",
  "category":    "Painéis Solares",
  "image_url":   "https://cdn.exemplo.com/produto.jpg",
  "specifications": {
    "Potência": "665Wp",
    "Eficiência": "21.4%",
    "Garantia": "25 anos"
  }
}
```

**Mapeamento de campos:**

| Campo Externo | Campo Interno | Conversão |
|---|---|---|
| id / codigo / sku | external_id | string direto |
| sku / codigo | sku | string direto |
| name / nome | name | string direto |
| price / preco | price_cents | float × 100 |
| compare_price / preco_de | compare_at_price_cents | float × 100 |
| stock / estoque | quantity_available | int direto |
| weight / peso | weight_grams | kg × 1000 |
| specifications | specifications | JSON |
| image_url / imagem | cover_image (download) | URL |

### Painel de Integração Admin (`/admin/integration`)

- **Tab 1:** Status visual (.env configurado?), guia de configuração com bloco de código
- **Tab 2:** Histórico de execuções com status, duração, totais e erros inline
- **Tab 3:** Schema JSON interativo com download
- **Tab 4:** Tabela de mapeamento de campos

### Adaptação para Novos Distribuidores

Edite apenas `HttpErpClient::mapProduct()`:

```php
private function mapProduct(array $item): ?ErpProductData
{
    // Adapte os nomes dos campos para o seu distribuidor
    $externalId = $item['seu_campo_id'] ?? '';
    $priceCents = (int) round((float) $item['preco'] * 100);
    // ...
}
```

---

## 1b. AppSolar (Distribuidor Edeltec) — Sincronização de Catálogo

Integração dedicada com a API REST do **AppSolar** (CRM/ERP do distribuidor Edeltec),
que fornece o catálogo de kits fotovoltaicos já com preço de venda calculado. Diferente
do `HttpErpClient` genérico (seção 1), o schema desta API é fixo e documentado pelo
próprio AppSolar — por isso tem cliente, DTO e serviço de sync próprios.

### Princípios

- **Completa:** todo campo retornado pela API é persistido — nada é descartado.
- **Idempotente / Auditável / Não destrutiva / Resiliente:** mesmos princípios da seção 1.
- **Imagens:** usa a URL da AppSolar diretamente como `ProductImage.path` (sem download
  para storage local) — `ProductImage::url()` já trata URLs `http(s)` como externas.

### Arquivos

| Arquivo | Descrição |
|---|---|
| `Integrations/Contracts/AppSolarClientInterface.php` | Contrato: `fetchProducts(?updatedSince)`, `findBySku()` |
| `Integrations/Data/AppSolarProductData.php` | DTO espelhando 1:1 todos os campos da API (`fromApiArray()`) |
| `Integrations/Services/AppSolarHttpClient.php` | Cliente HTTP: Bearer token, paginação via `links.next`, retry/backoff em 429/5xx, throttle entre páginas |
| `Integrations/Services/AppSolarProductSyncService.php` | Orquestra o sync: upsert de `Product` + `SolarKitSpecification` + `Brand` + imagens, arquivamento de descontinuados |
| `Integrations/Support/HtmlSanitizer.php` | Sanitiza o HTML de `componentes` (whitelist de tags de tabela, remove atributos) |
| `Catalog/Models/SolarKitSpecification.php` | Ficha técnica/comercial completa do kit (1:1 com `Product`) |
| `Jobs/SyncAppSolarProductsJob.php` | Job na fila `sync`; agendado completo (`02:00` diário) e incremental (`hourly()`) |

### Configuração (.env)

```dotenv
APPSOLAR_API_BASE_URL=https://crm.suaempresa.com.br/api/v1/loja
APPSOLAR_API_TOKEN=token_fornecido_pelo_time_appsolar
APPSOLAR_API_TIMEOUT=30
APPSOLAR_SYNC_ENABLED=true
```

### Endpoints consumidos

```
GET {APPSOLAR_API_BASE_URL}/produtos                  → lista paginada
  Query params: per_page (máx. 200), page, atualizados_desde (ISO 8601 — delta sync)
GET {APPSOLAR_API_BASE_URL}/produtos/{sku}             → produto único (404 se inexistente/inativo)
```

Autenticação: `Authorization: Bearer {APPSOLAR_API_TOKEN}` (token estático, sem expiração).
Rate limit do AppSolar: 60 req/min — o cliente espaça as páginas e faz retry com backoff
exponencial em `429`/`5xx`; `401` e `404`/`422` falham imediatamente (sem retry).

### Mapeamento de campos (API → banco)

| Campo da API | Destino | Observação |
|---|---|---|
| `sku` | `products.sku`, `products.external_id`, `solar_kit_specifications.supplier_sku` | chave de upsert |
| `nome` | `products.name` | |
| `preco_venda` | `products.price_cents`, `solar_kit_specifications.supplier_sale_price_cents` | reais × 100 |
| `preco_custo` | `products.cost_cents`, `solar_kit_specifications.supplier_cost_price_cents` | reais × 100, nunca exposto na loja |
| `disponivel` | `solar_kit_specifications.supplier_available` | API só retorna ativos; mantido para o futuro |
| `potencia_kit_kwp`, `tensao`, `estrutura`, `fornecedor` | `solar_kit_specifications.*` | |
| `marca_inversor(_logo/_imagem)`, `potencia_inversor` | `solar_kit_specifications.inverter_*`, `Brand` (find-or-create), `ProductImage` (`tag=inverter`) | |
| `marca_painel(_logo/_imagem)`, `potencia_painel` | `solar_kit_specifications.panel_*`, `Brand` (find-or-create, prioridade sobre inversor como marca primária do produto), `ProductImage` (`tag=panel`) | |
| `componentes` | `solar_kit_specifications.components_html` | sanitizado via `HtmlSanitizer::sanitizeTable()` |
| `observacoes` | `solar_kit_specifications.supplier_notes`, `products.description` (apenas na criação) | |
| `atualizado_em` | `solar_kit_specifications.supplier_updated_at` | usado como base para `atualizados_desde` na próxima sync incremental |

### Estratégia de sincronização

- **Completa (`appsolar:sync --full`):** percorre todo o catálogo (`per_page=200`, segue
  `links.next`), agendada diariamente às `02:00`. Ao final, arquiva (`status = archived`)
  produtos com `solar_kit_specifications` cujo `synced_at` ficou anterior ao início da
  rodada — ou seja, saíram do feed do distribuidor.
- **Incremental (`appsolar:sync`):** usa `atualizados_desde` com a data de início da
  última sync bem-sucedida (`success`/`partial`), agendada de hora em hora.
- Produtos novos sempre entram como `draft` — publicação no catálogo é decisão manual do
  admin/manager.

### Painel Admin

Aba **"AppSolar (Edeltec)"** em `/admin/integration`: status de configuração, KPIs (kits
sincronizados, total de syncs, taxa de sucesso, última execução), histórico filtrado por
`source = appsolar` e botões para disparar sincronização manual (completa ou incremental).

---

## 2. Gateway de Pagamento

### Interface

```php
// app/Domains/Payments/Contracts/PaymentGatewayInterface.php
interface PaymentGatewayInterface {
    public function initiatePix(Order $order, Payment $payment): array;
    public function initiateBoleto(Order $order, Payment $payment): array;
    public function initiateCard(Order $order, Payment $payment, array $cardData): array;
    public function processWebhook(array $payload, string $gateway): void;
    public function refund(Payment $payment, int $amountCents): bool;
}
```

### Gateways Disponíveis

| Gateway | Arquivo | Ativo quando |
|---|---|---|
| MockGateway | `Gateways/MockGateway.php` | `PAYMENT_GATEWAY=mock` (dev) |
| AsaasGateway | `Gateways/AsaasGateway.php` | `PAYMENT_GATEWAY=asaas` (produção) |

### MockGateway (Desenvolvimento)

- Pix: QR Code gerado localmente + copia-e-cola simulado
- Boleto: código de barras fake
- Cartão: aprovação imediata

### AsaasGateway (Produção)

```dotenv
PAYMENT_GATEWAY=asaas
ASAAS_API_KEY=sua_chave
ASAAS_ENVIRONMENT=sandbox  # ou production
```

- HTTP requests para `https://api.asaas.com/v3/`
- Retry automático em falhas transitórias
- Webhook em `POST /webhooks/asaas` — verificação do header `asaas-access-token`

### Webhook

```
POST /webhooks/{gateway}
→ WebhookController@handle
→ PaymentService::processWebhook() (idempotente via PaymentWebhook)
→ Events: PaymentApproved | PaymentFailed
```

---

## 3. Meilisearch (Full-Text Search)

```dotenv
MEILISEARCH_HOST=http://meilisearch:7700
```

- `Product` model usa `Laravel\Scout\Searchable`
- Indexado via `php artisan scout:import "App\Domains\Catalog\Models\Product"`
- `shouldBeSearchable()` → somente produtos `published`
- Autocomplete: `GET /api/search/autocomplete` (throttle 60/min)
- Busca: `GET /busca?q=painel+solar`

---

## 4. Mailing (Mailpit / Produção)

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=mailpit      # dev: mailpit, prod: seu servidor SMTP
MAIL_PORT=1025
```

**Mailables e Notifications implementados:**

| Classe | Trigger |
|---|---|
| `AbandonedCartNotification` | Carrinho abandonado >2h (job hourly) |
| `StockAvailableNotification` | Estoque volta do zero (listener StockChanged) |
| `NewQuoteNotification` | Nova cotação enviada |
| `NewsletterConfirmation` | Double opt-in newsletter |

---

## 5. Login Social (Google OAuth)

```dotenv
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URL=https://seudominio.com.br/auth/google/callback
```

**Fluxo:**
```
GET /auth/google
→ Socialite::driver('google')->redirect()
→ [usuário faz login no Google]
GET /auth/google/callback
→ Socialite::driver('google')->user()
→ busca User por google_id
→ ou busca User por email (merge de conta)
→ ou cria novo User + Customer + role 'customer'
→ Auth::login($user, remember: true)
→ redirect('/conta')
```

**Campos adicionados na tabela `users`:**
- `google_id` — ID único do Google (unique)
- `avatar_url` — foto de perfil do Google
- `auth_provider` — 'email' | 'google'

---

## 6. Alertas de Volta ao Estoque

**Fluxo:**
```
[Usuário clica "Avisar quando disponível"]
→ POST /produtos/{product}/alertas {email}
→ StockAlertController → StockAlertService::subscribe()
→ StockAlert criado (token único para cancelamento)

[Estoque entra via sync ou ajuste manual]
→ StockChanged event dispatched
→ NotifyStockAlerts listener
→ verifica se quantity_available > 0
→ StockAlertService::notifyForProduct()
→ StockAvailableNotification (mailable queued)
→ StockAlert.notified_at = now()

[Usuário clica "cancelar" no email]
→ GET /alertas/cancelar/{token}
→ StockAlert deletado
```

---

## 7. Recuperação de Carrinho Abandonado

**Fluxo:**
```
[A cada hora — Schedule::job()->hourly()]
→ AbandonedCartRecoveryJob::handle()
→ busca carts: user_id NOT NULL + sem recovery_email_sent_at
  + (abandoned_at < 2h atrás) OU (updated_at < 3h atrás sem abandoned_at)
→ verifica: usuário não comprou nas últimas 4h
→ envia AbandonedCartNotification (email queued)
→ cart.recovery_email_sent_at = now()
```

**Campos na tabela `carts`:**
- `abandoned_at` — quando foi marcado como abandonado
- `recovery_email_sent_at` — quando o email de recuperação foi enviado
