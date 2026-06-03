<?php

declare(strict_types=1);

use App\Domains\Catalog\Models\Brand;
use App\Domains\Catalog\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin);
});

it('lists products in admin', function (): void {
    Product::factory(3)->create();

    $this->get('/admin/products')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('products'));
});

it('shows create product form', function (): void {
    $this->get('/admin/products/create')->assertOk();
});

it('creates a product', function (): void {
    $brand = Brand::factory()->create();

    $this->post('/admin/products', [
        'name'        => 'Painel Solar Test 400W',
        'sku'         => 'SKU-TEST-001',
        'price_cents' => 89900,
        'status'      => 'draft',
        'brand_id'    => $brand->id,
    ])->assertRedirect();

    $this->assertDatabaseHas('products', ['sku' => 'SKU-TEST-001']);
});

it('validates required fields on create', function (): void {
    $this->post('/admin/products', [])->assertSessionHasErrors(['name', 'sku', 'price_cents']);
});

it('updates a product', function (): void {
    $product = Product::factory()->create();

    $this->put("/admin/products/{$product->uuid}", [
        'name'        => 'Nome Atualizado',
        'sku'         => $product->sku,
        'price_cents' => 99900,
        'status'      => 'draft',
    ])->assertRedirect();

    $this->assertDatabaseHas('products', ['id' => $product->id, 'name' => 'Nome Atualizado']);
});

it('deletes a product (soft delete)', function (): void {
    $product = Product::factory()->create();

    $this->delete("/admin/products/{$product->uuid}")->assertRedirect();

    $this->assertSoftDeleted('products', ['id' => $product->id]);
});
