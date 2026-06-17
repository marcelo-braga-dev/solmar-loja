<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Repositories;

use App\Domains\Catalog\Contracts\SolarKitSpecificationRepositoryInterface;
use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Models\SolarKitSpecification;
use Carbon\CarbonInterface;

final class EloquentSolarKitSpecificationRepository implements SolarKitSpecificationRepositoryInterface
{
    /** @param array<string, mixed> $attributes */
    public function updateOrCreateForProduct(Product $product, array $attributes): SolarKitSpecification
    {
        return SolarKitSpecification::query()->updateOrCreate(
            ['product_id' => $product->id],
            $attributes,
        );
    }

    public function archiveProductsNotSyncedSince(CarbonInterface $before): int
    {
        return Product::query()
            ->whereHas('solarKitSpecification')
            ->where('synced_at', '<', $before)
            ->where('status', '!=', ProductStatus::Archived->value)
            ->update(['status' => ProductStatus::Archived->value]);
    }
}
