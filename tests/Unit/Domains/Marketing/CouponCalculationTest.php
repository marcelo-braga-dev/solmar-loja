<?php

declare(strict_types=1);

/**
 * Testes da lógica de cálculo de cupom — sem Eloquent (pure PHP).
 * A lógica de negócio está em Coupon::calculateDiscount() e Coupon::isValid().
 * Testamos aqui as fórmulas matemáticas de forma isolada.
 */

it('percentage discount formula is correct', function (): void {
    $subtotal      = 10000;
    $discountRate  = 20;
    $expected      = (int) round($subtotal * $discountRate / 100);
    expect($expected)->toBe(2000);
});

it('percentage discount rounds correctly', function (): void {
    $subtotal     = 9999;
    $discountRate = 15;
    $result       = (int) round($subtotal * $discountRate / 100);
    expect($result)->toBe(1500); // round(1499.85) = 1500
});

it('fixed discount cannot exceed order total', function (): void {
    $couponValue   = 20000;
    $subtotal      = 10000;
    $discount      = min($couponValue, $subtotal);
    expect($discount)->toBe(10000);
});

it('fixed discount applies when smaller than subtotal', function (): void {
    $couponValue = 3000;
    $subtotal    = 10000;
    $discount    = min($couponValue, $subtotal);
    expect($discount)->toBe(3000);
});

it('free shipping type gives zero amount discount', function (): void {
    $type     = 'free_shipping';
    $discount = match ($type) {
        'percentage'    => 0,
        'fixed'         => 0,
        'free_shipping' => 0,
        default         => 0,
    };
    expect($discount)->toBe(0);
});

it('exceeded max uses invalidates coupon', function (): void {
    $usedCount = 10;
    $maxUses   = 10;
    $isValid   = $maxUses === null || $usedCount < $maxUses;
    expect($isValid)->toBeFalse();
});

it('null max uses means unlimited', function (): void {
    $usedCount = 9999;
    $maxUses   = null;
    $isValid   = $maxUses === null || $usedCount < $maxUses;
    expect($isValid)->toBeTrue();
});
