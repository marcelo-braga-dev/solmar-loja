<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class PriceList extends Model
{
    protected $fillable = [
        'name', 'code', 'description', 'type',
        'discount_percent', 'is_default', 'is_active', 'is_public',
        'valid_from', 'valid_until',
    ];

    protected $casts = [
        'is_default'       => 'boolean',
        'is_active'        => 'boolean',
        'is_public'        => 'boolean',
        'discount_percent' => 'integer',
        'valid_from'       => 'date',
        'valid_until'      => 'date',
    ];

    /** @return HasMany<ProductPrice, $this> */
    public function productPrices(): HasMany
    {
        return $this->hasMany(ProductPrice::class);
    }

    /** @param Builder<PriceList> $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true)
              ->where(fn ($q) =>
                  $q->whereNull('valid_from')->orWhere('valid_from', '<=', now())
              )
              ->where(fn ($q) =>
                  $q->whereNull('valid_until')->orWhere('valid_until', '>=', now())
              );
    }

    /** Calcula preço com desconto da tabela aplicado */
    public function applyTo(int $priceCents): int
    {
        if ($this->discount_percent <= 0) {
            return $priceCents;
        }

        return (int) round($priceCents * (1 - $this->discount_percent / 100));
    }

    public function typeLabel(): string
    {
        return match ($this->type) {
            'retail'     => 'Preço Público',
            'consultant' => 'Consultor',
            'wholesale'  => 'Atacado',
            'special'    => 'Especial',
            default      => $this->type,
        };
    }
}
