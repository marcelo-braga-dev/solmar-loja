<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Models;

use App\Domains\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

final class StockAlert extends Model
{
    protected $fillable = ['product_id', 'email', 'name', 'token', 'notified_at'];

    protected $casts = ['notified_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(function (self $alert): void {
            $alert->token ??= Str::random(64);
        });
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function hasBeenNotified(): bool
    {
        return $this->notified_at !== null;
    }
}
