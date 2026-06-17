<?php

declare(strict_types=1);

use App\Domains\Catalog\Contracts\BrandRepositoryInterface;
use App\Domains\Catalog\Contracts\ProductRepositoryInterface;
use App\Domains\Catalog\Contracts\SolarKitSpecificationRepositoryInterface;
use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Models\SolarKitSpecification;
use App\Domains\Integrations\Contracts\AppSolarClientInterface;
use App\Domains\Integrations\Data\AppSolarProductData;
use App\Domains\Integrations\Services\AppSolarProductSyncService;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

final class FakeAppSolarClient implements AppSolarClientInterface
{
    /** @param AppSolarProductData[] $items */
    public function __construct(private array $items = []) {}

    public function fetchProducts(?CarbonInterface $updatedSince = null): Generator
    {
        foreach ($this->items as $item) {
            yield $item;
        }
    }

    public function findBySku(string $sku): ?AppSolarProductData
    {
        foreach ($this->items as $item) {
            if ($item->sku === $sku) {
                return $item;
            }
        }

        return null;
    }
}

function makeAppSolarProduct(array $overrides = []): AppSolarProductData
{
    return AppSolarProductData::fromApiArray(array_merge([
        'sku' => '278327',
        'nome' => 'Gerador solar deye 2,22 kwp mon. 220v s/estrutura (3k/555w)',
        'potencia_kit_kwp' => 2.22,
        'tensao' => '220',
        'preco_custo' => 3806.31,
        'preco_venda' => 5519.15,
        'disponivel' => true,
        'marca_inversor' => 'DEYE (Convencional)',
        'marca_inversor_logo' => 'https://appsolar.test/inversor-logo.jpg',
        'marca_inversor_imagem' => 'https://appsolar.test/inversor.jpg',
        'potencia_inversor' => 3,
        'marca_painel' => 'Jinko',
        'marca_painel_logo' => 'https://appsolar.test/painel-logo.jpg',
        'marca_painel_imagem' => 'https://appsolar.test/painel.png',
        'potencia_painel' => 555,
        'estrutura' => 'Sem Estrutura',
        'fornecedor' => 'EDELTEC',
        'componentes' => '<table><tr><td>Item</td></tr></table>',
        'observacoes' => null,
        'atualizado_em' => '2024-07-29T12:24:53-03:00',
    ], $overrides));
}

function makeSyncService(AppSolarClientInterface $client): AppSolarProductSyncService
{
    return new AppSolarProductSyncService(
        $client,
        app(ProductRepositoryInterface::class),
        app(BrandRepositoryInterface::class),
        app(SolarKitSpecificationRepositoryInterface::class),
    );
}

it('creates a new product with full solar kit specification on first sync', function (): void {
    $service = makeSyncService(new FakeAppSolarClient([makeAppSolarProduct()]));

    $results = $service->syncFull();

    expect($results['created'])->toBe(1);
    expect($results['updated'])->toBe(0);
    expect($results['errors'])->toBe(0);

    $product = Product::where('sku', '278327')->first();
    expect($product)->not->toBeNull();
    expect($product->name)->toBe('Gerador solar deye 2,22 kwp mon. 220v s/estrutura (3k/555w)');
    expect($product->price_cents)->toBe(551915);
    expect($product->cost_cents)->toBe(380631);
    expect($product->status)->toBe(ProductStatus::Draft);
    expect($product->external_id)->toBe('278327');
    expect($product->brand?->name)->toBe('Jinko');

    $spec = SolarKitSpecification::where('product_id', $product->id)->first();
    expect($spec)->not->toBeNull();
    expect($spec->supplier_sku)->toBe('278327');
    expect($spec->kit_power_kwp)->toBe(2.22);
    expect($spec->voltage)->toBe('220');
    expect($spec->inverter_brand)->toBe('DEYE (Convencional)');
    expect($spec->panel_brand)->toBe('Jinko');
    expect($spec->panel_power_w)->toBe(555);
    expect($spec->supplier_cost_price_cents)->toBe(380631);
    expect($spec->supplier_sale_price_cents)->toBe(551915);
    expect($spec->components_html)->toContain('Item');

    expect($product->images()->where('tag', 'panel')->exists())->toBeTrue();
    expect($product->images()->where('tag', 'inverter')->exists())->toBeTrue();
    expect($product->images()->where('tag', 'panel')->first()->path)->toBe('https://appsolar.test/painel.png');
});

it('updates an existing product instead of duplicating on second sync', function (): void {
    $service = makeSyncService(new FakeAppSolarClient([makeAppSolarProduct()]));
    $service->syncFull();

    $updatedService = makeSyncService(new FakeAppSolarClient([
        makeAppSolarProduct(['preco_venda' => 6000.00]),
    ]));
    $results = $updatedService->syncFull();

    expect($results['created'])->toBe(0);
    expect($results['updated'])->toBe(1);
    expect(Product::where('sku', '278327')->count())->toBe(1);

    $product = Product::where('sku', '278327')->first();
    expect($product->price_cents)->toBe(600000);
});

it('preserves a manually published status when updating price', function (): void {
    $service = makeSyncService(new FakeAppSolarClient([makeAppSolarProduct()]));
    $service->syncFull();

    Product::where('sku', '278327')->update(['status' => ProductStatus::Published]);

    makeSyncService(new FakeAppSolarClient([makeAppSolarProduct(['preco_venda' => 7000.00])]))->syncFull();

    expect(Product::where('sku', '278327')->first()->status)->toBe(ProductStatus::Published);
});

it('archives products no longer returned by a full sync', function (): void {
    makeSyncService(new FakeAppSolarClient([makeAppSolarProduct()]))->syncFull();

    expect(Product::where('sku', '278327')->first()->status)->toBe(ProductStatus::Draft);

    // Avança o relógio para garantir que synced_at da rodada anterior fique no passado.
    CarbonImmutable::setTestNow(CarbonImmutable::now()->addMinute());

    makeSyncService(new FakeAppSolarClient([]))->syncFull();

    expect(Product::where('sku', '278327')->first()->status)->toBe(ProductStatus::Archived);

    CarbonImmutable::setTestNow();
});

it('records a per-item error without stopping the rest of the sync', function (): void {
    $valid = makeAppSolarProduct(['sku' => 'VALID-1']);
    $broken = makeAppSolarProduct(['sku' => 'BROKEN-1', 'marca_painel' => str_repeat('A', 300)]);

    $service = makeSyncService(new FakeAppSolarClient([$broken, $valid]));
    $results = $service->syncFull();

    expect($results['total'])->toBe(2);
    expect($results['errors'])->toBe(1);
    expect($results['created'])->toBe(1);
    expect($results['error_list'][0]['sku'])->toBe('BROKEN-1');

    expect(Product::where('sku', 'VALID-1')->exists())->toBeTrue();
    expect(Product::where('sku', 'BROKEN-1')->exists())->toBeFalse();
});
