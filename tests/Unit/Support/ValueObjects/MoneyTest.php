<?php

declare(strict_types=1);

use App\Support\ValueObjects\Money;

it('creates money from cents', function (): void {
    $money = Money::fromCents(10000);
    expect($money->cents())->toBe(10000);
    expect($money->currency())->toBe('BRL');
});

it('creates money from float', function (): void {
    $money = Money::fromFloat(100.50);
    expect($money->cents())->toBe(10050);
});

it('adds two money objects', function (): void {
    $a = Money::fromCents(5000);
    $b = Money::fromCents(3000);
    expect($a->add($b)->cents())->toBe(8000);
});

it('subtracts money', function (): void {
    $a = Money::fromCents(10000);
    $b = Money::fromCents(3000);
    expect($a->subtract($b)->cents())->toBe(7000);
});

it('subtraction never goes negative', function (): void {
    $a = Money::fromCents(1000);
    $b = Money::fromCents(5000);
    expect($a->subtract($b)->cents())->toBe(0);
});

it('multiplies by factor', function (): void {
    $money = Money::fromCents(10000);
    expect($money->multiply(0.5)->cents())->toBe(5000);
});

it('calculates percentage', function (): void {
    $money = Money::fromCents(10000);
    expect($money->percentage(20)->cents())->toBe(2000);
});

it('formats correctly in pt-BR', function (): void {
    $money = Money::fromCents(12350);
    expect($money->format())->toBe('123,50');
});

it('formats with BRL prefix', function (): void {
    $money = Money::fromCents(5000);
    expect($money->formatted())->toBe('R$ 50,00');
});

it('throws for negative amounts', function (): void {
    expect(fn () => Money::fromCents(-1))->toThrow(InvalidArgumentException::class);
});

it('compares two equal money objects', function (): void {
    expect(Money::fromCents(500)->equals(Money::fromCents(500)))->toBeTrue();
    expect(Money::fromCents(500)->equals(Money::fromCents(501)))->toBeFalse();
});

it('throws when adding different currencies', function (): void {
    $brl = Money::fromCents(100, 'BRL');
    $usd = Money::fromCents(100, 'USD');
    expect(fn () => $brl->add($usd))->toThrow(InvalidArgumentException::class);
});
