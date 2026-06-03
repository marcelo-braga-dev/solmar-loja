<?php

declare(strict_types=1);

use App\Domains\Orders\Enums\OrderStatus;

it('has correct labels', function (): void {
    expect(OrderStatus::Pending->label())->toBe('Aguardando pagamento');
    expect(OrderStatus::Paid->label())->toBe('Pago');
    expect(OrderStatus::Shipped->label())->toBe('Enviado');
    expect(OrderStatus::Delivered->label())->toBe('Entregue');
    expect(OrderStatus::Canceled->label())->toBe('Cancelado');
});

it('allows valid status transitions', function (): void {
    expect(OrderStatus::Pending->canTransitionTo(OrderStatus::Paid))->toBeTrue();
    expect(OrderStatus::Pending->canTransitionTo(OrderStatus::Canceled))->toBeTrue();
    expect(OrderStatus::Paid->canTransitionTo(OrderStatus::Processing))->toBeTrue();
    expect(OrderStatus::Processing->canTransitionTo(OrderStatus::Shipped))->toBeTrue();
    expect(OrderStatus::Shipped->canTransitionTo(OrderStatus::Delivered))->toBeTrue();
    expect(OrderStatus::Delivered->canTransitionTo(OrderStatus::Refunded))->toBeTrue();
});

it('blocks invalid status transitions', function (): void {
    expect(OrderStatus::Pending->canTransitionTo(OrderStatus::Delivered))->toBeFalse();
    expect(OrderStatus::Shipped->canTransitionTo(OrderStatus::Pending))->toBeFalse();
    expect(OrderStatus::Delivered->canTransitionTo(OrderStatus::Pending))->toBeFalse();
    expect(OrderStatus::Canceled->canTransitionTo(OrderStatus::Paid))->toBeFalse();
});

it('has correct colors', function (): void {
    expect(OrderStatus::Paid->color())->toBe('info');
    expect(OrderStatus::Delivered->color())->toBe('success');
    expect(OrderStatus::Canceled->color())->toBe('error');
    expect(OrderStatus::Pending->color())->toBe('warning');
});
