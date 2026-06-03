<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Orders\Models\Order;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CustomerAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $customers = User::role('customer')
            ->with('customer')
            ->withCount('orders')
            ->when($request->string('q')->value(), fn ($q, $search) => $q->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate(20);

        return Inertia::render('Admin/Customers/Index', [
            'customers' => $customers->through(fn (User $u) => [
                'id'           => $u->id,
                'name'         => $u->name,
                'email'        => $u->email,
                'phone'        => $u->customer?->phone,
                'orders_count' => $u->orders_count,
                'verified'     => ! is_null($u->email_verified_at),
                'created_at'   => $u->created_at->format('d/m/Y'),
            ]),
            'filters' => $request->only(['q']),
        ]);
    }

    public function show(User $user): Response
    {
        $user->load(['customer.addresses']);

        $orders = Order::where('user_id', $user->id)
            ->with('latestPayment')
            ->latest('placed_at')
            ->limit(10)
            ->get();

        $totalSpent = Order::where('user_id', $user->id)
            ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
            ->sum('total_cents');

        return Inertia::render('Admin/Customers/Show', [
            'customer' => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'verified'    => ! is_null($user->email_verified_at),
                'created_at'  => $user->created_at->format('d/m/Y'),
                'phone'       => $user->customer?->phone,
                'cpf_cnpj'    => $user->customer?->cpf_cnpj,
                'type'        => $user->customer?->type,
                'addresses'   => $user->customer?->addresses?->map(fn ($a) => [
                    'id'          => $a->id,
                    'full'        => $a->fullAddress(),
                    'is_default'  => $a->is_default_shipping,
                ]) ?? [],
                'total_spent' => $totalSpent,
                'orders_count' => $orders->count(),
                'orders' => $orders->map(fn (Order $o) => [
                    'uuid'        => $o->uuid,
                    'status'      => $o->status->label(),
                    'status_color' => $o->status->color(),
                    'total_cents' => $o->total_cents,
                    'placed_at'   => $o->placed_at?->format('d/m/Y'),
                ]),
            ],
        ]);
    }
}
