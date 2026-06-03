<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Events;

use App\Domains\Catalog\Models\Product;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class ProductPublished
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Product $product,
    ) {}
}
