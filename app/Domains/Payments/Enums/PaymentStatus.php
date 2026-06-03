<?php

declare(strict_types=1);

namespace App\Domains\Payments\Enums;

enum PaymentStatus: string
{
    case Pending    = 'pending';
    case Processing = 'processing';
    case Approved   = 'approved';
    case Failed     = 'failed';
    case Refunded   = 'refunded';
    case Expired    = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::Pending    => 'Aguardando pagamento',
            self::Processing => 'Processando',
            self::Approved   => 'Aprovado',
            self::Failed     => 'Falhou',
            self::Refunded   => 'Reembolsado',
            self::Expired    => 'Expirado',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending    => 'warning',
            self::Processing => 'info',
            self::Approved   => 'success',
            self::Failed     => 'error',
            self::Refunded   => 'default',
            self::Expired    => 'error',
        };
    }

    public function isTerminal(): bool
    {
        return in_array($this, [self::Approved, self::Failed, self::Refunded, self::Expired]);
    }
}
