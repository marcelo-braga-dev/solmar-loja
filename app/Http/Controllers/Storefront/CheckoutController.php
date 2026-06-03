<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Orders\Events\OrderPlaced;
use App\Domains\Orders\Models\Order;
use App\Domains\Orders\Models\OrderItem;
use App\Domains\Orders\Services\CartService;
use App\Domains\Payments\Data\PaymentRequestData;
use App\Domains\Payments\Enums\PaymentMethod;
use App\Domains\Payments\Services\PaymentService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Enum;
use Inertia\Inertia;
use Inertia\Response;

final class CheckoutController extends Controller
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly PaymentService $paymentService,
    ) {}

    public function index(Request $request): Response|RedirectResponse
    {
        $cart = $this->cartService->getOrCreate($request);

        if ($cart->isEmpty()) {
            return to_route('home')->with('error', 'Seu carrinho está vazio.');
        }

        $cartData  = $this->cartService->toArray($cart);
        $user      = Auth::user();
        $addresses = $user?->customer?->addresses ?? collect();

        return Inertia::render('Storefront/Checkout', [
            'cart'      => $cartData,
            'addresses' => $addresses->map(fn ($a) => [
                'id'         => $a->id,
                'label'      => $a->label ?? 'Endereço',
                'full'       => $a->fullAddress(),
                'recipient'  => $a->recipient,
                'cep'        => $a->cep,
                'street'     => $a->street,
                'number'     => $a->number,
                'complement' => $a->complement,
                'district'   => $a->district,
                'city'       => $a->city,
                'state'      => $a->state,
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'recipient'      => ['required', 'string'],
            'cep'            => ['required', 'string'],
            'street'         => ['required', 'string'],
            'number'         => ['required', 'string'],
            'district'       => ['required', 'string'],
            'city'           => ['required', 'string'],
            'state'          => ['required', 'string', 'size:2'],
            'payment_method' => ['required', new Enum(PaymentMethod::class)],
            'installments'   => ['integer', 'min:1', 'max:12'],
        ]);

        $cart = $this->cartService->getOrCreate($request);

        if ($cart->isEmpty()) {
            return back()->with('error', 'Carrinho vazio.');
        }

        $order = DB::transaction(function () use ($cart, $request): Order {
            $shippingAddress = [
                'recipient'  => $request->string('recipient')->value(),
                'cep'        => $request->string('cep')->value(),
                'street'     => $request->string('street')->value(),
                'number'     => $request->string('number')->value(),
                'complement' => $request->string('complement')->value(),
                'district'   => $request->string('district')->value(),
                'city'       => $request->string('city')->value(),
                'state'      => $request->string('state')->value(),
            ];

            $cart->load('items.product');
            $subtotal = $cart->totalCents();

            $order = Order::create([
                'user_id'          => Auth::id(),
                'status'           => 'pending',
                'subtotal_cents'   => $subtotal,
                'discount_cents'   => 0,
                'shipping_cents'   => 0,
                'total_cents'      => $subtotal,
                'shipping_address' => $shippingAddress,
                'shipping_method'  => 'a_combinar',
                'placed_at'        => now(),
            ]);

            foreach ($cart->items as $item) {
                OrderItem::create([
                    'order_id'         => $order->id,
                    'product_id'       => $item->product_id,
                    'variant_id'       => $item->variant_id,
                    'name'             => $item->product?->name ?? 'Produto',
                    'sku'              => $item->product?->sku ?? '',
                    'unit_price_cents' => $item->unit_price_cents,
                    'quantity'         => $item->quantity,
                    'total_cents'      => $item->totalCents(),
                ]);
            }

            $this->cartService->clear($cart);

            return $order;
        });

        OrderPlaced::dispatch($order);

        // Inicia o pagamento automaticamente
        $paymentData = new PaymentRequestData(
            method: PaymentMethod::from($request->string('payment_method')->value()),
            installments: $request->integer('installments', 1),
        );

        $this->paymentService->initiate($order, $paymentData);

        return to_route('payment.show', $order->uuid)
            ->with('success', 'Pedido realizado! Finalize o pagamento abaixo.');
    }
}
