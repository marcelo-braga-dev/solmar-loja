<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Domains\Catalog\Models\Product;
use App\Domains\Inventory\Events\StockChanged;
use App\Domains\Inventory\Services\StockAlertService;
use Illuminate\Support\Facades\DB;

final class NotifyStockAlerts
{
    public function __construct(
        private readonly StockAlertService $alertService,
    ) {}

    public function handle(StockChanged $event): void
    {
        // Só notifica quando estoque vai de zero para positivo
        if ($event->quantityDiff <= 0) {
            return;
        }

        $product = Product::find($event->productId);
        if (! $product) {
            return;
        }

        // Verifica se o estoque ficou disponível
        $available = DB::table('stocks')
            ->where('product_id', $event->productId)
            ->sum('quantity_available');

        if ($available <= 0) {
            return;
        }

        $this->alertService->notifyForProduct($product);
    }
}
