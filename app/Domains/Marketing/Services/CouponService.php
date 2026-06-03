<?php

declare(strict_types=1);

namespace App\Domains\Marketing\Services;

use App\Domains\Marketing\Models\Coupon;
use App\Domains\Orders\Models\Cart;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

final class CouponService
{
    public function findByCode(string $code): ?Coupon
    {
        return Coupon::where('code', strtoupper(trim($code)))->first();
    }

    public function validateForCart(string $code, Cart $cart): Coupon
    {
        $coupon = $this->findByCode($code);

        if ($coupon === null || ! $coupon->isValid()) {
            throw ValidationException::withMessages([
                'coupon_code' => ['Cupom inválido ou expirado.'],
            ]);
        }

        if ($coupon->min_order_cents > 0 && $cart->totalCents() < $coupon->min_order_cents) {
            $min = number_format($coupon->min_order_cents / 100, 2, ',', '.');
            throw ValidationException::withMessages([
                'coupon_code' => ["O cupom requer pedido mínimo de R$ {$min}."],
            ]);
        }

        return $coupon;
    }

    public function applyCoupon(Cart $cart, string $code): Coupon
    {
        $coupon = $this->validateForCart($code, $cart);

        $cart->update(['coupon_id' => $coupon->id]);

        return $coupon;
    }

    public function removeCoupon(Cart $cart): void
    {
        $cart->update(['coupon_id' => null]);
    }

    public function calculateDiscount(Cart $cart): int
    {
        if (! $cart->coupon_id) {
            return 0;
        }

        $coupon = Coupon::find($cart->coupon_id);

        return $coupon ? $coupon->calculateDiscount($cart->totalCents()) : 0;
    }

    /** @return LengthAwarePaginator<Coupon> */
    public function paginate(int $perPage = 20): LengthAwarePaginator
    {
        return Coupon::latest()->paginate($perPage);
    }

    public function create(array $data): Coupon
    {
        $data['code'] = strtoupper(trim($data['code']));

        return Coupon::create($data);
    }

    public function toggle(Coupon $coupon): Coupon
    {
        $coupon->update(['is_active' => ! $coupon->is_active]);

        return $coupon->fresh() ?? $coupon;
    }

    public function delete(Coupon $coupon): void
    {
        $coupon->delete();
    }
}
