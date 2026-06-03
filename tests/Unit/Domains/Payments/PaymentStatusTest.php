<?php

declare(strict_types=1);

use App\Domains\Payments\Enums\PaymentMethod;
use App\Domains\Payments\Enums\PaymentStatus;

it('payment method has discount for pix only', function (): void {
    expect(PaymentMethod::Pix->discountPercent())->toBe(5);
    expect(PaymentMethod::Boleto->discountPercent())->toBe(0);
    expect(PaymentMethod::CreditCard->discountPercent())->toBe(0);
});

it('terminal statuses are correct', function (): void {
    expect(PaymentStatus::Approved->isTerminal())->toBeTrue();
    expect(PaymentStatus::Failed->isTerminal())->toBeTrue();
    expect(PaymentStatus::Refunded->isTerminal())->toBeTrue();
    expect(PaymentStatus::Expired->isTerminal())->toBeTrue();
    expect(PaymentStatus::Pending->isTerminal())->toBeFalse();
    expect(PaymentStatus::Processing->isTerminal())->toBeFalse();
});

it('payment method labels are in pt-BR', function (): void {
    expect(PaymentMethod::Pix->label())->toBe('Pix');
    expect(PaymentMethod::Boleto->label())->toBe('Boleto Bancário');
    expect(PaymentMethod::CreditCard->label())->toBe('Cartão de Crédito');
});

it('payment status has correct colors', function (): void {
    expect(PaymentStatus::Approved->color())->toBe('success');
    expect(PaymentStatus::Failed->color())->toBe('error');
    expect(PaymentStatus::Pending->color())->toBe('warning');
});
