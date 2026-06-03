<?php

declare(strict_types=1);

namespace App\Domains\Orders\Models;

use App\Domains\Orders\Enums\OrderStatus;
use App\Domains\Payments\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

final class Order extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uuid', 'user_id', 'status', 'subtotal_cents', 'discount_cents',
        'shipping_cents', 'total_cents', 'coupon_id', 'shipping_address',
        'billing_address', 'shipping_method', 'notes', 'placed_at',
    ];

    protected $casts = [
        'status'           => OrderStatus::class,
        'shipping_address' => 'array',
        'billing_address'  => 'array',
        'subtotal_cents'   => 'integer',
        'discount_cents'   => 'integer',
        'shipping_cents'   => 'integer',
        'total_cents'      => 'integer',
        'placed_at'        => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(fn (self $order) => $order->uuid ??= Str::uuid()->toString());
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function shipment(): HasOne
    {
        return $this->hasOne(Shipment::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function latestPayment(): HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }
}
