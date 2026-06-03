<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Customers\Models\Address;
use App\Domains\Orders\Models\Order;
use App\Domains\Orders\Models\OrderItem;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

final class AccountController extends Controller
{
    public function dashboard(): Response
    {
        /** @var \App\Models\User $user */
        $user     = Auth::user();
        $customer = $user->customer()->with('addresses')->first();

        $ordersCount    = $user->orders()->count();
        $favoritesCount = $customer?->favoriteProducts()->count() ?? 0;
        $addressesCount = $customer?->addresses->count() ?? 0;

        return Inertia::render('Storefront/Account/Dashboard', [
            'user'     => $user->only('id', 'name', 'email', 'email_verified_at'),
            'customer' => $customer ? $customer->only('phone', 'cpf_cnpj', 'type') : null,
            'stats'    => [
                'orders'    => $ordersCount,
                'favorites' => $favoritesCount,
                'addresses' => $addressesCount,
            ],
        ]);
    }

    public function profileEdit(): Response
    {
        /** @var \App\Models\User $user */
        $user     = Auth::user();
        $customer = $user->customer()->first();

        return Inertia::render('Storefront/Account/Profile', [
            'user'     => $user->only('id', 'name', 'email'),
            'customer' => $customer ? $customer->only('phone', 'cpf_cnpj', 'type', 'birth_date') : null,
        ]);
    }

