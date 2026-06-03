<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Services;

use App\Domains\Catalog\Models\Product;
use App\Domains\Inventory\Data\ErpProductData;
use App\Domains\Inventory\Events\StockChanged;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class StockService
{
    public function getAvailable(int $productId, ?int $variantId = null, int $warehouseId = 1): int
    {
        $stock = DB::table('stocks')
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->where('variant_id', $variantId)
            ->first();

        return $stock?->quantity_available ?? 0;
    }

    public function reserve(int $productId, int $quantity, int $warehouseId = 1, ?int $variantId = null): bool
    {
        $available = $this->getAvailable($productId, $variantId, $warehouseId);

        if ($available < $quantity) {
            return false;
        }

        DB::table('stocks')->where([
            'product_id'   => $productId,
            'variant_id'   => $variantId,
            'warehouse_id' => $warehouseId,
        ])->decrement('quantity_available', $quantity);

        DB::table('stocks')->where([
            'product_id'   => $productId,
            'variant_id'   => $variantId,
            'warehouse_id' => $warehouseId,
        ])->increment('quantity_reserved', $quantity);

        event(new StockChanged($productId, -$quantity, 'reservation'));

        return true;
    }

    public function release(int $productId, int $quantity, int $warehouseId = 1, ?int $variantId = null): void
    {
        DB::table('stocks')->where([
            'product_id'   => $productId,
            'variant_id'   => $variantId,
            'warehouse_id' => $warehouseId,
        ])->increment('quantity_available', $quantity);

        DB::table('stocks')->where([
            'product_id'   => $productId,
            'variant_id'   => $variantId,
            'warehouse_id' => $warehouseId,
        ])->decrement('quantity_reserved', $quantity);

        event(new StockChanged($productId, $quantity, 'release'));
    }

    public function syncFromErp(Product $product, ErpProductData $data, int $warehouseId = 1): void
    {
        $before = $this->getAvailable($product->id, null, $warehouseId);

        DB::table('stocks')->updateOrInsert(
            ['product_id' => $product->id, 'variant_id' => null, 'warehouse_id' => $warehouseId],
            ['quantity_available' => $data->stockQuantity, 'updated_at' => now()]
        );

        $diff = $data->stockQuantity - $before;

        if ($diff !== 0) {
            DB::table('stock_movements')->insert([
                'product_id'   => $product->id,
                'warehouse_id' => $warehouseId,
                'type'         => 'sync',
                'quantity'     => $diff,
                'reason'       => 'Sincronização automática com ERP',
                'reference'    => $data->externalId,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);

            event(new StockChanged($product->id, $diff, 'sync'));
        }
    }
}
