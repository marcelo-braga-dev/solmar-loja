<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domains\B2b\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class NewCompanyRegistrationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Company $company) {}

    /** @return string[] */
    public function via(mixed $notifiable): array { return ['mail']; }

    public function toMail(mixed $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject("🏢 Nova Empresa Aguardando Aprovação — {$this->company->razao_social}")
            ->line("Uma nova empresa foi cadastrada no Portal B2B e aguarda aprovação.")
            ->line("**Razão Social:** {$this->company->razao_social}")
            ->line("**CNPJ:** {$this->company->cnpj}")
            ->line("**Tipo:** {$this->company->typeLabel()}")
            ->line("**Contato:** {$this->company->contact_name} ({$this->company->contact_email})")
            ->action('Aprovar / Revisar', url("/admin/companies/{$this->company->uuid}"))
            ->line('Acesse o painel admin para aprovar ou reprovar esta empresa.');
    }
}
