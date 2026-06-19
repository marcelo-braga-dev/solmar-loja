<?php

declare(strict_types=1);

namespace App\Domains\Orders\Models;

use App\Domains\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ProposalItem extends Model
{
    protected $fillable = [
        'proposal_id', 'item_type', 'product_id', 'service_id',
        'description', 'unit', 'quantity',
        'unit_price_cents', 'discount_percent', 'total_cents',
        'notes', 'position',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price_cents' => 'integer',
        'discount_percent' => 'integer',
        'total_cents' => 'integer',
        'position' => 'integer',
    ];

    protected static function booted(): void
    {
        self::saving(function (self $item): void {
            $discount = $item->unit_price_cents * ($item->discount_percent / 100);
            $unitFinal = (int) round($item->unit_price_cents - $discount);
            $item->total_cents = $unitFinal * $item->quantity;
        });
    }

    /** @return BelongsTo<Proposal, $this> */
    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class);
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unitPriceAfterDiscount(): int
    {
        return (int) round($this->unit_price_cents * (1 - $this->discount_percent / 100));
    }
}
