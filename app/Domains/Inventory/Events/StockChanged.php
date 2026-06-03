<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Events;

use Illuminate\Foundation\Events\Dispatchable;

final class StockChanged
{
    use Dispatchable;

    public function __construct(
        public readonly int $productId,
        public readonly int $quantityDiff,
        public readonly string $type,
    ) {}
}
