<?php

declare(strict_types=1);

use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Brand;
use App\Domains\Catalog\Models\Category;
use App\Domains\Catalog\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows published product page', function (): void {
    $product = Product::factory()->published()->create();

    $response = $this->get("/produtos/{$product->slug}");

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('Storefront/Product')
            ->has('product')
            ->where('product.slug', $product->slug)
        );
});

it('returns 404 for draft product', function (): void {
    $product = Product::factory()->draft()->create();

    $this->get("/produtos/{$product->slug}")->assertStatus(404);
});

it('returns 404 for non-existent product', function (): void {
    $this->get('/produtos/produto-inexistente')->assertStatus(404);
});
