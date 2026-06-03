<?php

declare(strict_types=1);

use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Orders\Models\CartItem;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('adds product to cart as guest', function (): void {
    $product = Product::factory()->create([
        'status'      => ProductStatus::Published,
        'price_cents' => 10000,
        'stock'       => 10,
    ]);

    $this->postJson('/carrinho/items', [
        'product_id' => $product->id,
        'quantity'   => 1,
    ])->assertOk()->assertJsonPath('item_count', 1);
});

it('rejects adding non-existent product', function (): void {
    $this->postJson('/carrinho/items', [
        'product_id' => 99999,
        'quantity'   => 1,
    ])->assertUnprocessable();
});

it('shows cart page', function (): void {
    $this->get('/carrinho')->assertOk()->assertInertia(
        fn ($page) => $page->component('Storefront/Cart')
    );
});

it('guest cannot update another session cart item', function (): void {
    $product = Product::factory()->create([
        'status'      => ProductStatus::Published,
        'price_cents' => 5000,
        'stock'       => 5,
    ]);

    // Cria um item de carrinho de outra sessão diretamente
    $cart = \App\Domains\Orders\Models\Cart::create(['session_id' => 'other-session-id']);
    $item = CartItem::create([
        'cart_id'          => $cart->id,
        'product_id'       => $product->id,
        'quantity'         => 1,
        'unit_price_cents' => 5000,
    ]);

    $this->patchJson("/carrinho/items/{$item->id}", ['quantity' => 2])
        ->assertForbidden();
});
