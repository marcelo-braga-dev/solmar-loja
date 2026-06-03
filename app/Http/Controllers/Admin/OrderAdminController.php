<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Orders\Enums\OrderStatus;
use App\Domains\Orders\Models\Order;
use App\Domains\Orders\Models\OrderItem;
use App\Domains\Orders\Models\Shipment;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;
use Inertia\Inertia;
use Inertia\Response;

final class OrderAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = Order::query()
            ->with(['user', 'latestPayment'])
            ->when($request->string('status')->value(), fn ($q, $s) => $q->where('status', $s))
            ->when($request->string('q')->value(), fn ($q, $search) => $q->where(function ($q) use ($search): void {
                $q->where('uuid', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%"));
            }))
            ->latest('placed_at')
            ->paginate(20);

        return Inertia::render('Admin/Orders/Index', [
            'orders'  => $orders->through(fn (Order $o) => [
                'uuid'         => $o->uuid,
                'status'       => $o->status->value,
                'status_label' => $o->status->label(),
                'status_color' => $o->status->color(),
                'total_cents'  => $o->total_cents,
                'customer'     => $o->user?->name ?? 'Visitante',
                'email'        => $o->user?->email,
                'placed_at'    => $o->placed_at?->format('d/m/Y H:i'),
                'payment'      => $o->latestPayment?->method->label(),
            ]),
            'filters' => $request->only(['q', 'status']),
            'statuses' => collect(OrderStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load(['user', 'items.product', 'shipment', 'payments']);

        return Inertia::render('Admin/Orders/Show', [
            'order' => [
                'uuid'             => $order->uuid,
                'status'           => $order->status->value,
                'status_label'     => $order->status->label(),
                'status_color'     => $order->status->color(),
                'total_cents'      => $order->total_cents,
                'subtotal_cents'   => $order->subtotal_cents,
                'discount_cents'   => $order->discount_cents,
                'shipping_cents'   => $order->shipping_cents,
                'shipping_address' => $order->shipping_address,
                'shipping_method'  => $order->shipping_method,
                'notes'            => $order->notes,
                'placed_at'        => $order->placed_at?->format('d/m/Y H:i'),
                'customer' => $order->user ? [
                    'id'    => $order->user->id,
                    'name'  => $order->user->name,
                    'email' => $order->user->email,
                ] : null,
                'items' => $order->items->map(fn (OrderItem $i) => [
                    'name'             => $i->name,
                    'sku'              => $i->sku,
                    'quantity'         => $i->quantity,
                    'unit_price_cents' => $i->unit_price_cents,
                    'total_cents'      => $i->total_cents,
                    'cover_image'      => $i->product?->coverImage()?->url(),
                ]),
                'shipment' => $order->shipment ? [
                    'id'            => $order->shipment->id,
                    'carrier'       => $order->shipment->carrier,
                    'service'       => $order->shipment->service,
                    'tracking_code' => $order->shipment->tracking_code,
                    'status'        => $order->shipment->status,
                    'shipped_at'    => $order->shipment->shipped_at?->format('d/m/Y'),
                    'delivered_at'  => $order->shipment->delivered_at?->format('d/m/Y'),
                ] : null,
                'payments' => $order->payments->map(fn ($p) => [
                    'method'       => $p->method->label(),
                    'status'       => $p->status->label(),
                    'status_color' => $p->status->color(),
                    'amount_cents' => $p->amount_cents,
                    'paid_at'      => $p->paid_at?->format('d/m/Y H:i'),
                ]),
                'available_statuses' => collect(OrderStatus::cases())
                    ->filter(fn ($s) => $order->status->canTransitionTo($s))
                    ->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
            ],
        ]);
    }

    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', new Enum(OrderStatus::class)],
            'notes'  => ['nullable', 'string', 'max:1000'],
        ]);

        $newStatus = OrderStatus::from($validated['status']);

        if (! $order->status->canTransitionTo($newStatus)) {
            return back()->with('error', "Transição de {$order->status->label()} para {$newStatus->label()} não é permitida.");
        }

        $order->update([
            'status' => $newStatus,
            'notes'  => $validated['notes'] ?? $order->notes,
        ]);

        return back()->with('success', "Status atualizado para: {$newStatus->label()}.");
    }

    public function addShipment(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'carrier'       => ['required', 'string', 'max:100'],
            'service'       => ['nullable', 'string', 'max:100'],
            'tracking_code' => ['nullable', 'string', 'max:100'],
            'cost_cents'    => ['integer', 'min:0'],
        ]);

        Shipment::updateOrCreate(
            ['order_id' => $order->id],
            [
                ...$validated,
                'status'     => 'shipped',
                'shipped_at' => now(),
            ]
        );

        $order->update(['status' => OrderStatus::Shipped]);

        return back()->with('success', 'Expedição registrada com sucesso.');
    }
}
