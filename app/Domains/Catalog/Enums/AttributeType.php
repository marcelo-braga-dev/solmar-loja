<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Enums;

enum AttributeType: string
{
    case Select  = 'select';
    case Range   = 'range';
    case Boolean = 'boolean';
    case Text    = 'text';

    public function label(): string
    {
        return match ($this) {
            self::Select  => 'Seleção',
            self::Range   => 'Intervalo',
            self::Boolean => 'Sim/Não',
            self::Text    => 'Texto',
        };
    }
}
