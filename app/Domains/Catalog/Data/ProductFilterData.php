<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Data;

use Spatie\LaravelData\Data;

final class ProductFilterData extends Data
{
    public function __construct(
        public readonly ?string $q = null,
        public readonly ?int $categoryId = null,
        public readonly ?int $brandId = null,
        public readonly ?int $priceMin = null,
        public readonly ?int $priceMax = null,
        public readonly bool $inStock = false,
        public readonly bool $featured = false,
        public readonly bool $onSale = false,
        public readonly string $sortBy = 'relevance',
        public readonly int $perPage = 24,
        /** @var int[] */
        public readonly array $attributeValueIds = [],
    ) {}

    public function sortColumn(): string
    {
        return match ($this->sortBy) {
            'price_asc'  => 'price_cents',
            'price_desc' => 'price_cents',
            'newest'     => 'published_at',
            default      => 'id',
        };
    }

    public function sortDirection(): string
    {
        return match ($this->sortBy) {
            'price_asc' => 'asc',
            default     => 'desc',
        };
    }
}
