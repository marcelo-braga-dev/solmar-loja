<?php

declare(strict_types=1);

use App\Domains\Catalog\Models\Category;
use App\Domains\Catalog\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows category page with products', function (): void {
    $category = Category::factory()->create(['is_active' => true]);
    $products = Product::factory(3)->published()->create();
    $products->each(fn ($p) => $p->categories()->attach($category->id, ['is_primary' => true]));

    $response = $this->get("/categorias/{$category->slug}");

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('Storefront/Category')
            ->has('products')
            ->has('category')
            ->where('category.slug', $category->slug)
        );
});

it('returns 404 for non-existent category', function (): void {
    $this->get('/categorias/categoria-inexistente')->assertStatus(404);
});

it('sorts geradores-fotovoltaicos by cheapest price by default', function (): void {
    $category = Category::factory()->create(['is_active' => true, 'slug' => 'geradores-fotovoltaicos']);

    $cheap = Product::factory()->published()->create(['price_cents' => 100000]);
    $mid = Product::factory()->published()->create(['price_cents' => 500000]);
    $expensive = Product::factory()->published()->create(['price_cents' => 900000]);

    foreach ([$expensive, $cheap, $mid] as $product) {
        $product->categories()->attach($category->id, ['is_primary' => true]);
    }

    $response = $this->get("/categorias/{$category->slug}");

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->where('filters.sort', 'price_asc')
            ->where('products.data.0.id', $cheap->id)
            ->where('products.data.1.id', $mid->id)
            ->where('products.data.2.id', $expensive->id)
        );
});

it('keeps relevance as default sort for other categories', function (): void {
    $category = Category::factory()->create(['is_active' => true, 'slug' => 'outra-categoria']);
    $products = Product::factory(2)->published()->create();
    $products->each(fn ($p) => $p->categories()->attach($category->id, ['is_primary' => true]));

    $response = $this->get("/categorias/{$category->slug}");

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page->where('filters.sort', null));
});
