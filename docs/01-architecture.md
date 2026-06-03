# 01 — Arquitetura

## 1. Visão Geral

O SolarHub Commerce adota **Clean Architecture** adaptada ao ecossistema Laravel, organizada por **domínios de negócio** (Domain-Driven Design leve). O objetivo é um sistema desacoplado, testável e fácil de evoluir, onde a regra de negócio não depende de framework, banco ou UI.

### Camadas

```
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION                                            │
│  Controllers · Form Requests · Resources · Inertia/React │
├─────────────────────────────────────────────────────────┤
│  APPLICATION                                             │
│  Services · Actions · DTOs · Events · Listeners · Jobs   │
├─────────────────────────────────────────────────────────┤
│  DOMAIN                                                  │
│  Models (entidades) · Enums · Value Objects · Policies   │
├─────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE                                          │
│  Repositories · Integrações externas · Cache · Filas     │
└─────────────────────────────────────────────────────────┘
```

**Regra de dependência:** camadas externas dependem das internas, nunca o contrário. Um Service pode chamar um Repository (via interface), mas um Model nunca conhece um Controller.

---

## 2. Fluxo de uma Requisição

```
HTTP Request
  → Route
  → Middleware (auth, throttle, etc.)
  → Controller (fino)
      → Form Request (validação)
      → monta DTO de entrada
      → chama Service ou Action
          → Service aplica regra de negócio
          → Repository persiste/consulta
          → dispara Event(s)
              → Listener(s) → Job(s) na fila
      → recebe DTO/Model de saída
  → Resource (serialização) ou Inertia::render
  → Response (JSON ou página Inertia)
```

---

## 3. Padrões Obrigatórios

### 3.1 Repository Pattern

Toda comunicação com o banco passa por um Repository. Cada Repository tem uma **interface** (contrato) e uma **implementação Eloquent**, ligadas por binding no `AppServiceProvider` (ou um `RepositoryServiceProvider` dedicado).

```php
// app/Domains/Catalog/Contracts/ProductRepositoryInterface.php
interface ProductRepositoryInterface
{
    public function findBySlug(string $slug): ?Product;
    public function paginateForCategory(int $categoryId, ProductFilterDTO $filter): LengthAwarePaginator;
    public function create(ProductData $data): Product;
    public function update(Product $product, ProductData $data): Product;
}

// app/Domains/Catalog/Repositories/EloquentProductRepository.php
final class EloquentProductRepository implements ProductRepositoryInterface
{
    public function findBySlug(string $slug): ?Product
    {
        return Product::query()->where('slug', $slug)->first();
    }
    // ...
}
```

Binding:

```php
// app/Providers/RepositoryServiceProvider.php
$this->app->bind(ProductRepositoryInterface::class, EloquentProductRepository::class);
```

### 3.2 Service Layer

Regra de negócio de um domínio. Recebe DTOs, orquestra repositories, dispara eventos.

```php
final class ProductService
{
    public function __construct(
        private readonly ProductRepositoryInterface $products,
    ) {}

    public function publish(Product $product): Product
    {
        if ($product->images->isEmpty()) {
            throw new DomainException('Produto sem imagens não pode ser publicado.');
        }
        $updated = $this->products->update($product, new ProductData(status: ProductStatus::Published));
        event(new ProductPublished($updated));
        return $updated;
    }
}
```

### 3.3 Action Pattern

Para operações de negócio únicas e complexas que cruzam múltiplos serviços/domínios. Uma Action = um método público `execute()` (ou `handle()`).

```php
final class PlaceOrderAction
{
    public function __construct(
        private readonly CartService $cart,
        private readonly InventoryService $inventory,
        private readonly OrderRepositoryInterface $orders,
        private readonly DatabaseManager $db,
    ) {}

    public function execute(PlaceOrderData $data): Order
    {
        return $this->db->transaction(function () use ($data) {
            $this->inventory->assertAvailability($data->items);
            $order = $this->orders->create(...);
            $this->inventory->reserve($order);
            event(new OrderPlaced($order));
            return $order;
        });
    }
}
```

### 3.4 DTO Pattern

Dados trafegam entre camadas como DTOs imutáveis e tipados. Use `spatie/laravel-data` (recomendado) ou classes `readonly` puras.

```php
final class ProductData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly string $sku,
        public readonly Money $price,
        public readonly ProductStatus $status,
        public readonly ?string $description = null,
    ) {}
}
```

> **Regra:** Controllers e Services não trocam arrays soltos. Sempre DTO.

### 3.5 Event Driven

