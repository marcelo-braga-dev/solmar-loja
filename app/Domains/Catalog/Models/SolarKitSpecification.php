<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Ficha técnica/comercial completa de um kit solar, espelhando 1:1 os dados
 * retornados pela API do distribuidor (AppSolar/Edeltec) para um Product.
 */
final class SolarKitSpecification extends Model
{
    protected $fillable = [
        'product_id',
        'supplier_sku',
        'supplier_name',
        'supplier_available',
        'supplier_cost_price_cents',
        'supplier_sale_price_cents',
        'kit_power_kwp',
        'voltage',
        'structure_type',
        'inverter_brand',
        'inverter_brand_logo_url',
        'inverter_image_url',
        'inverter_power_kw',
        'panel_brand',
        'panel_brand_logo_url',
        'panel_image_url',
        'panel_power_w',
        'components_html',
        'supplier_notes',
        'supplier_updated_at',
    ];

    protected $casts = [
        'supplier_available' => 'boolean',
        'supplier_cost_price_cents' => 'integer',
        'supplier_sale_price_cents' => 'integer',
        'kit_power_kwp' => 'float',
        'inverter_power_kw' => 'float',
        'panel_power_w' => 'integer',
        'supplier_updated_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
