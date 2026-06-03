<?php

declare(strict_types=1);

namespace App\Domains\Payments\Models;

use App\Domains\Orders\Models\Order;
use App\Domains\Payments\Enums\PaymentMethod;
use App\Domains\Payments\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

final class Payment extends Model
{
    protected $fillable = [
        'uuid', 'order_id', 'method', 'gateway', 'gateway_transaction_id', 'status',
        'amount_cents', 'installments', 'pix_qr_code', 'pix_copy_paste',
        'boleto_url', 'boleto_barcode', 'card_last4', 'card_brand',
        'gateway_payload', 'paid_at', 'expires_at',
    ];

    protected $casts = [
        'method'          => PaymentMethod::class,
        'status'          => PaymentStatus::class,
        'gateway_payload' => 'array',
        'amount_cents'    => 'integer',
        'installments'    => 'integer',
        'paid_at'         => 'datetime',
        'expires_at'      => 'datetime',
    ];

    protected $hidden = ['gateway_payload'];

    protected static function booted(): void
    {
        static::creating(fn (self $p) => $p->uuid ??= Str::uuid()->toString());
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function isApproved(): bool
    {
        return $this->status === PaymentStatus::Approved;
    }

    public function isPending(): bool
    {
        return $this->status === PaymentStatus::Pending;
    }
}
