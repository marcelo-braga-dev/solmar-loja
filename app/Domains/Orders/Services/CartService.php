<?php

declare(strict_types=1);

namespace App\Domains\Orders\Services;

use App\Domains\Catalog\Contracts\ProductRepositoryInterface;
use App\Domains\Orders\Models\Cart;
use App\Domains\Orders\Models\CartItem;
use App\Models\User;
use DomainException;
use Illuminate\Http\Request;

final class CartService
{
    public function __construct(
        private readonly ProductRepositoryInterface $products,
    ) {}

    public function getOrCreate(Request $request): Cart
    {
        $user = $request->user();

        if ($user) {
            return Cart::firstOrCreate(['user_id' => $user->id]);
        }

        $sessionId = $request->session()->getId();

        return Cart::firstOrCreate(['session_id' => $sessionId]);
    }

    public function addItem(Cart $cart, int $productId, int $quantity = 1, ?int $variantId = null): CartItem
    {
        $product = $this->products->findById($productId);

        if ($product === null) {
            throw new DomainException('Produto não encontrado.');
        }

        $price = $variantId
            ? ($product->variants->find($variantId)?->effectivePrice() ?? $product->price_cents)
            : $product->price_cents;

        $existingItem = $cart->items()
            ->where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->first();

        if ($existingItem) {
            $existingItem->increment('quantity', $quantity);

            return $existingItem->fresh() ?? $existingItem;
        }

        return $cart->items()->create([
            'product_id'       => $productId,
            'variant_id'       => $variantId,
            'quantity'         => $quantity,
            'unit_price_cents' => $price,
        ]);
    }

    public function updateItem(CartItem $item, int $quantity): CartItem
    {
        if ($quantity <= 0) {
            $item->delete();
            throw new DomainException('Item removido do carrinho.');
        }

        $item->update(['quantity' => $quantity]);

        return $item->fresh() ?? $item;
    }

    public function removeItem(CartItem $item): void
    {
        $item->delete();
    }

    public function clear(Cart $cart): void
    {
        $cart->items()->delete();
    }

    /** Mescla o carrinho de sessão no carrinho do usuário após login. */
    public function mergeSessionCart(User $user, string $sessionId): void
    {
        $sessionCart = Cart::where('session_id', $sessionId)->first();
        $userCart    = Cart::firstOrCreate(['user_id' => $user->id]);

        if ($sessionCart === null || $sessionCart->isEmpty()) {
            return;
        }

        foreach ($sessionCart->items as $item) {
            $this->addItem($userCart, $item->product_id, $item->quantity, $item->variant_id);
        }

        $sessionCart->delete();
    }

    /** @return array<string, mixed> */
    public function toArray(Cart $cart): array
    {
        $cart->load(['items.product.images', 'items.variant']);

        $items = $cart->items->map(fn (CartItem $item) => [
            'id'               => $item->id,
            'product_id'       => $item->product_id,
            'variant_id'       => $item->variant_id,
            'name'             => $item->product?->name ?? 'Produto removido',
            'sku'              => $item->variant?->sku ?? $item->product?->sku,
            'quantity'         => $item->quantity,
            'unit_price_cents' => $item->unit_price_cents,
            'total_cents'      => $item->totalCents(),
            'cover_image'      => $item->product?->coverImage()?->url(),
            'slug'             => $item->product?->slug,
        ]);

        return [
            'id'          => $cart->id,
            'uuid'        => $cart->uuid,
            'items'       => $items,
            'item_count'  => $cart->itemCount(),
            'total_cents' => $cart->totalCents(),
        ];
    }
}
