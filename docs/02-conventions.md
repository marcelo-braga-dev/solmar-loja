# 02 — Convenções de Código

## 1. Princípios Gerais

- **Idioma:** código, classes, métodos, variáveis e comentários técnicos em **inglês**. Textos de interface, mensagens ao usuário e conteúdo em **português (pt-BR)** via arquivos de tradução (`lang/pt_BR`).
- **PHP:** siga PSR-12 + Laravel Pint (preset `laravel`). Tipagem estrita: `declare(strict_types=1);` em todo arquivo PHP.
- **Imutabilidade:** prefira `readonly` em DTOs e VOs. Classes de serviço/ação geralmente `final`.
- **Injeção de dependência:** sempre via construtor, com type-hint de interfaces (não implementações).
- **Análise estática:** PHPStan/Larastan nível **6** no mínimo (meta: 8).

---

## 2. Convenções de Nomenclatura

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Classe | PascalCase | `ProductService` |
| Interface | PascalCase + `Interface` | `ProductRepositoryInterface` |
| Método | camelCase | `findBySlug()` |
| Variável/propriedade | camelCase | `$unitPrice` |
| Constante/Enum case | PascalCase ou UPPER_SNAKE | `ProductStatus::Published` |
| Tabela DB | snake_case plural | `order_items` |
| Coluna DB | snake_case | `created_at` |
| Rota (nome) | dot.case | `admin.products.index` |
| Evento | PascalCase, passado | `OrderPlaced` |
| Job | PascalCase + `Job` | `SyncInventoryJob` |
| DTO | PascalCase + `Data` | `ProductData` |
| Action | Verbo + substantivo + `Action` | `PlaceOrderAction` |
| Componente React | PascalCase | `ProductCard.tsx` |
| Página Inertia | PascalCase | `Pages/Storefront/Home.tsx` |

---

## 3. Estrutura de um Controller

Controllers são finos. Um método = uma responsabilidade.

```php
final class CheckoutController extends Controller
{
    public function __construct(
        private readonly PlaceOrderAction $placeOrder,
    ) {}

    public function store(PlaceOrderRequest $request): RedirectResponse
    {
        $order = $this->placeOrder->execute($request->toData());

        return to_route('storefront.orders.confirmation', $order->uuid);
    }
}
```

- Sem `try/catch` genérico — deixe o Handler tratar.
- Sem validação inline — use Form Request.
- Sem regra de negócio — delegue.

---

## 4. Form Requests

Toda entrada validada. O Form Request também converte para DTO.

```php
final class PlaceOrderRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'shipping_address_id' => ['required', 'integer', 'exists:addresses,id'],
            'payment_method' => ['required', new Enum(PaymentMethod::class)],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    public function toData(): PlaceOrderData
    {
        return PlaceOrderData::from($this->validated());
    }
}
```

Mensagens de validação em pt-BR via `lang/pt_BR/validation.php`.

---

## 5. Models

- Models ficam em `app/Domains/<Domain>/Models`.
- `$fillable` explícito (nunca `$guarded = []`).
- Casts tipados (enums, dates, `Money`).
- Relacionamentos tipados com retorno (`: HasMany`).
- **Sem** lógica de negócio pesada — apenas relacionamentos, casts, scopes simples e accessors.
- Use UUID público (`uuid`) além do `id` incremental para expor em URLs/APIs.

```php
final class Product extends Model
{
    protected $fillable = ['name', 'slug', 'sku', 'price_cents', 'status', 'brand_id'];

    protected $casts = [
        'status' => ProductStatus::class,
        'specifications' => 'array',
        'published_at' => 'datetime',
    ];

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }
}
```

---

## 6. Enums

Use enums nativos do PHP 8.1+ com backing string. Adicione métodos de apresentação (label, cor).

```php
enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Processing = 'processing';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Canceled = 'canceled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Aguardando pagamento',
            self::Paid => 'Pago',
            self::Processing => 'Em separação',
            self::Shipped => 'Enviado',
            self::Delivered => 'Entregue',
            self::Canceled => 'Cancelado',
        };
    }
}
```

---

## 7. Commits e Branches

- **Conventional Commits:** `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `perf:`.
- Branch: `feature/<dominio>-<descricao>`, `fix/<descricao>`.
- Um PR resolve uma coisa. Descreva o que mudou e como testar.
- CI deve rodar `composer check` + build do front.

---

## 8. Comentários e Documentação no Código

- Comente o **porquê**, não o **o quê**.
- PHPDoc para tipos genéricos que o type system não cobre (ex.: `@return Collection<int, Product>`).
- Métodos públicos de Services/Actions devem ter docblock curto explicando o efeito de negócio.

---

## 9. Performance no Código

- Evite N+1: use eager loading (`with()`) nos Repositories. Ative `Model::preventLazyLoading()` em dev.
- Pagine sempre listagens. Nunca `->all()` em tabelas grandes.
- Cache de leituras pesadas (categorias, menu, home) com invalidação por evento.
- Índices de banco para toda coluna usada em filtro/ordenação/junção.
