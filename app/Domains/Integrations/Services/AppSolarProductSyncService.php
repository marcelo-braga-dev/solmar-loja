<?php

declare(strict_types=1);

namespace App\Domains\Integrations\Services;

use App\Domains\Catalog\Contracts\BrandRepositoryInterface;
use App\Domains\Catalog\Contracts\ProductRepositoryInterface;
use App\Domains\Catalog\Contracts\SolarKitSpecificationRepositoryInterface;
use App\Domains\Catalog\Data\ProductData;
use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Product;
use App\Domains\Integrations\Contracts\AppSolarClientInterface;
use App\Domains\Integrations\Data\AppSolarProductData;
use App\Domains\Integrations\Exceptions\AppSolarAuthenticationException;
use App\Domains\Integrations\Support\HtmlSanitizer;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Orquestra a sincronização do catálogo de kits solares entre a API do AppSolar
 * (distribuidor Edeltec) e o banco de dados da loja.
 *
 * Princípios (ver docs/08-integrations.md):
 *  - Idempotente: roda quantas vezes for preciso sem duplicar (upsert por SKU).
 *  - Auditável: cada execução gera um registro em `sync_logs` (source = 'appsolar').
 *  - Não destrutiva: produtos ausentes na origem são arquivados, nunca deletados.
 *  - Resiliente: falha em um item não interrompe os demais; é reprocessável.
 *  - Completa: nenhum campo da API é descartado — tudo é persistido em
 *    `solar_kit_specifications`, além de popular as colunas comerciais de `products`.
 */
final class AppSolarProductSyncService
{
    private const SOURCE = 'appsolar';

    public function __construct(
        private readonly AppSolarClientInterface $client,
        private readonly ProductRepositoryInterface $products,
        private readonly BrandRepositoryInterface $brands,
        private readonly SolarKitSpecificationRepositoryInterface $specifications,
    ) {}

    /**
     * Sincronização completa: percorre todo o catálogo e arquiva kits descontinuados.
     *
     * @return array{total: int, created: int, updated: int, errors: int, archived: int, error_list: array<int, array{sku: string, error: string}>}
     */
    public function syncFull(): array
    {
        return $this->run(updatedSince: null, type: 'full');
    }

    /**
     * Sincronização incremental: busca apenas o que mudou desde a última execução bem-sucedida.
     *
     * @return array{total: int, created: int, updated: int, errors: int, archived: int, error_list: array<int, array{sku: string, error: string}>}
     */
    public function syncIncremental(): array
    {
        $since = $this->lastSuccessfulSyncStartedAt();

        return $this->run(updatedSince: $since, type: $since !== null ? 'incremental' : 'full');
    }

    /** @return array{total: int, created: int, updated: int, errors: int, archived: int, error_list: array<int, array{sku: string, error: string}>} */
    private function run(?CarbonInterface $updatedSince, string $type): array
    {
        $started = CarbonImmutable::now();
        $results = ['total' => 0, 'created' => 0, 'updated' => 0, 'errors' => 0, 'archived' => 0, 'error_list' => []];

        $logId = DB::table('sync_logs')->insertGetId([
            'source' => self::SOURCE,
            'started_at' => $started,
            'status' => 'running',
            'notes' => $type === 'full'
                ? 'Sincronização completa'
                : "Sincronização incremental desde {$updatedSince?->toIso8601String()}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            foreach ($this->client->fetchProducts($updatedSince) as $item) {
                $results['total']++;

                try {
                    $wasCreated = $this->processItem($item);
                    $results[$wasCreated ? 'created' : 'updated']++;
                } catch (Throwable $e) {
                    $results['errors']++;
                    $results['error_list'][] = ['sku' => $item->sku, 'error' => $e->getMessage()];
                    Log::warning('AppSolar sync item failed', ['sku' => $item->sku, 'error' => $e->getMessage()]);
                }
            }

            if ($type === 'full' && $results['errors'] === 0) {
                $results['archived'] = $this->specifications->archiveProductsNotSyncedSince($started);
            }

            DB::table('sync_logs')->where('id', $logId)->update([
                'status' => $results['errors'] > 0 ? 'partial' : 'success',
                'finished_at' => now(),
                'total_items' => $results['total'],
                'created_items' => $results['created'],
                'updated_items' => $results['updated'],
                'error_items' => $results['errors'],
                'archived_items' => $results['archived'],
                'errors' => $results['errors'] > 0 ? json_encode($results['error_list']) : null,
                'updated_at' => now(),
            ]);
        } catch (AppSolarAuthenticationException $e) {
            DB::table('sync_logs')->where('id', $logId)->update([
                'status' => 'failed',
                'finished_at' => now(),
                'errors' => json_encode(['fatal' => $e->getMessage()]),
                'updated_at' => now(),
            ]);
            Log::error('AppSolar sync failed: credenciais inválidas. Verifique APPSOLAR_API_TOKEN.', ['error' => $e->getMessage()]);
        } catch (Throwable $e) {
            DB::table('sync_logs')->where('id', $logId)->update([
                'status' => 'failed',
                'finished_at' => now(),
                'errors' => json_encode(['fatal' => $e->getMessage()]),
                'updated_at' => now(),
            ]);
            Log::error('AppSolar product sync failed', ['error' => $e->getMessage()]);
        }

        return $results;
    }

