<?php

declare(strict_types=1);

use App\Domains\Catalog\Data\MarginTierData;
use App\Domains\Catalog\Models\MarginTier;
use App\Domains\Catalog\Services\MarginPricingService;
use App\Jobs\RecalculateKitPricesJob;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
});

it('lists margin tiers and flags when none is active', function (): void {
    $this->actingAs($this->admin)->get('/admin/margin-tiers')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/MarginTiers/Index')
            ->where('hasActiveTiers', false)
            ->has('tiers.data', 0));

    // Passa pelo service (não pelo model direto) para exercitar a invalidação real do cache.
    app(MarginPricingService::class)->create(new MarginTierData(minKwp: 0, maxKwp: 10, marginPercent: 30, isActive: true));

    $this->actingAs($this->admin)->get('/admin/margin-tiers')
        ->assertInertia(fn ($page) => $page->where('hasActiveTiers', true)->has('tiers.data', 1));
});

it('creates a margin tier and dispatches a recalculation job', function (): void {
    Queue::fake();

    $this->actingAs($this->admin)
        ->post('/admin/margin-tiers', ['min_kwp' => 0, 'max_kwp' => 3, 'margin_percent' => 40, 'is_active' => true])
        ->assertRedirect();

    $this->assertDatabaseHas('margin_tiers', ['min_kwp' => 0, 'max_kwp' => 3, 'margin_percent' => 40]);
    Queue::assertPushed(RecalculateKitPricesJob::class);
});

it('rejects a tier whose range overlaps an existing active tier', function (): void {
    MarginTier::create(['min_kwp' => 0, 'max_kwp' => 5, 'margin_percent' => 40, 'is_active' => true]);

    $this->actingAs($this->admin)
        ->post('/admin/margin-tiers', ['min_kwp' => 3, 'max_kwp' => 8, 'margin_percent' => 30, 'is_active' => true])
        ->assertSessionHasErrors('min_kwp');

    $this->assertDatabaseCount('margin_tiers', 1);
});

it('rejects a tier whose max_kwp is not greater than min_kwp', function (): void {
    $this->actingAs($this->admin)
        ->post('/admin/margin-tiers', ['min_kwp' => 5, 'max_kwp' => 3, 'margin_percent' => 30, 'is_active' => true])
        ->assertSessionHasErrors('max_kwp');
});

it('updates a margin tier without colliding with itself', function (): void {
    Queue::fake();
    $tier = MarginTier::create(['min_kwp' => 0, 'max_kwp' => 5, 'margin_percent' => 40, 'is_active' => true]);

    $this->actingAs($this->admin)
        ->put("/admin/margin-tiers/{$tier->id}", ['min_kwp' => 0, 'max_kwp' => 6, 'margin_percent' => 35, 'is_active' => true])
        ->assertRedirect();

    $this->assertDatabaseHas('margin_tiers', ['id' => $tier->id, 'max_kwp' => 6, 'margin_percent' => 35]);
    Queue::assertPushed(RecalculateKitPricesJob::class);
});

it('rejects an update whose range overlaps another tier', function (): void {
    MarginTier::create(['min_kwp' => 0, 'max_kwp' => 5, 'margin_percent' => 40, 'is_active' => true]);
    $tier = MarginTier::create(['min_kwp' => 5.01, 'max_kwp' => 10, 'margin_percent' => 30, 'is_active' => true]);

    $this->actingAs($this->admin)
        ->put("/admin/margin-tiers/{$tier->id}", ['min_kwp' => 4, 'max_kwp' => 10, 'margin_percent' => 30, 'is_active' => true])
        ->assertSessionHasErrors('min_kwp');
});

it('deletes a margin tier and dispatches a recalculation job', function (): void {
    Queue::fake();
    $tier = MarginTier::create(['min_kwp' => 0, 'max_kwp' => 5, 'margin_percent' => 40, 'is_active' => true]);

    $this->actingAs($this->admin)
        ->delete("/admin/margin-tiers/{$tier->id}")
        ->assertRedirect();

    $this->assertDatabaseMissing('margin_tiers', ['id' => $tier->id]);
    Queue::assertPushed(RecalculateKitPricesJob::class);
});

it('dispatches a recalculation job on demand via the recalculate endpoint', function (): void {
    Queue::fake();

    $this->actingAs($this->admin)
        ->post('/admin/margin-tiers/recalculate')
        ->assertRedirect();

    Queue::assertPushed(RecalculateKitPricesJob::class);
});

it('blocks non-admin users from managing margin tiers', function (): void {
    $customer = User::factory()->create();
    $customer->assignRole('customer');

    $this->actingAs($customer)->get('/admin/margin-tiers')->assertRedirect('/login');
});
