<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ProductVariant extends Model
{
    protected $fillable = [
        'product_id', 'sku', 'name', 'price_cents', 'weight_grams', 'attributes', 'is_active',
    ];

    protected $casts = [
        'price_cents'  => 'integer',
        'weight_grams' => 'integer',
        'attributes'   => 'array',
        'is_active'    => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function effectivePrice(): int
    {
        return $this->price_cents ?? $this->product->price_cents;
    }
}
