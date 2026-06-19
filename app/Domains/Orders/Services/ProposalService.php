<?php

declare(strict_types=1);

namespace App\Domains\Orders\Services;

use App\Domains\Orders\Models\Proposal;
use App\Domains\Orders\Models\ProposalItem;
use App\Mail\ProposalSent;
use App\Models\User;
use App\Notifications\ProposalRespondedNotification;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

final class ProposalService
{
    /** @param array<string, mixed> $data */
    public function create(User $consultant, array $data): Proposal
    {
        return DB::transaction(function () use ($consultant, $data): Proposal {
            $proposal = Proposal::create([
                'user_id' => $consultant->id,
                'title' => $data['title'],
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'customer_city' => $data['customer_city'] ?? null,
                'customer_state' => $data['customer_state'] ?? null,
                'notes' => $data['notes'] ?? null,
                'valid_until' => $data['valid_until'] ?? null,
                'discount_cents' => $data['discount_cents'] ?? 0,
                'tax_cents' => $data['tax_cents'] ?? 0,
                'status' => 'draft',
            ]);

            $this->syncItems($proposal, $data['items']);
            $proposal->recalculate();

            return $proposal;
        });
    }

    /** @param array<string, mixed> $data */
    public function update(Proposal $proposal, array $data): Proposal
    {
        if (! $proposal->isEditable()) {
            throw new DomainException('Apenas propostas em rascunho podem ser editadas.');
        }

        DB::transaction(function () use ($proposal, $data): void {
            $proposal->update([
                'title' => $data['title'],
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'customer_city' => $data['customer_city'] ?? null,
                'customer_state' => $data['customer_state'] ?? null,
                'notes' => $data['notes'] ?? null,
                'valid_until' => $data['valid_until'] ?? null,
                'discount_cents' => $data['discount_cents'] ?? 0,
                'tax_cents' => $data['tax_cents'] ?? 0,
            ]);

            $proposal->items()->delete();
            $this->syncItems($proposal, $data['items']);
            $proposal->recalculate();
        });

        return $proposal->refresh();
    }

    public function sendToCustomer(Proposal $proposal): void
    {
        if ($proposal->status !== 'draft') {
            throw new DomainException('Apenas propostas em rascunho podem ser enviadas.');
        }

        if (! $proposal->customer_email) {
            throw new DomainException('Informe o e-mail do cliente antes de enviar a proposta.');
        }

        $proposal->update(['status' => 'sent', 'sent_at' => now()]);

        Mail::to($proposal->customer_email)->queue(new ProposalSent($proposal));

        Log::info('Proposal sent to customer', ['proposal_uuid' => $proposal->uuid]);
    }

    public function markViewed(Proposal $proposal): void
    {
        if ($proposal->status === 'sent') {
            $proposal->update(['status' => 'viewed', 'viewed_at' => now()]);
        }
    }

    public function accept(Proposal $proposal): void
    {
        $this->guardRespondable($proposal);

        $proposal->update(['status' => 'accepted', 'accepted_at' => now()]);

        $this->notifyConsultant($proposal, 'accepted');

        Log::info('Proposal accepted by customer', ['proposal_uuid' => $proposal->uuid]);
    }

    public function reject(Proposal $proposal, ?string $reason = null): void
    {
        $this->guardRespondable($proposal);

        $proposal->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'internal_notes' => trim(($proposal->internal_notes ?? '').($reason ? "\nMotivo da recusa: {$reason}" : '')),
        ]);

        $this->notifyConsultant($proposal, 'rejected', $reason);

        Log::info('Proposal rejected by customer', ['proposal_uuid' => $proposal->uuid]);
    }

    /** @param array<int, array<string, mixed>> $items */
    private function syncItems(Proposal $proposal, array $items): void
    {
        foreach ($items as $i => $itemData) {
            ProposalItem::create([
                'proposal_id' => $proposal->id,
                'item_type' => $itemData['item_type'],
                'product_id' => $itemData['product_id'] ?? null,
                'description' => $itemData['description'],
                'unit' => $itemData['unit'] ?? 'un',
                'quantity' => $itemData['quantity'],
                'unit_price_cents' => $itemData['unit_price_cents'],
                'discount_percent' => $itemData['discount_percent'] ?? 0,
                'position' => $i,
            ]);
        }
    }

    private function guardRespondable(Proposal $proposal): void
    {
        if ($proposal->isExpired()) {
            throw new DomainException('Esta proposta expirou.');
        }

        if (! in_array($proposal->status, ['sent', 'viewed'], true)) {
            throw new DomainException('Esta proposta já foi respondida.');
        }
    }

    private function notifyConsultant(Proposal $proposal, string $action, ?string $reason = null): void
    {
        try {
            $proposal->consultant?->notify(new ProposalRespondedNotification($proposal, $action, $reason));
        } catch (\Throwable $e) {
            Log::warning('Failed to notify consultant about proposal response', [
                'proposal_uuid' => $proposal->uuid,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
