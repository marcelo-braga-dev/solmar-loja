<?php

declare(strict_types=1);

use App\Domains\Marketing\Models\Coupon;

function makeCoupon(array $attrs): Coupon
{
    $coupon = new Coupon();
    $coupon->setRawAttributes($attrs);
    return $coupon;
}

it('calculates percentage discount correctly', function (): void {
    $coupon = makeCoupon(['type' => 'percentage', 'value' => 20]);
    expect($coupon->calculateDiscount(10000))->toBe(2000);
});

it('calculates fixed discount correctly', function (): void {
    $coupon = makeCoupon(['type' => 'fixed', 'value' => 3000]);
    expect($coupon->calculateDiscount(10000))->toBe(3000);
});

it('fixed discount cannot exceed order total', function (): void {
    $coupon = makeCoupon(['type' => 'fixed', 'value' => 20000]);
    expect($coupon->calculateDiscount(10000))->toBe(10000);
});

it('free shipping gives zero discount on amount', function (): void {
    $coupon = makeCoupon(['type' => 'free_shipping', 'value' => 0]);
    expect($coupon->calculateDiscount(10000))->toBe(0);
});

it('inactive coupon is not valid', function (): void {
    $coupon = makeCoupon(['is_active' => false, 'used_count' => 0, 'max_uses' => null, 'starts_at' => null, 'expires_at' => null]);
    expect($coupon->isValid())->toBeFalse();
});

it('exceeded usage coupon is not valid', function (): void {
    $coupon = makeCoupon(['is_active' => true, 'used_count' => 10, 'max_uses' => 10, 'starts_at' => null, 'expires_at' => null]);
    expect($coupon->isValid())->toBeFalse();
});

it('active unlimited coupon is valid', function (): void {
    $coupon = makeCoupon(['is_active' => true, 'used_count' => 0, 'max_uses' => null, 'starts_at' => null, 'expires_at' => null]);
    expect($coupon->isValid())->toBeTrue();
});