Eventos desacoplam efeitos colaterais. Eventos mínimos obrigatórios:

| Evento | Disparado quando | Listeners típicos |
|--------|------------------|-------------------|
| `OrderPlaced` | Pedido criado | Enviar e-mail, reservar estoque, notificar admin |
| `PaymentApproved` | Pagamento confirmado | Liberar pedido, baixar estoque, emitir NF (futuro) |
| `PaymentFailed` | Pagamento recusado | Notificar cliente, liberar reserva |
| `ProductSynced` | Produto sincronizado do ERP | Reindexar busca, invalidar cache |
| `StockChanged` | Estoque alterado | Atualizar disponibilidade, alertar admin |
| `CustomerRegistered` | Cliente cadastrado | E-mail boas-vindas, cupom welcome |

Listeners pesados implementam `ShouldQueue`.

### 3.6 Filas (Queues)

Tudo que não precisa ser instantâneo vai para fila (Redis + Horizon):

- Envio de e-mails e notificações
- Sincronização de estoque/produtos
- Reindexação no Meilisearch
- Geração de relatórios e exportações
- Webhooks de pagamento (processamento)

Filas sugeridas: `default`, `emails`, `sync`, `payments`, `reports`. Configure prioridades no Horizon.

---

## 4. Estrutura de Pastas

```
app/
├── Actions/                    # Actions transversais (ou dentro de cada Domain)
├── Domains/
│   ├── Auth/
│   ├── Catalog/                # Produtos, categorias, marcas, atributos
│   │   ├── Actions/
│   │   ├── Contracts/          # Interfaces de repositories
│   │   ├── Data/               # DTOs
│   │   ├── Enums/
│   │   ├── Events/
│   │   ├── Listeners/
│   │   ├── Models/
│   │   ├── Policies/
│   │   ├── Repositories/       # Implementações Eloquent
│   │   ├── Services/
│   │   └── Rules/              # Regras de validação custom
│   ├── Orders/                 # Carrinho, checkout, pedidos, expedição
│   ├── Customers/              # Clientes, endereços, favoritos
│   ├── Checkout/
│   ├── Payments/               # Pix, boleto, cartão, conciliação
│   ├── Financial/              # Receitas, despesas, fluxo, DRE, comissões
│   ├── Inventory/              # Sincronização, reservas, disponibilidade
│   ├── Integrations/           # Distribuidores, ERPs, transportadoras, gateways
│   ├── Reports/
│   ├── Marketing/              # Cupons, campanhas, banners, landing pages
│   ├── Support/
│   └── Settings/
├── Http/
│   ├── Controllers/
│   │   ├── Storefront/         # Controllers da loja
│   │   └── Admin/              # Controllers do painel
│   ├── Middleware/
│   ├── Requests/               # Form Requests (por domínio)
│   └── Resources/              # API Resources
├── Jobs/
├── Providers/
└── Support/                    # Helpers, Value Objects (Money, etc.), Traits

resources/
└── js/
    ├── Pages/                  # Páginas Inertia (Storefront/ e Admin/)
    ├── Components/             # Componentes reutilizáveis
    ├── Layouts/                # StorefrontLayout, AdminLayout
    ├── Hooks/
    ├── Theme/                  # Tema MUI
    └── Lib/                    # axios, helpers, formatters
```

> Cada **Domain** é autocontido. Evite dependências cruzadas diretas entre domínios; quando necessário, comunique-se via Services públicos ou Eventos.

---

## 5. Value Objects

Use Value Objects para conceitos com regras próprias. O mais importante: **Money**.

- Nunca armazene ou calcule dinheiro com `float`. Use inteiros (centavos) + um VO `Money` (ex.: `brick/money` ou `moneyphp/money`).
- Outros VOs úteis: `Cpf`, `Cnpj`, `Cep`, `PhoneNumber`, `Dimensions` (peso/altura/largura/comprimento para frete).

---

## 6. Tratamento de Erros

- Exceções de domínio: crie `DomainException` específicas por contexto (ex.: `InsufficientStockException`).
- Capture no `Handler` e converta em respostas amigáveis (Inertia error page ou JSON).
- Nunca exponha stack traces em produção.
- Toda exceção relevante de negócio deve ser logada com contexto.

---

## 7. Configuração de Ambiente

- `APP_TIMEZONE=America/Sao_Paulo`
- `APP_LOCALE=pt_BR`
- Moeda: BRL em toda a aplicação.
- `.env.example` sempre atualizado com todas as chaves necessárias (sem valores sensíveis).
