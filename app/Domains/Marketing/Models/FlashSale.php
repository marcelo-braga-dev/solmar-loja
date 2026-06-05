<?php

declare(strict_types=1);

namespace App\Domains\Marketing\Models;

use App\Domains\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class FlashSale extends Model
{
    protected $fillable = [
        'title', 'product_id', 'discount_percent',
        'max_quantity', 'sold_count', 'starts_at', 'ends_at', 'is_active',
    ];

    protected $casts = [
        'starts_at'        => 'datetime',
        'ends_at'          => 'datetime',
        'is_active'        => 'boolean',
        'discount_percent' => 'integer',
        'max_quantity'     => 'integer',
        'sold_count'       => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /** @param Builder<FlashSale> $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true)
              ->where('starts_at', '<=', now())
              ->where('ends_at', '>=', now());
    }

    public function isRunning(): bool
    {
        return $this->is_active
            && $this->starts_at <= now()
            && $this->ends_at   >= now();
    }

    public function hasStock(): bool
    {
        return $this->max_quantity === null
            || $this->sold_count < $this->max_quantity;
    }

    public function remainingSeconds(): int
    {
        return max(0, now()->diffInSeconds($this->ends_at, false));
    }

    public function progressPercent(): int
    {
        if ($this->max_quantity === null) {
            return 0;
        }

        return (int) round($this->sold_count / $this->max_quantity * 100);
    }
}
