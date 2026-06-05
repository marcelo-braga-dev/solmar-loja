<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domains\Orders\Models\Cart;
use App\Notifications\AbandonedCartNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

final class AbandonedCartRecoveryJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries   = 1;
    public int $timeout = 120;

    public function handle(): void
    {
        // Carrinhos com itens, donos autenticados, abandonados há mais de 2h e não notificados
        $carts = Cart::query()
            ->with(['user', 'items.product'])
            ->whereNotNull('user_id')
            ->whereNull('recovery_email_sent_at')
            ->whereHas('items')
            ->where(function ($q): void {
                // Marcados como abandonados há mais de 2h
                $q->where('abandoned_at', '<', now()->subHours(2))
                  // ou sem atividade há mais de 3h (sem abandoned_at)
                  ->orWhere(function ($q2): void {
                      $q2->whereNull('abandoned_at')
                         ->where('updated_at', '<', now()->subHours(3))
                         ->whereNull('recovery_email_sent_at');
                  });
            })
            ->limit(50)
            ->get();

        foreach ($carts as $cart) {
            try {
                if (! $cart->user || ! $cart->user->email) {
                    continue;
                }

                // Não enviar se o carrinho foi convertido em pedido recentemente
                $hasRecentOrder = $cart->user
                    ->orders()
                    ->where('placed_at', '>', now()->subHours(4))
                    ->exists();

                if ($hasRecentOrder) {
                    $cart->update(['recovery_email_sent_at' => now()]);
                    continue;
                }

                $cart->user->notify(new AbandonedCartNotification($cart));
                $cart->update([
                    'abandoned_at'            => $cart->abandoned_at ?? now(),
                    'recovery_email_sent_at'  => now(),
                ]);

                Log::info('Abandoned cart recovery email sent', [
                    'cart_id' => $cart->id,
                    'user_id' => $cart->user_id,
                ]);
            } catch (\Throwable $e) {
                Log::warning('Abandoned cart recovery failed', [
                    'cart_id' => $cart->id,
                    'error'   => $e->getMessage(),
                ]);
            }
        }
    }
}
