<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Data;

use Spatie\LaravelData\Data;

final class CategoryData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly string $slug,
        public readonly ?int $parentId = null,
        public readonly ?string $description = null,
        public readonly ?string $image = null,
        public readonly ?string $icon = null,
        public readonly int $position = 0,
        public readonly bool $isActive = true,
        public readonly ?string $metaTitle = null,
        public readonly ?string $metaDescription = null,
    ) {}
}
