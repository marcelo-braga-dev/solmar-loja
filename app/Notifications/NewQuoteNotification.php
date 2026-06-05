<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domains\Orders\Models\Quote;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class NewQuoteNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Quote $quote) {}

    /** @return string[] */
    public function via(mixed $notifiable): array { return ['mail']; }

    public function toMail(mixed $notifiable): MailMessage
    {
        $total = collect($this->quote->items ?? [])->sum(fn ($i) => $i['price_cents'] * $i['qty']);

        return (new MailMessage())
            ->subject("🧾 Nova Cotação — {$this->quote->name}")
            ->line("Uma nova solicitação de cotação foi recebida.")
            ->line("**Cliente:** {$this->quote->name} ({$this->quote->email})")
            ->line("**Empresa:** " . ($this->quote->company ?? 'Não informada'))
            ->line("**Itens:** " . count($this->quote->items ?? []) . " produto(s)")
            ->line("**Valor estimado:** R$ " . number_format($total / 100, 2, ',', '.'))
            ->action('Ver Cotação no Admin', url("/admin/quotes/{$this->quote->uuid}"))
            ->line('Responda em até 24h úteis para melhor atendimento.');
    }
}