    private function lastSuccessfulSyncStartedAt(): ?CarbonImmutable
    {
        $lastSync = DB::table('sync_logs')
            ->where('source', self::SOURCE)
            ->whereIn('status', ['success', 'partial'])
            ->orderByDesc('started_at')
            ->first();

        return $lastSync !== null ? CarbonImmutable::parse($lastSync->started_at) : null;
    }

    private function processItem(AppSolarProductData $item): bool
    {
        $costCents = (int) round($item->costPrice * 100);
        $priceCents = (int) round($item->salePrice * 100);

        $panelBrand = $item->panelBrand !== null ? $this->brands->findOrCreateByName($item->panelBrand, $item->panelBrandLogo) : null;
        $inverterBrand = $item->inverterBrand !== null ? $this->brands->findOrCreateByName($item->inverterBrand, $item->inverterBrandLogo) : null;
        $primaryBrand = $panelBrand ?? $inverterBrand;
        $brandId = $primaryBrand?->id;

        $specifications = array_filter([
            'Potência do kit' => $item->kitPowerKwp > 0 ? "{$item->kitPowerKwp} kWp" : null,
            'Tensão' => $item->voltage !== null ? "{$item->voltage}V" : null,
            'Inversor' => $this->describeComponent($item->inverterBrand, $item->inverterPowerKw, 'kW'),
            'Painel' => $this->describeComponent($item->panelBrand, $item->panelPowerW, 'W'),
            'Estrutura' => $item->structureType,
            'Fornecedor' => $item->supplierName,
        ], static fn (?string $value): bool => $value !== null && $value !== '');

        $product = $this->products->findBySku($item->sku);
        $wasCreated = $product === null;

        if ($product === null) {
            $product = $this->products->create(new ProductData(
                name: $item->name,
                slug: Str::slug($item->name).'-'.Str::lower(Str::random(6)),
                sku: $item->sku,
                priceCents: $priceCents,
                status: ProductStatus::Draft,
                costCents: $costCents,
                brandId: $brandId,
                specifications: $specifications,
                externalId: $item->sku,
            ));
            $product->update(['synced_at' => now()]);
        } else {
            $product = $this->products->updateAttributes($product, [
                'name' => $item->name,
                'price_cents' => $priceCents,
                'cost_cents' => $costCents,
                'brand_id' => $brandId ?? $product->brand_id,
                'specifications' => $specifications,
                'external_id' => $item->sku,
                'synced_at' => now(),
            ]);
        }

        $this->specifications->updateOrCreateForProduct($product, [
            'supplier_sku' => $item->sku,
            'supplier_name' => $item->supplierName,
            'supplier_available' => $item->available,
            'supplier_cost_price_cents' => $costCents,
            'supplier_sale_price_cents' => $priceCents,
            'kit_power_kwp' => $item->kitPowerKwp,
            'voltage' => $item->voltage,
            'structure_type' => $item->structureType,
            'inverter_brand' => $item->inverterBrand,
            'inverter_brand_logo_url' => $item->inverterBrandLogo,
            'inverter_image_url' => $item->inverterImage,
            'inverter_power_kw' => $item->inverterPowerKw,
            'panel_brand' => $item->panelBrand,
            'panel_brand_logo_url' => $item->panelBrandLogo,
            'panel_image_url' => $item->panelImage,
            'panel_power_w' => $item->panelPowerW,
            'components_html' => HtmlSanitizer::sanitizeTable($item->componentsHtml),
            'supplier_notes' => $item->notes,
            'supplier_updated_at' => $item->updatedAt,
        ]);

        $this->syncImage($product, 'panel', $item->panelImage, $item->panelBrand ?? $product->name);
        $this->syncImage($product, 'inverter', $item->inverterImage, $item->inverterBrand ?? $product->name);

        if ($product->status === ProductStatus::Published) {
            $product->searchable();
        }

        return $wasCreated;
    }

    private function describeComponent(?string $brand, ?float $power, string $unit): ?string
    {
        $parts = array_filter([$brand, $power !== null ? "{$power} {$unit}" : null]);

        return $parts === [] ? null : implode(' — ', $parts);
    }

    /**
     * Cria/atualiza a imagem do produto identificada por `$tag` (inverter|panel), usando
     * diretamente a URL fornecida pela AppSolar — sem download/armazenamento local — já que
     * `ProductImage::url()` retorna URLs externas (http) tal como recebidas.
     */
    private function syncImage(Product $product, string $tag, ?string $url, string $alt): void
    {
        $existing = $product->images()->where('tag', $tag)->first();

        if ($url === null) {
            $existing?->delete();

            return;
        }

        if ($existing !== null) {
            if ($existing->path !== $url) {
                $existing->update(['path' => $url, 'alt' => $alt]);
            }

            return;
        }

        $product->images()->create([
            'path' => $url,
            'alt' => $alt,
            'tag' => $tag,
            'position' => $product->images()->count(),
            'is_cover' => $product->images()->count() === 0,
        ]);
    }
}
