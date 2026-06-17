<?php

declare(strict_types=1);

namespace App\Http\Controllers\Consultant;

use App\Domains\Orders\Models\Proposal;
use App\Domains\Orders\Models\ProposalItem;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class ProposalController extends Controller
{
    public function index(): Response
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $proposals = Proposal::where('user_id', $user->id)
            ->latest()
            ->paginate(15)
            ->through(fn (Proposal $p) => [
                'uuid'          => $p->uuid,
                'reference'     => $p->reference,
                'title'         => $p->title,
                'customer_name' => $p->customer_name,
                'customer_city' => $p->customer_city,
                'customer_state'=> $p->customer_state,
                'status'        => $p->status,
                'status_label'  => $p->statusLabel(),
                'status_color'  => $p->statusColor(),
                'total_cents'   => $p->total_cents,
                'valid_until'   => $p->valid_until?->format('d/m/Y'),
                'created_at'    => $p->created_at->format('d/m/Y'),
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
        $validated = $request->validate([
            'title'             => ['required', 'string', 'max:255'],
            'customer_name'     => ['required', 'string', 'max:255'],
            'customer_email'    => ['nullable', 'email', 'max:255'],
            'customer_phone'    => ['nullable', 'string', 'max:20'],
            'customer_city'     => ['nullable', 'string', 'max:100'],
            'customer_state'    => ['nullable', 'string', 'max:2'],
            'notes'             => ['nullable', 'string'],
            'valid_until'       => ['nullable', 'date', 'after:today'],
            'items'             => ['required', 'array', 'min:1'],
            'items.*.item_type'       => ['required', 'in:product,service,custom'],
            'items.*.product_id'      => ['nullable', 'integer', 'exists:products,id'],
            'items.*.description'     => ['required', 'string', 'max:255'],
            'items.*.unit'            => ['nullable', 'string', 'max:20'],
            'items.*.quantity'        => ['required', 'integer', 'min:1'],
            'items.*.unit_price_cents'=> ['required', 'integer', 'min:0'],
            'items.*.discount_percent'=> ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $proposal = DB::transaction(function () use ($validated, $user): Proposal {
            $proposal = Proposal::create([
                'user_id'        => $user->id,
                'title'          => $validated['title'],
                'customer_name'  => $validated['customer_name'],
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'customer_city'  => $validated['customer_city'] ?? null,
                'customer_state' => $validated['customer_state'] ?? null,
                'notes'          => $validated['notes'] ?? null,
                'valid_until'    => $validated['valid_until'] ?? null,
                'status'         => 'draft',
            ]);

            foreach ($validated['items'] as $i => $itemData) {
                ProposalItem::create([
                    'proposal_id'       => $proposal->id,
                    'item_type'         => $itemData['item_type'],
                    'product_id'        => $itemData['product_id'] ?? null,
                    'description'       => $itemData['description'],
                    'unit'              => $itemData['unit'] ?? 'un',
                    'quantity'          => $itemData['quantity'],
                    'unit_price_cents'  => $itemData['unit_price_cents'],
                    'discount_percent'  => $itemData['discount_percent'] ?? 0,
                    'position'          => $i,
                ]);
            }

            $proposal->recalculate();

            return $proposal;
        });

        return to_route('consultor.proposals.show', $proposal->uuid)
            ->with('success', "Proposta {$proposal->reference} criada com sucesso.");
    }

    public function show(string $uuid): Response
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $proposal = Proposal::where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->with('items.product')
            ->firstOrFail();

        return Inertia::render('Consultant/ShowProposal', [
            'proposal' => [
                'uuid'           => $proposal->uuid,
                'reference'      => $proposal->reference,
                'title'          => $proposal->title,
                'customer_name'  => $proposal->customer_name,
                'customer_email' => $proposal->customer_email,
                'customer_phone' => $proposal->customer_phone,
                'customer_city'  => $proposal->customer_city,
                'customer_state' => $proposal->customer_state,
                'status'         => $proposal->status,
                'status_label'   => $proposal->statusLabel(),
                'status_color'   => $proposal->statusColor(),
                'notes'          => $proposal->notes,
                'valid_until'    => $proposal->valid_until?->format('d/m/Y'),
                'subtotal_cents' => $proposal->subtotal_cents,
                'discount_cents' => $proposal->discount_cents,
                'total_cents'    => $proposal->total_cents,
                'is_editable'    => $proposal->isEditable(),
                'created_at'     => $proposal->created_at->format('d/m/Y H:i'),
                'items'          => $proposal->items->map(fn (ProposalItem $item) => [
                    'id'                 => $item->id,
                    'item_type'          => $item->item_type,
                    'description'        => $item->description,
                    'unit'               => $item->unit,
                    'quantity'           => $item->quantity,
                    'unit_price_cents'   => $item->unit_price_cents,
                    'discount_percent'   => $item->discount_percent,
                    'total_cents'        => $item->total_cents,
                    'product_name'       => $item->product?->name,
                    'product_slug'       => $item->product?->slug,
                ])->values(),
            ],
        ]);
    }

    public function send(string $uuid): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $proposal = Proposal::where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($proposal->status !== 'draft') {
            return back()->with('error', 'Apenas propostas em rascunho podem ser enviadas.');
        }

        $proposal->update(['status' => 'sent', 'sent_at' => now()]);

        return back()->with('success', "Proposta {$proposal->reference} marcada como enviada.");
    }

    public function destroy(string $uuid): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $proposal = Proposal::where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if (! $proposal->isEditable()) {
            return back()->with('error', 'Apenas rascunhos podem ser excluídos.');
        }

        $proposal->delete();

        return to_route('consultor.proposals.index')
            ->with('success', 'Proposta excluída.');
    }
}
