<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Domains\Catalog\Models\Product;
use App\Domains\Inventory\Events\StockChanged;
use App\Models\User;
use App\Notifications\LowStockNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

final class NotifyAdminsOnLowStock implements ShouldQueue
{
    private const LOW_STOCK_THRESHOLD = 5;

    public function handle(StockChanged $event): void
    {
        $currentStock = (int) \DB::table('stocks')
            ->where('product_id', $event->productId)
            ->whereNull('variant_id')
            ->sum('quantity_available');

        if ($currentStock >= self::LOW_STOCK_THRESHOLD) {
            return;
        }

        $product = Product::find($event->productId);

        if (! $product) {
            return;
        }

        $admins = User::role(['admin', 'manager'])->get();

        foreach ($admins as $admin) {
            $admin->notify(new LowStockNotification($product, $currentStock));
        }
    }
}
