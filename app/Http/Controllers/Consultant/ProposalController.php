<?php

declare(strict_types=1);

namespace App\Http\Controllers\Consultant;

use App\Domains\Orders\Models\Proposal;
use App\Domains\Orders\Models\ProposalItem;
use App\Domains\Orders\Services\ProposalService;
use App\Http\Controllers\Controller;
use App\Models\User;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class ProposalController extends Controller
{
    public function __construct(private readonly ProposalService $proposals) {}

    public function index(): Response
    {
        /** @var User $user */
        $user = Auth::user();

        $proposals = Proposal::where('user_id', $user->id)
            ->latest()
            ->paginate(15)
            ->through(fn (Proposal $p) => [
                'uuid' => $p->uuid,
                'reference' => $p->reference,
                'title' => $p->title,
                'customer_name' => $p->customer_name,
                'customer_city' => $p->customer_city,
                'customer_state' => $p->customer_state,
                'status' => $p->status,
                'status_label' => $p->statusLabel(),
                'status_color' => $p->statusColor(),
                'total_cents' => $p->total_cents,
                'valid_until' => $p->valid_until?->format('d/m/Y'),
                'created_at' => $p->created_at->format('d/m/Y'),
            ]);

        return Inertia::render('Consultant/Proposals', [
            'proposals' => $proposals,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Consultant/CreateProposal');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateProposal($request);

        /** @var User $user */
        $user = Auth::user();

        $proposal = $this->proposals->create($user, $validated);

        return to_route('consultor.proposals.show', $proposal->uuid)
            ->with('success', "Proposta {$proposal->reference} criada com sucesso.");
    }

    public function show(string $uuid): Response
    {
        $proposal = $this->findOwnedProposal($uuid);

        return Inertia::render('Consultant/ShowProposal', [
            'proposal' => $this->proposalPayload($proposal),
        ]);
    }

    public function edit(string $uuid): Response
    {
        $proposal = $this->findOwnedProposal($uuid);

        if (! $proposal->isEditable()) {
            abort(403, 'Apenas propostas em rascunho podem ser editadas.');
        }

        return Inertia::render('Consultant/CreateProposal', [
            'proposal' => $this->proposalPayload($proposal),
        ]);
    }

    public function update(Request $request, string $uuid): RedirectResponse
    {
        $proposal = $this->findOwnedProposal($uuid);
        $validated = $this->validateProposal($request);

        try {
            $this->proposals->update($proposal, $validated);
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return to_route('consultor.proposals.show', $proposal->uuid)
            ->with('success', "Proposta {$proposal->reference} atualizada com sucesso.");
    }

    public function send(string $uuid): RedirectResponse
    {
        $proposal = $this->findOwnedProposal($uuid);

        try {
            $this->proposals->sendToCustomer($proposal);
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', "Proposta {$proposal->reference} enviada para {$proposal->customer_email}.");
    }

    public function destroy(string $uuid): RedirectResponse
    {
        $proposal = $this->findOwnedProposal($uuid);

        if (! $proposal->isEditable()) {
            return back()->with('error', 'Apenas rascunhos podem ser excluídos.');
        }

        $proposal->delete();

        return to_route('consultor.proposals.index')
            ->with('success', 'Proposta excluída.');
    }

    private function findOwnedProposal(string $uuid): Proposal
    {
        /** @var User $user */
        $user = Auth::user();

        return Proposal::where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->with('items.product')
            ->firstOrFail();
    }

    /** @return array<string, mixed> */
    private function validateProposal(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:20'],
            'customer_city' => ['nullable', 'string', 'max:100'],
            'customer_state' => ['nullable', 'string', 'max:2'],
            'notes' => ['nullable', 'string'],
            'valid_until' => ['nullable', 'date', 'after:today'],
            'discount_cents' => ['nullable', 'integer', 'min:0'],
            'tax_cents' => ['nullable', 'integer', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_type' => ['required', 'in:product,service,custom'],
            'items.*.product_id' => ['nullable', 'integer', 'exists:products,id'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.unit' => ['nullable', 'string', 'max:20'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price_cents' => ['required', 'integer', 'min:0'],
            'items.*.discount_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);
    }

    /** @return array<string, mixed> */
    private function proposalPayload(Proposal $proposal): array
    {
        return [
            'uuid' => $proposal->uuid,
            'reference' => $proposal->reference,
            'title' => $proposal->title,
            'customer_name' => $proposal->customer_name,
            'customer_email' => $proposal->customer_email,
            'customer_phone' => $proposal->customer_phone,
            'customer_city' => $proposal->customer_city,
            'customer_state' => $proposal->customer_state,
            'status' => $proposal->status,
            'status_label' => $proposal->statusLabel(),
            'status_color' => $proposal->statusColor(),
            'notes' => $proposal->notes,
            'valid_until' => $proposal->valid_until?->format('Y-m-d'),
            'subtotal_cents' => $proposal->subtotal_cents,
            'discount_cents' => $proposal->discount_cents,
            'tax_cents' => $proposal->tax_cents,
            'total_cents' => $proposal->total_cents,
            'is_editable' => $proposal->isEditable(),
            'is_expired' => $proposal->isExpired(),
            'public_url' => route('proposals.public.show', $proposal->uuid),
            'created_at' => $proposal->created_at->format('d/m/Y H:i'),
            'sent_at' => $proposal->sent_at?->format('d/m/Y H:i'),
            'viewed_at' => $proposal->viewed_at?->format('d/m/Y H:i'),
            'accepted_at' => $proposal->accepted_at?->format('d/m/Y H:i'),
            'rejected_at' => $proposal->rejected_at?->format('d/m/Y H:i'),
            'items' => $proposal->items->map(fn (ProposalItem $item) => [
                'id' => $item->id,
                'item_type' => $item->item_type,
                'product_id' => $item->product_id,
                'description' => $item->description,
                'unit' => $item->unit,
                'quantity' => $item->quantity,
                'unit_price_cents' => $item->unit_price_cents,
                'discount_percent' => $item->discount_percent,
                'total_cents' => $item->total_cents,
                'product_name' => $item->product?->name,
                'product_slug' => $item->product?->slug,
            ])->values(),
        ];
    }
}
