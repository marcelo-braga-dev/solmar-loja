<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Data;

use Spatie\LaravelData\Data;

final class BrandData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $logo = null,
        public readonly ?string $description = null,
        public readonly bool $isActive = true,
        public readonly ?string $website = null,
        public readonly ?string $metaTitle = null,
        public readonly ?string $metaDescription = null,
    ) {}
}
