<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Domains\Orders\Models\Proposal;
use App\Domains\Orders\Models\ProposalItem;
use App\Domains\Orders\Services\ProposalService;
use App\Http\Controllers\Controller;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ProposalPublicController extends Controller
{
    public function __construct(private readonly ProposalService $proposals) {}

    public function show(string $uuid): Response
    {
        $proposal = Proposal::where('uuid', $uuid)
            ->with('items.product')
            ->firstOrFail();

        $this->proposals->markViewed($proposal);
        $proposal->refresh();

        return Inertia::render('Public/ProposalView', [
            'proposal' => [
                'uuid'           => $proposal->uuid,
                'reference'      => $proposal->reference,
                'title'          => $proposal->title,
                'customer_name'  => $proposal->customer_name,
                'status'         => $proposal->status,
                'status_label'   => $proposal->statusLabel(),
                'status_color'   => $proposal->statusColor(),
                'notes'          => $proposal->notes,
                'valid_until'    => $proposal->valid_until?->format('d/m/Y'),
                'is_expired'     => $proposal->isExpired(),
                'is_respondable' => in_array($proposal->status, ['sent', 'viewed'], true) && ! $proposal->isExpired(),
                'subtotal_cents' => $proposal->subtotal_cents,
                'discount_cents' => $proposal->discount_cents,
                'tax_cents'      => $proposal->tax_cents,
                'total_cents'    => $proposal->total_cents,
                'sent_at'        => $proposal->sent_at?->format('d/m/Y H:i'),
                'accepted_at'    => $proposal->accepted_at?->format('d/m/Y H:i'),
                'rejected_at'    => $proposal->rejected_at?->format('d/m/Y H:i'),
                'items'          => $proposal->items->map(fn (ProposalItem $item) => [
                    'id'               => $item->id,
                    'description'      => $item->description,
                    'unit'             => $item->unit,
                    'quantity'         => $item->quantity,
                    'unit_price_cents' => $item->unit_price_cents,
                    'discount_percent' => $item->discount_percent,
                    'total_cents'      => $item->total_cents,
                    'product_name'     => $item->product?->name,
                ])->values(),
            ],
        ]);
    }

    public function accept(string $uuid): RedirectResponse
    {
        $proposal = Proposal::where('uuid', $uuid)->firstOrFail();

        try {
            $this->proposals->accept($proposal);
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Proposta aceita com sucesso! Em breve nossa equipe entrará em contato.');
    }

    public function reject(string $uuid, Request $request): RedirectResponse
    {
        $proposal = Proposal::where('uuid', $uuid)->firstOrFail();

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $this->proposals->reject($proposal, $validated['reason'] ?? null);
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Recebemos sua resposta. Obrigado pelo retorno!');
    }
}
