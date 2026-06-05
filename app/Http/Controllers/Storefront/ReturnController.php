<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Orders\Models\Order;
use App\Domains\Orders\Models\ReturnRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

final class ReturnController extends Controller
{
    public function index(): Response
    {
        $returns = ReturnRequest::where('user_id', Auth::id())
            ->with('order:id,uuid,placed_at')
            ->latest()
            ->paginate(10);

        return Inertia::render('Storefront/Account/Returns', [
            'returns' => $returns->through(fn (ReturnRequest $r) => [
                'uuid'         => $r->uuid,
                'order_uuid'   => $r->order?->uuid,
                'reason'       => $r->reason,
                'status'       => $r->status,
                'status_label' => $r->statusLabel(),
                'status_color' => $r->statusColor(),
                'created_at'   => $r->created_at->format('d/m/Y'),
            ]),
        ]);
    }

    public function create(): Response
    {
        /** @var \App\Models\User $user */
        $user   = Auth::user();
        $orders = $user->orders()
            ->whereIn('status', ['delivered', 'paid', 'processing', 'shipped'])
            ->with('items:id,order_id,name,quantity,unit_price_cents')
            ->latest('placed_at')
            ->limit(10)
            ->get()
            ->map(fn (Order $o) => [
                'id'    => $o->id,
                'uuid'  => $o->uuid,
                'label' => '#' . strtoupper(substr($o->uuid, 0, 8)) . ' — ' . $o->placed_at?->format('d/m/Y'),
                'items' => $o->items->map(fn ($i) => [
                    'id'       => $i->id,
                    'name'     => $i->name,
                    'quantity' => $i->quantity,
                ])->values(),
            ]);

        return Inertia::render('Storefront/Account/ReturnCreate', [
            'orders' => $orders,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'order_id'              => ['required', 'integer', 'exists:orders,id'],
            'reason'                => ['required', 'in:defect,wrong_product,changed_mind,damaged,other'],
            'description'           => ['required', 'string', 'min:20', 'max:1000'],
            'items'                 => ['required', 'array', 'min:1'],
            'items.*.order_item_id' => ['required', 'integer'],
            'items.*.qty'           => ['required', 'integer', 'min:1'],
            'images'                => ['nullable', 'array', 'max:4'],
            'images.*'              => ['image', 'max:5120'],
        ]);

        // Verificar que o pedido pertence ao usuário
        Order::where('id', $validated['order_id'])
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $img) {
                $path         = $img->store('returns', 'public');
                $imagePaths[] = Storage::disk('public')->url($path);
            }
        }

        ReturnRequest::create([
            'order_id'    => $validated['order_id'],
            'user_id'     => Auth::id(),
            'reason'      => $validated['reason'],
            'description' => $validated['description'],
            'items'       => $validated['items'],
            'images'      => $imagePaths,
            'status'      => 'requested',
        ]);

        return to_route('account.returns.index')
            ->with('success', 'Solicitação enviada! Nossa equipe analisará em até 2 dias úteis.');
    }
}
