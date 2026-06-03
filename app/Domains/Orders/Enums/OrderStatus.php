<?php

declare(strict_types=1);

namespace App\Domains\Orders\Enums;

enum OrderStatus: string
{
    case Pending    = 'pending';
    case Paid       = 'paid';
    case Processing = 'processing';
    case Shipped    = 'shipped';
    case Delivered  = 'delivered';
    case Canceled   = 'canceled';
    case Refunded   = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::Pending    => 'Aguardando pagamento',
            self::Paid       => 'Pago',
            self::Processing => 'Em separação',
            self::Shipped    => 'Enviado',
            self::Delivered  => 'Entregue',
            self::Canceled   => 'Cancelado',
            self::Refunded   => 'Reembolsado',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending    => 'warning',
            self::Paid       => 'info',
            self::Processing => 'info',
            self::Shipped    => 'primary',
            self::Delivered  => 'success',
            self::Canceled   => 'error',
            self::Refunded   => 'default',
        };
    }

    /** Transições válidas de status */
    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Pending    => in_array($next, [self::Paid, self::Canceled]),
            self::Paid       => in_array($next, [self::Processing, self::Canceled, self::Refunded]),
            self::Processing => in_array($next, [self::Shipped, self::Canceled]),
            self::Shipped    => in_array($next, [self::Delivered]),
            self::Delivered  => in_array($next, [self::Refunded]),
            default          => false,
        };
    }
}
