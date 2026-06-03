<?php

declare(strict_types=1);

namespace App\Domains\Support\Models;

use App\Domains\Catalog\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Review extends Model
{
    protected $fillable = [
        'product_id', 'user_id', 'order_item_id', 'rating', 'title',
        'comment', 'status', 'verified_purchase', 'reviewer_name',
    ];

    protected $casts = [
        'rating'            => 'integer',
        'verified_purchase' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @param Builder<Review> $query */
    public function scopeApproved(Builder $query): void
    {
        $query->where('status', 'approved');
    }

    public function authorName(): string
    {
        return $this->reviewer_name ?? $this->user?->name ?? 'Anônimo';
    }
}
