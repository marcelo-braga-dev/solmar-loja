<?php

declare(strict_types=1);

namespace App\Domains\Orders\Models;

use App\Domains\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class OrderItem extends Model
{
    protected $fillable = ['order_id', 'product_id', 'variant_id', 'name', 'sku', 'unit_price_cents', 'quantity', 'total_cents'];

    protected $casts = ['unit_price_cents' => 'integer', 'quantity' => 'integer', 'total_cents' => 'integer'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
