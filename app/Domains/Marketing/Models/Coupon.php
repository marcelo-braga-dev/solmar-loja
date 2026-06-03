<?php

declare(strict_types=1);

namespace App\Domains\Marketing\Models;

use Illuminate\Database\Eloquent\Model;

final class Coupon extends Model
{
    protected $fillable = [
        'code', 'type', 'value', 'min_order_cents', 'max_uses',
        'used_count', 'starts_at', 'expires_at', 'is_active',
    ];

    protected $casts = [
        'value'           => 'integer',
        'min_order_cents' => 'integer',
        'max_uses'        => 'integer',
        'used_count'      => 'integer',
        'is_active'       => 'boolean',
        'starts_at'       => 'datetime',
        'expires_at'      => 'datetime',
    ];

    public function isValid(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->starts_at && $this->starts_at->isFuture()) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->max_uses !== null && $this->used_count >= $this->max_uses) {
            return false;
        }

        return true;
    }

    public function calculateDiscount(int $subtotalCents): int
    {
        return match ($this->type) {
            'percentage'   => (int) round($subtotalCents * $this->value / 100),
            'fixed'        => min($this->value, $subtotalCents),
            'free_shipping' => 0,
            default        => 0,
        };
    }

    public function incrementUsage(): void
    {
        $this->increment('used_count');
    }
}
