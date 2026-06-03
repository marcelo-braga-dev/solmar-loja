<?php

declare(strict_types=1);

namespace App\Domains\Payments\Listeners;

use App\Domains\Inventory\Services\StockService;
use App\Domains\Payments\Events\PaymentApproved;
use Illuminate\Contracts\Queue\ShouldQueue;

final class ReleaseStockOnPaymentApproved implements ShouldQueue
{
    public string $queue = 'default';

    public function __construct(
        private readonly StockService $stock,
    ) {}

    public function handle(PaymentApproved $event): void
    {
        foreach ($event->order->items as $item) {
            if ($item->product_id !== null) {
                $this->stock->release(
                    productId: $item->product_id,
                    quantity: $item->quantity,
                    variantId: $item->variant_id,
                );
            }
        }
    }
}
