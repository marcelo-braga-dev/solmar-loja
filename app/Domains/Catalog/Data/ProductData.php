<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Data;

use App\Domains\Catalog\Enums\ProductStatus;
use Spatie\LaravelData\Data;

final class ProductData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly string $slug,
        public readonly string $sku,
        public readonly int $priceCents,
        public readonly ProductStatus $status = ProductStatus::Draft,
        public readonly ?string $shortDescription = null,
        public readonly ?string $description = null,
        public readonly ?int $compareAtPriceCents = null,
        public readonly ?int $costCents = null,
        public readonly ?int $brandId = null,
        public readonly ?int $weightGrams = null,
        public readonly ?int $lengthMm = null,
        public readonly ?int $widthMm = null,
        public readonly ?int $heightMm = null,
        public readonly ?array $specifications = null,
        public readonly bool $featured = false,
        public readonly ?string $metaTitle = null,
        public readonly ?string $metaDescription = null,
        public readonly ?string $externalId = null,
        /** @var int[] */
        public readonly array $categoryIds = [],
    ) {}
}