    public function profileUpdate(Request $request): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', "unique:users,email,{$user->id}"],
            'phone'     => ['nullable', 'string', 'max:20'],
            'cpf_cnpj'  => ['nullable', 'string', 'max:18'],
            'birth_date' => ['nullable', 'date'],
        ]);

        $user->update([
            'name'  => $validated['name'],
            'email' => $validated['email'],
        ]);

        $user->customer()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'phone'      => $validated['phone'] ?? null,
                'cpf_cnpj'   => $validated['cpf_cnpj'] ?? null,
                'birth_date' => $validated['birth_date'] ?? null,
            ]
        );

        return back()->with('success', 'Perfil atualizado com sucesso.');
    }

    public function security(): Response
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        return Inertia::render('Storefront/Account/Security', [
            'user' => $user->only('id', 'name', 'email', 'email_verified_at'),
            'is_admin' => $user->isAdmin(),
            'has_2fa' => $user->hasTwoFactorEnabled(),
        ]);
    }

    public function passwordUpdate(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password'         => ['required', 'min:8', 'confirmed'],
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();
        $user->update(['password' => Hash::make($request->password)]);

        return back()->with('success', 'Senha alterada com sucesso.');
    }

    public function addresses(): Response
    {
        /** @var \App\Models\User $user */
        $user     = Auth::user();
        $customer = $user->customer()->with('addresses')->first();

        return Inertia::render('Storefront/Account/Addresses', [
            'addresses' => $customer?->addresses->map(fn (Address $a) => [
                'id'                  => $a->id,
                'label'               => $a->label,
                'recipient'           => $a->recipient,
                'cep'                 => $a->cep,
                'street'              => $a->street,
                'number'              => $a->number,
                'complement'          => $a->complement,
                'district'            => $a->district,
                'city'                => $a->city,
                'state'               => $a->state,
                'is_default_shipping' => $a->is_default_shipping,
                'is_default_billing'  => $a->is_default_billing,
                'full_address'        => $a->fullAddress(),
            ]) ?? [],
        ]);
    }

    public function storeAddress(Request $request): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user     = Auth::user();
        $customer = $user->customer()->firstOrCreate(['user_id' => $user->id]);

        $validated = $request->validate([
            'label'       => ['nullable', 'string', 'max:50'],
            'recipient'   => ['required', 'string', 'max:255'],
            'cep'         => ['required', 'string', 'max:9'],
            'street'      => ['required', 'string', 'max:255'],
            'number'      => ['required', 'string', 'max:20'],
            'complement'  => ['nullable', 'string', 'max:100'],
            'district'    => ['required', 'string', 'max:100'],
            'city'        => ['required', 'string', 'max:100'],
            'state'       => ['required', 'string', 'size:2'],
            'is_default_shipping' => ['boolean'],
            'is_default_billing'  => ['boolean'],
        ]);

        if ($validated['is_default_shipping'] ?? false) {
            $customer->addresses()->update(['is_default_shipping' => false]);
        }
        if ($validated['is_default_billing'] ?? false) {
            $customer->addresses()->update(['is_default_billing' => false]);
        }

        $customer->addresses()->create($validated);

        return back()->with('success', 'Endereço adicionado.');
    }

    public function destroyAddress(Address $address): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        abort_if($address->customer->user_id !== $user->id, 403);

        $address->delete();

        return back()->with('success', 'Endereço removido.');
    }

    public function favorites(): Response
    {
        /** @var \App\Models\User $user */
        $user     = Auth::user();
        $customer = $user->customer()->first();

        $favorites = $customer
            ? $customer->favoriteProducts()->with(['brand', 'images'])->published()->get()->map(fn ($p) => [
                'id'          => $p->id,
                'name'        => $p->name,
                'slug'        => $p->slug,
                'price_cents' => $p->price_cents,
                'has_discount' => $p->hasDiscount(),
                'brand_name'  => $p->brand?->name,
                'cover_image' => $p->coverImage()?->url(),
            ])
            : collect();

        return Inertia::render('Storefront/Account/Favorites', [
            'favorites' => $favorites,
        ]);
    }

    public function toggleFavorite(Request $request): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user     = Auth::user();
        $customer = $user->customer()->firstOrCreate(['user_id' => $user->id]);

        $productId = $request->integer('product_id');
        $customer->favoriteProducts()->toggle($productId);

        return back();
    }

    public function orders(): Response
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $orders = Order::where('user_id', $user->id)
            ->with(['items', 'latestPayment'])
            ->latest('placed_at')
            ->paginate(10);

        return Inertia::render('Storefront/Account/Orders', [
            'orders' => $orders->through(fn (Order $o) => [
                'uuid'        => $o->uuid,
                'status'      => $o->status->value,
                'status_label' => $o->status->label(),
                'status_color' => $o->status->color(),
                'total_cents' => $o->total_cents,
                'items_count' => $o->items->count(),
                'placed_at'   => $o->placed_at?->format('d/m/Y H:i'),
                'payment_status' => $o->latestPayment?->status->label(),
            ]),
        ]);
    }

    public function orderShow(Order $order): Response
    {
        abort_if($order->user_id !== Auth::id(), 403);

        $order->load(['items.product.images', 'shipment', 'payments']);

        return Inertia::render('Storefront/Account/OrderDetail', [
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
                'placed_at'        => $order->placed_at?->format('d/m/Y H:i'),
                'items'            => $order->items->map(fn (OrderItem $i) => [
                    'name'             => $i->name,
                    'sku'              => $i->sku,
                    'quantity'         => $i->quantity,
                    'unit_price_cents' => $i->unit_price_cents,
                    'total_cents'      => $i->total_cents,
                    'cover_image'      => $i->product?->coverImage()?->url(),
                    'slug'             => $i->product?->slug,
                ]),
                'shipment' => $order->shipment ? [
                    'carrier'       => $order->shipment->carrier,
                    'tracking_code' => $order->shipment->tracking_code,
                    'status'        => $order->shipment->status,
                    'shipped_at'    => $order->shipment->shipped_at?->format('d/m/Y'),
                ] : null,
                'payments' => $order->payments->map(fn ($p) => [
                    'method'       => $p->method->label(),
                    'status'       => $p->status->label(),
                    'status_color' => $p->status->color(),
                    'amount_cents' => $p->amount_cents,
                    'paid_at'      => $p->paid_at?->format('d/m/Y H:i'),
                ]),
            ],
        ]);
    }
}
