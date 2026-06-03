<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Services;

use App\Domains\Catalog\Contracts\ProductRepositoryInterface;
use App\Domains\Catalog\Data\ProductData;
use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Product;
use App\Domains\Inventory\Contracts\ErpClientInterface;
use App\Domains\Inventory\Data\ErpProductData;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

final class InventorySyncService
{
    public function __construct(
        private readonly ErpClientInterface $client,
        private readonly ProductRepositoryInterface $products,
        private readonly StockService $stock,
    ) {}

    public function sync(): array
    {
        $syncId  = Str::uuid()->toString();
        $started = now();
        $results = ['total' => 0, 'created' => 0, 'updated' => 0, 'errors' => 0, 'error_list' => []];

        $logId = DB::table('sync_logs')->insertGetId([
            'source'     => $this->client->name(),
            'started_at' => $started,
            'status'     => 'running',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            $items = $this->client->fetchProducts();
            $results['total'] = $items->count();

            foreach ($items as $item) {
                try {
                    $this->processItem($item, $results);
                } catch (Throwable $e) {
                    $results['errors']++;
                    $results['error_list'][] = [
                        'sku'   => $item->sku,
                        'error' => $e->getMessage(),
                    ];
                    Log::warning('Sync item failed', ['sku' => $item->sku, 'error' => $e->getMessage()]);
                }
            }

            DB::table('sync_logs')->where('id', $logId)->update([
                'status'        => $results['errors'] > 0 ? 'partial' : 'success',
                'finished_at'   => now(),
                'total_items'   => $results['total'],
                'created_items' => $results['created'],
                'updated_items' => $results['updated'],
                'error_items'   => $results['errors'],
                'errors'        => $results['errors'] > 0 ? json_encode($results['error_list']) : null,
                'updated_at'    => now(),
            ]);
        } catch (Throwable $e) {
            DB::table('sync_logs')->where('id', $logId)->update([
                'status'      => 'failed',
                'finished_at' => now(),
                'errors'      => json_encode(['fatal' => $e->getMessage()]),
                'updated_at'  => now(),
            ]);
            Log::error('Inventory sync failed', ['error' => $e->getMessage()]);
        }

        return $results;
    }

    private function processItem(ErpProductData $data, array &$results): void
    {
        $product = Product::where('external_id', $data->externalId)
            ->orWhere('sku', $data->sku)
            ->first();

        if ($product === null) {
            // Cria produto novo como draft
            $productData = new ProductData(
                name: $data->name,
                slug: Str::slug($data->name).'-'.Str::random(4),
                sku: $data->sku,
                priceCents: $data->priceCents,
                status: ProductStatus::Draft,
                description: $data->description,
                compareAtPriceCents: $data->compareAtPriceCents,
                weightGrams: $data->weightGrams,
                specifications: $data->specifications,
                externalId: $data->externalId,
            );

            $product = $this->products->create($productData);
            $results['created']++;
        } else {
            // Atualiza preço, estoque e dados do ERP (preserva status e outros campos locais)
            $product->update([
                'price_cents'            => $data->priceCents,
                'compare_at_price_cents' => $data->compareAtPriceCents,
                'weight_grams'           => $data->weightGrams ?? $product->weight_grams,
                'specifications'         => $data->specifications ?? $product->specifications,
                'external_id'            => $data->externalId,
                'synced_at'              => now(),
            ]);
            $results['updated']++;
        }

        // Sincroniza estoque
        $this->stock->syncFromErp($product, $data);

        // Reindexa no Meilisearch se publicado
        if ($product->status === ProductStatus::Published) {
            $product->searchable();
        }
    }
}
