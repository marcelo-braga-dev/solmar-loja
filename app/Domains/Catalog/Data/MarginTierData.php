<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Data;

use Spatie\LaravelData\Data;

final class MarginTierData extends Data
{
    public function __construct(
        public readonly float $minKwp,
        public readonly ?float $maxKwp,
        public readonly float $marginPercent,
        public readonly bool $isActive = true,
    ) {}
}
