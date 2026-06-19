<?php

declare(strict_types=1);

use App\Domains\Orders\Models\Proposal;
use App\Domains\Orders\Services\ProposalService;
use App\Mail\ProposalSent;
use App\Models\User;
use App\Notifications\ProposalRespondedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function makeProposalData(array $overrides = []): array
{
    return array_merge([
        'title'          => 'Kit Solar 5kWp',
        'customer_name'  => 'Maria Souza',
        'customer_email' => 'maria@example.com',
        'items'          => [
            ['item_type' => 'custom', 'description' => 'Painel solar 550W', 'quantity' => 10, 'unit_price_cents' => 90000, 'discount_percent' => 0],
        ],
    ], $overrides);
}

it('creates a proposal as draft with recalculated totals', function (): void {
    $consultant = User::factory()->create();
    $service = app(ProposalService::class);

    $proposal = $service->create($consultant, makeProposalData());

    expect($proposal->status)->toBe('draft');
    expect($proposal->subtotal_cents)->toBe(900000);
    expect($proposal->total_cents)->toBe(900000);
    expect($proposal->items)->toHaveCount(1);
    expect($proposal->reference)->toStartWith('PROP-');
});

it('applies discount and tax when creating a proposal', function (): void {
    $consultant = User::factory()->create();
    $service = app(ProposalService::class);

    $proposal = $service->create($consultant, makeProposalData([
        'discount_cents' => 10000,
        'tax_cents'      => 5000,
    ]));

    expect($proposal->subtotal_cents)->toBe(900000);
    expect($proposal->total_cents)->toBe(895000);
});

it('updates an editable (draft) proposal and replaces its items', function (): void {
    $consultant = User::factory()->create();
    $service = app(ProposalService::class);

    $proposal = $service->create($consultant, makeProposalData());

    $updated = $service->update($proposal, makeProposalData([
        'title' => 'Kit Solar 8kWp (atualizado)',
        'items' => [
            ['item_type' => 'custom', 'description' => 'Painel solar 600W', 'quantity' => 16, 'unit_price_cents' => 95000, 'discount_percent' => 0],
        ],
    ]));

    expect($updated->title)->toBe('Kit Solar 8kWp (atualizado)');
    expect($updated->items)->toHaveCount(1);
    expect($updated->subtotal_cents)->toBe(1520000);
});

it('refuses to update a proposal that is no longer in draft', function (): void {
    $consultant = User::factory()->create();
    $service = app(ProposalService::class);

    $proposal = $service->create($consultant, makeProposalData());
    $proposal->update(['status' => 'sent']);

    expect(fn () => $service->update($proposal, makeProposalData()))
        ->toThrow(DomainException::class, 'Apenas propostas em rascunho podem ser editadas.');
});

it('sends a draft proposal to the customer and queues an email', function (): void {
    Mail::fake();

    $consultant = User::factory()->create();
    $service = app(ProposalService::class);
    $proposal = $service->create($consultant, makeProposalData());

    $service->sendToCustomer($proposal);

    expect($proposal->status)->toBe('sent');
    expect($proposal->sent_at)->not->toBeNull();
    Mail::assertQueued(ProposalSent::class, fn (ProposalSent $mail) => $mail->proposal->is($proposal));
});

it('refuses to send a proposal without a customer email', function (): void {
    $consultant = User::factory()->create();
    $service = app(ProposalService::class);
    $proposal = $service->create($consultant, makeProposalData(['customer_email' => null]));

    expect(fn () => $service->sendToCustomer($proposal))
        ->toThrow(DomainException::class, 'Informe o e-mail do cliente antes de enviar a proposta.');
});

it('refuses to send a proposal that already left draft status', function (): void {
    $consultant = User::factory()->create();
    $service = app(ProposalService::class);
    $proposal = $service->create($consultant, makeProposalData());
    $proposal->update(['status' => 'sent']);

    expect(fn () => $service->sendToCustomer($proposal))
        ->toThrow(DomainException::class, 'Apenas propostas em rascunho podem ser enviadas.');
});

it('marks a sent proposal as viewed on first view only', function (): void {
    $consultant = User::factory()->create();
    $service = app(ProposalService::class);
    $proposal = $service->create($consultant, makeProposalData());
    $proposal->update(['status' => 'sent']);

    $service->markViewed($proposal);
    expect($proposal->status)->toBe('viewed');
    $firstViewedAt = $proposal->viewed_at;

    $service->markViewed($proposal->refresh());
    expect($proposal->viewed_at->equalTo($firstViewedAt))->toBeTrue();
});

it('accepts a sent proposal and notifies the consultant', function (): void {
    Notification::fake();

    $consultant = User::factory()->create();
    $service = app(ProposalService::class);
    $proposal = $service->create($consultant, makeProposalData());
    $proposal->update(['status' => 'sent']);

    $service->accept($proposal);

    expect($proposal->status)->toBe('accepted');
    expect($proposal->accepted_at)->not->toBeNull();
    Notification::assertSentTo($consultant, ProposalRespondedNotification::class);
});

it('rejects a sent proposal with a reason and records it', function (): void {
    Notification::fake();

    $consultant = User::factory()->create();
    $service = app(ProposalService::class);
    $proposal = $service->create($consultant, makeProposalData());
    $proposal->update(['status' => 'viewed']);

    $service->reject($proposal, 'Preço acima do orçamento');

    expect($proposal->status)->toBe('rejected');
    expect($proposal->rejected_at)->not->toBeNull();
    expect($proposal->internal_notes)->toContain('Preço acima do orçamento');
    Notification::assertSentTo($consultant, ProposalRespondedNotification::class);
});

it('refuses to respond to a proposal still in draft', function (): void {
    $consultant = User::factory()->create();
    $service = app(ProposalService::class);
    $proposal = $service->create($consultant, makeProposalData());

    expect(fn () => $service->accept($proposal))
        ->toThrow(DomainException::class, 'Esta proposta já foi respondida.');
});

it('refuses to respond to an already accepted proposal', function (): void {
    $consultant = User::factory()->create();
    $service = app(ProposalService::class);
    $proposal = $service->create($consultant, makeProposalData());
    $proposal->update(['status' => 'accepted', 'accepted_at' => now()]);

    expect(fn () => $service->reject($proposal))
        ->toThrow(DomainException::class, 'Esta proposta já foi respondida.');
});

it('refuses to respond to an expired proposal', function (): void {
    $consultant = User::factory()->create();
    $service = app(ProposalService::class);
    $proposal = $service->create($consultant, makeProposalData());
    $proposal->update(['status' => 'sent', 'valid_until' => now()->subDay()]);

    expect(fn () => $service->accept($proposal))
        ->toThrow(DomainException::class, 'Esta proposta expirou.');
});
