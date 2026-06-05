<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Services;

use App\Domains\Catalog\Models\Product;
use App\Domains\Inventory\Models\StockAlert;
use App\Notifications\StockAvailableNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

final class StockAlertService
{
    public function subscribe(Product $product, string $email, ?string $name = null): StockAlert
    {
        return StockAlert::firstOrCreate(
            ['product_id' => $product->id, 'email' => $email],
            ['name' => $name]
        );
    }

    public function unsubscribe(string $token): bool
    {
        return (bool) StockAlert::where('token', $token)->delete();
    }

    public function notifyForProduct(Product $product): int
    {
        $alerts = StockAlert::where('product_id', $product->id)
            ->whereNull('notified_at')
            ->get();

        $notified = 0;

        foreach ($alerts as $alert) {
            try {
                Notification::route('mail', [$alert->email => $alert->name ?? $alert->email])
                    ->notify(new StockAvailableNotification($product, $alert));

                $alert->update(['notified_at' => now()]);
                $notified++;
            } catch (\Throwable $e) {
                Log::warning('StockAlert notification failed', [
                    'alert_id' => $alert->id,
                    'email'    => $alert->email,
                    'error'    => $e->getMessage(),
                ]);
            }
        }

        return $notified;
    }

    public function pendingCount(Product $product): int
    {
        return StockAlert::where('product_id', $product->id)
            ->whereNull('notified_at')
            ->count();
    }
}
