<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Enums;

enum ProductStatus: string
{
    case Draft     = 'draft';
    case Published = 'published';
    case Archived  = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Draft     => 'Rascunho',
            self::Published => 'Publicado',
            self::Archived  => 'Arquivado',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft     => 'default',
            self::Published => 'success',
            self::Archived  => 'error',
        };
    }

    public function isVisible(): bool
    {
        return $this === self::Published;
    }
}
