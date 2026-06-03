<?php

declare(strict_types=1);

namespace App\Domains\Payments\Enums;

enum PaymentMethod: string
{
    case Pix        = 'pix';
    case Boleto     = 'boleto';
    case CreditCard = 'credit_card';

    public function label(): string
    {
        return match ($this) {
            self::Pix        => 'Pix',
            self::Boleto     => 'Boleto Bancário',
            self::CreditCard => 'Cartão de Crédito',
        };
    }

    public function discountPercent(): int
    {
        return match ($this) {
            self::Pix    => 5,
            default      => 0,
        };
    }
}
