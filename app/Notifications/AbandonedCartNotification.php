<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domains\Orders\Models\Cart;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class AbandonedCartNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Cart $cart,
    ) {}

    /** @return string[] */
    public function via(mixed $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        $cartUrl  = url('/carrinho');
        $name     = $notifiable->name ?? 'Cliente';
        $total    = 'R$ ' . number_format($this->cart->totalCents() / 100, 2, ',', '.');
        $itemCount = $this->cart->itemCount();

        return (new MailMessage())
            ->subject("🛒 Você esqueceu {$itemCount} " . ($itemCount === 1 ? 'item' : 'itens') . ' no carrinho!')
            ->greeting("Oi, {$name}!")
            ->line("Percebemos que você deixou " . ($itemCount === 1 ? 'um produto' : "{$itemCount} produtos") . " no seu carrinho no valor de **{$total}**.")
            ->line('Seus produtos ainda estão reservados por tempo limitado — o estoque pode esgotar!')
            ->action('Finalizar Minha Compra', $cartUrl)
            ->line('Se precisar de ajuda ou tiver dúvidas sobre algum produto, nossa equipe está disponível de segunda a sexta, das 8h às 18h.')
            ->salutation('Até logo! — Equipe SolarHub Commerce');
    }
}
