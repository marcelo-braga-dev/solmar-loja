<?php

declare(strict_types=1);

use App\Domains\Catalog\Contracts\CategoryRepositoryInterface;
use App\Domains\Catalog\Contracts\ProductRepositoryInterface;
use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Models\SolarKitSpecification;
use App\Domains\Inventory\Contracts\ErpClientInterface;
use App\Domains\Inventory\Data\ErpProductData;
use App\Domains\Inventory\Services\InventorySyncService;
use App\Domains\Inventory\Services\StockService;
use Carbon\CarbonImmutable;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    // StockService::syncFromErp grava em stocks.warehouse_id=1 por padrão; em produção esse
    // registro é criado manualmente (não há seeder), então o teste precisa criá-lo também.
    DB::table('warehouses')->insert([
        'name' => 'Depósito Principal',
        'code' => 'PRINCIPAL',
        'is_active' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
});

final class FakeErpClient implements ErpClientInterface
{
    /** @param ErpProductData[] $items */
    public function __construct(private array $items = []) {}

    public function name(): string
    {
        return 'http_erp';
    }

    /** @return Collection<int, ErpProductData> */
    public function fetchProducts(): Collection
    {
        return collect($this->items);
    }

    public function isAvailable(): bool
    {
        return true;
    }
}

function makeErpProduct(array $overrides = []): ErpProductData
{
    return new ErpProductData(
        externalId: $overrides['externalId'] ?? '484084',
        sku: $overrides['sku'] ?? '484084',
        name: $overrides['name'] ?? 'Gerador solar micro saj 2,52 kwp mon. 220v laje',
        priceCents: $overrides['priceCents'] ?? 741800,
        stockQuantity: $overrides['stockQuantity'] ?? 999,
        isActive: $overrides['isActive'] ?? true,
    );
}

function makeInventorySyncService(ErpClientInterface $client): InventorySyncService
{
    return new InventorySyncService(
        $client,
        app(ProductRepositoryInterface::class),
        app(CategoryRepositoryInterface::class),
        app(StockService::class),
    );
}

it('creates a new product already published when the ERP marks it active', function (): void {
    $service = makeInventorySyncService(new FakeErpClient([makeErpProduct()]));

    $results = $service->sync();

    expect($results['created'])->toBe(1);
    expect($results['errors'])->toBe(0);

    $product = Product::where('sku', '484084')->first();
    expect($product)->not->toBeNull();
    expect($product->price_cents)->toBe(741800);
    expect($product->status)->toBe(ProductStatus::Published);
    expect($product->published_at)->not->toBeNull();
});

it('creates a new product as archived when the ERP marks it inactive', function (): void {
    $service = makeInventorySyncService(new FakeErpClient([makeErpProduct(['isActive' => false])]));

    $service->sync();

    $product = Product::where('sku', '484084')->first();
    expect($product->status)->toBe(ProductStatus::Archived);
    expect($product->published_at)->toBeNull();
});

it('archives an existing product once the ERP stops marking it as active', function (): void {
    makeInventorySyncService(new FakeErpClient([makeErpProduct()]))->sync();
    expect(Product::where('sku', '484084')->first()->status)->toBe(ProductStatus::Published);

    makeInventorySyncService(new FakeErpClient([makeErpProduct(['isActive' => false])]))->sync();

    expect(Product::where('sku', '484084')->first()->status)->toBe(ProductStatus::Archived);
});

it('republishes an archived product once it becomes active again in the ERP', function (): void {
    makeInventorySyncService(new FakeErpClient([makeErpProduct(['isActive' => false])]))->sync();
    expect(Product::where('sku', '484084')->first()->status)->toBe(ProductStatus::Archived);

    makeInventorySyncService(new FakeErpClient([makeErpProduct(['isActive' => true])]))->sync();

    expect(Product::where('sku', '484084')->first()->status)->toBe(ProductStatus::Published);
});

it('overrides a manual status change on the next sync, since the ERP is the source of truth for visibility', function (): void {
    makeInventorySyncService(new FakeErpClient([makeErpProduct()]))->sync();

    Product::where('sku', '484084')->update(['status' => ProductStatus::Draft]);

    makeInventorySyncService(new FakeErpClient([makeErpProduct(['priceCents' => 800000])]))->sync();

    expect(Product::where('sku', '484084')->first()->status)->toBe(ProductStatus::Published);
});

it('archives products no longer returned by a full sync', function (): void {
    makeInventorySyncService(new FakeErpClient([makeErpProduct()]))->sync();
    expect(Product::where('sku', '484084')->first()->status)->toBe(ProductStatus::Published);

    CarbonImmutable::setTestNow(CarbonImmutable::now()->addMinute());

    $results = makeInventorySyncService(new FakeErpClient([]))->sync();

    expect(Product::where('sku', '484084')->first()->status)->toBe(ProductStatus::Archived);
    expect($results['archived'])->toBe(1);

    CarbonImmutable::setTestNow();
});

it('does not archive a solar kit synced by the AppSolar integration', function (): void {
    $product = Product::factory()->create([
        'sku' => 'KIT-APPSOLAR-1',
        'external_id' => 'KIT-APPSOLAR-1',
        'status' => ProductStatus::Published,
        'synced_at' => now()->subDay(),
    ]);

    SolarKitSpecification::create([
        'product_id' => $product->id,
        'supplier_sku' => 'KIT-APPSOLAR-1',
        'supplier_name' => 'EDELTEC',
        'supplier_available' => true,
        'supplier_cost_price_cents' => 100000,
        'supplier_sale_price_cents' => 150000,
        'kit_power_kwp' => 2.5,
    ]);

    makeInventorySyncService(new FakeErpClient([]))->sync();

    expect($product->fresh()->status)->toBe(ProductStatus::Published);
});

it('does not silently archive the whole catalog when a page fetch fails', function (): void {
    makeInventorySyncService(new FakeErpClient([makeErpProduct()]))->sync();
    expect(Product::where('sku', '484084')->first()->status)->toBe(ProductStatus::Published);

    CarbonImmutable::setTestNow(CarbonImmutable::now()->addMinute());

    $failingClient = new class implements ErpClientInterface
    {
        public function name(): string
        {
            return 'http_erp';
        }

        public function fetchProducts(): Collection
        {
            throw new RequestException(
                new Illuminate\Http\Client\Response(new Response(500))
            );
        }

        public function isAvailable(): bool
        {
            return false;
        }
    };

    makeInventorySyncService($failingClient)->sync();

    expect(Product::where('sku', '484084')->first()->status)->toBe(ProductStatus::Published);

    CarbonImmutable::setTestNow();
});
