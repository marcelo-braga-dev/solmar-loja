# 10 — Testes

## 1. Filosofia

Testes não são opcionais. **Cobertura mínima: 80%.** Toda feature entra com testes. Use **Pest** (sobre PHPUnit) no backend.

Pirâmide:
- **Unitários** (muitos): Services, Actions, DTOs, Value Objects, regras puras.
- **Integração/Feature** (vários): rotas, controllers, fluxos com banco (HTTP + DB).
- **E2E** (poucos, críticos): jornada de compra completa.

---

## 2. Backend (Pest)

### Estrutura

```
tests/
├── Unit/
│   └── Domains/<Domain>/...
├── Feature/
│   ├── Storefront/
│   └── Admin/
└── Pest.php
```

### Padrões

- Use `RefreshDatabase`.
- Use **Factories** para montar dados.
- Mock de integrações externas (gateways, ERP, frete) — **nunca** chamar serviço externo real.
- Fake de filas/eventos quando apropriado (`Queue::fake()`, `Event::fake()`), mas teste que o evento/job foi disparado.
- Teste caminhos felizes **e** de erro (validação, autorização, regra de negócio).

### Exemplos

```php
it('publishes a product with images', function () {
    $product = Product::factory()->hasImages(2)->create(['status' => 'draft']);

    $service = app(ProductService::class);
    $result = $service->publish($product);

    expect($result->status)->toBe(ProductStatus::Published);
    Event::assertDispatched(ProductPublished::class);
});

it('rejects publishing a product without images', function () {
    $product = Product::factory()->create(['status' => 'draft']);

    expect(fn () => app(ProductService::class)->publish($product))
        ->toThrow(DomainException::class);
});

it('blocks non-admin from updating products', function () {
    $user = User::factory()->create(); // customer
    $product = Product::factory()->create();

    actingAs($user)
        ->put(route('admin.products.update', $product->uuid), ['name' => 'x'])
        ->assertForbidden();
});
```

### O que sempre testar por feature

- Validação (campos obrigatórios, formatos).
- Autorização (usuário sem permissão recebe 403).
- Regra de negócio principal (caminho feliz).
- Casos de borda e falhas (estoque insuficiente, cupom expirado, pagamento recusado).
- Disparo de eventos/jobs.
- Auditoria registrada para ações sensíveis.

---

## 3. Fluxos Críticos a Cobrir

- **Checkout completo**: carrinho → reserva de estoque → pedido → pagamento (mock) → confirmação → baixa de estoque.
- **Sincronização de estoque**: idempotência, diff, não-destrutividade, geração de SyncLog.
- **Cupom**: aplicação, limites, expiração, regras por categoria/produto.
- **Frete**: cotação por CEP/peso.
- **Webhook de pagamento**: idempotência, transição de status.
- **Permissões**: cada papel acessa só o que deve.

---

## 4. Frontend

- Testes de componentes com **Vitest + React Testing Library** para componentes com lógica (filtros, carrinho, stepper de checkout).
- Foco em comportamento, não em implementação.
- E2E opcional com **Playwright** para a jornada de compra.

---

## 5. Qualidade Contínua

- `composer check` (Pint + PHPStan + Pest) deve passar antes de concluir qualquer tarefa.
- CI roda testes + build do front em todo PR.
- Cobertura medida: `./vendor/bin/pest --coverage --min=80`.
- PRs sem teste para código novo são rejeitados.

---

## 6. Dados de Teste

- Factories realistas para o segmento (produtos solares, kits, inversores).
- Seeders de desenvolvimento para ambiente local navegável.
- Builders/helpers para cenários comuns (criar pedido pago, criar carrinho com cupom).
