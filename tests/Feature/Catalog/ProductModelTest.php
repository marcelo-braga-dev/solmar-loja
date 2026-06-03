<?php

declare(strict_types=1);

use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('detects discount when compare price is higher', function (): void {
    $product = Product::factory()->make([
        'price_cents'            => 8000,
        'compare_at_price_cents' => 10000,
    ]);

    expect($product->hasDiscount())->toBeTrue();
    expect($product->discountPercent())->toBe(20);
});

it('has no discount when compare price is null', function (): void {
    $product = Product::factory()->make([
        'price_cents'            => 8000,
        'compare_at_price_cents' => null,
    ]);

    expect($product->hasDiscount())->toBeFalse();
    expect($product->discountPercent())->toBe(0);
});

it('is visible only when published', function (): void {
    expect(ProductStatus::Published->isVisible())->toBeTrue();
    expect(ProductStatus::Draft->isVisible())->toBeFalse();
});

it('generates uuid on creation', function (): void {
    $product = Product::factory()->create();

    expect($product->uuid)->not->toBeNull();
    expect(strlen($product->uuid))->toBe(36);
});
