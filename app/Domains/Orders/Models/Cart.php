<?php

declare(strict_types=1);

namespace App\Domains\Orders\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

final class Cart extends Model
{
    protected $fillable = ['uuid', 'user_id', 'session_id', 'coupon_id'];

    protected static function booted(): void
    {
        static::creating(fn (self $cart) => $cart->uuid ??= Str::uuid()->toString());
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<CartItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function totalCents(): int
    {
        return $this->items->sum(fn (CartItem $item) => $item->unit_price_cents * $item->quantity);
    }

    public function itemCount(): int
    {
        return $this->items->sum('quantity');
    }

    public function isEmpty(): bool
    {
        return $this->items->isEmpty();
    }
}
