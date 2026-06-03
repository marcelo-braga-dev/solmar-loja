<?php

declare(strict_types=1);

namespace App\Domains\Orders\Models;

use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Models\ProductVariant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CartItem extends Model
{
    protected $fillable = ['cart_id', 'product_id', 'variant_id', 'quantity', 'unit_price_cents'];

    protected $casts = [
        'quantity'         => 'integer',
        'unit_price_cents' => 'integer',
    ];

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function totalCents(): int
    {
        return $this->unit_price_cents * $this->quantity;
    }
}
