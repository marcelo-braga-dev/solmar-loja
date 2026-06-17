<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Data;

use Spatie\LaravelData\Data;

final class ErpProductData extends Data
{
    public function __construct(
        public readonly string $externalId,
        public readonly string $sku,
        public readonly string $name,
        public readonly int $priceCents,
        public readonly int $stockQuantity,
        public readonly ?int $compareAtPriceCents = null,
        public readonly ?int $weightGrams = null,
        public readonly ?string $description = null,
        public readonly ?array $specifications = null,
        /** @var string[] */
        public readonly array $imageUrls = [],
        public readonly ?string $categoryName = null,
    ) {}
}
