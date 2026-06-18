<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domains\Catalog\Models\Product;
use App\Domains\Inventory\Models\StockAlert;
use App\Domains\Settings\Services\SettingsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class StockAvailableNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Product $product,
        private readonly StockAlert $alert,
    ) {}

    /** @return string[] */
    public function via(mixed $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        $productUrl = url("/produtos/{$this->product->slug}");
        $unsubUrl = url("/alertas/cancelar/{$this->alert->token}");
        $greeting = 'Boa notícia'.($this->alert->name ? ", {$this->alert->name}" : '').'!';

        return (new MailMessage)
            ->subject("✅ {$this->product->name} voltou ao estoque!")
            ->greeting($greeting)
            ->line('O produto que você estava esperando voltou ao estoque:')
            ->line("**{$this->product->name}**")
            ->action('Comprar Agora', $productUrl)
            ->line('Corra! O estoque pode esgotar novamente rapidamente.')
            ->salutation('Aproveite! — '.app(SettingsService::class)->get('store_name', config('app.name')))
            ->with(['unsubscribe_url' => $unsubUrl]);
    }
}
