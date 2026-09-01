<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Faixa de margem de venda por potência do kit (kWp). O preço de venda de um kit
 * é sempre `cost_cents * (1 + margin_percent / 100)` usando a faixa cuja
 * [min_kwp, max_kwp] contém a potência do kit — ver MarginPricingService.
 */
final class MarginTier extends Model
{
    protected $fillable = [
        'min_kwp',
        'max_kwp',
        'margin_percent',
        'is_active',
    ];

    protected $casts = [
        'min_kwp' => 'float',
        'max_kwp' => 'float',
        'margin_percent' => 'float',
        'is_active' => 'boolean',
    ];
}
