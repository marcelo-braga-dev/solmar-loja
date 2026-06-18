<?php

declare(strict_types=1);

namespace App\Mail;

use App\Domains\Marketing\Models\NewsletterSubscriber;
use App\Domains\Settings\Services\SettingsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

final class NewsletterConfirmation extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly NewsletterSubscriber $subscriber) {}

    public function envelope(): Envelope
    {
        $storeName = app(SettingsService::class)->get('store_name', config('app.name'));

        return new Envelope(
            subject: "Confirme sua inscrição na newsletter — {$storeName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.newsletter.confirmation',
            with: [
                'confirmUrl' => route('newsletter.confirm', $this->subscriber->token),
                'unsubscribeUrl' => route('newsletter.unsubscribe', $this->subscriber->token),
                'subscriberName' => $this->subscriber->name ?? 'Assinante',
                'storeName' => app(SettingsService::class)->get('store_name', config('app.name')),
            ],
        );
    }
}
