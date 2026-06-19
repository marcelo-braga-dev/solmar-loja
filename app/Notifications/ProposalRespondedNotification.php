<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domains\Orders\Models\Proposal;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class ProposalRespondedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Proposal $proposal,
        private readonly string $action,
        private readonly ?string $reason = null,
    ) {}

    /** @return string[] */
    public function via(mixed $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        $proposalUrl = url("/consultor/propostas/{$this->proposal->uuid}");

        $message = (new MailMessage)
            ->subject($this->action === 'accepted'
                ? "🎉 Proposta {$this->proposal->reference} foi aceita!"
                : "Proposta {$this->proposal->reference} foi recusada")
            ->greeting($this->action === 'accepted' ? 'Boa notícia!' : 'Aviso')
            ->line("O cliente {$this->proposal->customer_name} ".($this->action === 'accepted' ? 'aceitou' : 'recusou')." a proposta {$this->proposal->reference}.");

        if ($this->reason) {
            $message->line("Motivo informado: {$this->reason}");
        }

        return $message
            ->action('Ver Proposta', $proposalUrl)
            ->line('Acesse o painel do consultor para mais detalhes.');
    }
}
