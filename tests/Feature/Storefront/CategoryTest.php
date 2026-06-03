<?php

declare(strict_types=1);

use App\Domains\Catalog\Models\Category;
use App\Domains\Catalog\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows category page with products', function (): void {
    $category = Category::factory()->create(['is_active' => true]);
    $products  = Product::factory(3)->published()->create();
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
