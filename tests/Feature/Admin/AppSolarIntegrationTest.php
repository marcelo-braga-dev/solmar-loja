<?php

declare(strict_types=1);

use App\Domains\Catalog\Models\Product;
use App\Domains\Integrations\Contracts\AppSolarClientInterface;
use App\Domains\Integrations\Data\AppSolarProductData;
use App\Models\User;
use Carbon\CarbonInterface;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('shows the appsolar tab data in the integration panel', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/admin/integration')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Integration/Index')
            ->has('appsolarConfig')
            ->has('appsolarStats')
            ->has('appsolarSyncLogs'));
});

it('rejects manual appsolar sync when not configured', function (): void {
    config(['services.appsolar.base_url' => null, 'services.appsolar.token' => null]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->postJson('/admin/integration/appsolar/sync', ['full' => true])
        ->assertOk()
        ->assertJson(['success' => false]);
});

it('runs a full appsolar sync and creates products', function (): void {
    config([
        'services.appsolar.base_url' => 'https://appsolar.test/api/v1/loja',
        'services.appsolar.token' => 'test-token',
    ]);

    $fake = new class implements AppSolarClientInterface
    {
        public function fetchProducts(?CarbonInterface $updatedSince = null): Generator
        {
            yield AppSolarProductData::fromApiArray([
                'sku' => 'ADMIN-1',
                'nome' => 'Kit solar admin teste',
                'potencia_kit_kwp' => 1.1,
                'tensao' => '127',
                'preco_custo' => 1000.0,
                'preco_venda' => 1500.0,
                'disponivel' => true,
                'fornecedor' => 'EDELTEC',
                'atualizado_em' => '2024-07-29T12:24:53-03:00',
            ]);
        }

        public function findBySku(string $sku): ?AppSolarProductData
        {
            return null;
        }
    };

    $this->app->instance(AppSolarClientInterface::class, $fake);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->postJson('/admin/integration/appsolar/sync', ['full' => true])
        ->assertOk()
        ->assertJson(['success' => true]);

    expect(Product::where('sku', 'ADMIN-1')->exists())->toBeTrue();
});
