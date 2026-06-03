<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Marketing\Services\CouponService;
use App\Domains\Orders\Models\CartItem;
use App\Domains\Orders\Services\CartService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CartController extends Controller
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly CouponService $couponService,
    ) {}

    public function show(Request $request): Response
    {
        $cart = $this->cartService->getOrCreate($request);

        return Inertia::render('Storefront/Cart', [
            'cart' => $this->cartService->toArray($cart),
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity'   => ['integer', 'min:1'],
            'variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
        ]);

        $cart = $this->cartService->getOrCreate($request);

        $this->cartService->addItem(
            cart: $cart,
            productId: $request->integer('product_id'),
            quantity: $request->integer('quantity', 1),
            variantId: $request->integer('variant_id') ?: null,
        );

        // Requisições Inertia (do browser) → redireciona de volta com flash
        // Requisições JSON puras (API) → retorna JSON
        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Produto adicionado ao carrinho!');
        }

        $cart->load('items');

        return response()->json([
            'message'    => 'Produto adicionado ao carrinho.',
            'item_count' => $cart->itemCount(),
        ]);
    }

    public function update(Request $request, CartItem $item): RedirectResponse|JsonResponse
    {
        $request->validate(['quantity' => ['required', 'integer', 'min:0']]);

        $this->authorizeCartItem($request, $item);

        $this->cartService->updateItem($item, $request->integer('quantity'));

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response()->json(['message' => 'Carrinho atualizado.']);
    }

    public function destroy(Request $request, CartItem $item): RedirectResponse|JsonResponse
    {
        $this->authorizeCartItem($request, $item);

        $this->cartService->removeItem($item);

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Item removido do carrinho.');
        }

        return response()->json(['message' => 'Item removido.']);
    }

    public function count(Request $request): JsonResponse
    {
        $cart = $this->cartService->getOrCreate($request);

        return response()->json(['count' => $cart->itemCount()]);
    }

    public function applyCoupon(Request $request): RedirectResponse
    {
        $request->validate(['coupon_code' => ['required', 'string']]);

        $cart   = $this->cartService->getOrCreate($request);
        $coupon = $this->couponService->applyCoupon($cart, $request->string('coupon_code')->value());

        return back()->with('success', "Cupom \"{$coupon->code}\" aplicado com sucesso!");
    }

    public function removeCoupon(Request $request): RedirectResponse
    {
        $cart = $this->cartService->getOrCreate($request);
        $this->couponService->removeCoupon($cart);

        return back()->with('success', 'Cupom removido.');
    }

    private function authorizeCartItem(Request $request, CartItem $item): void
    {
        $cart = $item->cart;
        $user = $request->user();

        $belongsToUser    = $user && $cart->user_id === $user->id;
        $belongsToSession = ! $user && $cart->session_id === $request->session()->getId();

        abort_if(! $belongsToUser && ! $belongsToSession, 403);
    }
}
