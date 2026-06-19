<?php

declare(strict_types=1);

namespace App\Mail;

use App\Domains\Orders\Models\Proposal;
use App\Domains\Settings\Services\SettingsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

final class ProposalSent extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly Proposal $proposal) {}

    public function envelope(): Envelope
    {
        $storeName = app(SettingsService::class)->get('store_name', config('app.name'));

        return new Envelope(
            subject: "{$this->proposal->reference} — Proposta comercial da {$storeName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.proposals.sent',
            with: [
                'proposal' => $this->proposal->loadMissing('items'),
                'viewUrl' => route('proposals.public.show', $this->proposal->uuid),
                'storeName' => app(SettingsService::class)->get('store_name', config('app.name')),
            ],
        );
    }
}
