<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ProductPrice extends Model
{
    protected $fillable = [
        'product_id', 'price_list_id', 'price_cents', 'compare_at_cents', 'effective_from',
    ];

    protected $casts = [
        'price_cents'      => 'integer',
        'compare_at_cents' => 'integer',
        'effective_from'   => 'datetime',
    ];

    public function product(): BelongsTo    { return $this->belongsTo(Product::class); }
    public function priceList(): BelongsTo  { return $this->belongsTo(PriceList::class); }
}
