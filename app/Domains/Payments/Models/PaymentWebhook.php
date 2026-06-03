<?php

declare(strict_types=1);

namespace App\Domains\Payments\Models;

use Illuminate\Database\Eloquent\Model;

final class PaymentWebhook extends Model
{
    protected $fillable = [
        'gateway', 'event_type', 'gateway_event_id', 'payload', 'status', 'error', 'processed_at',
    ];

    protected $casts = [
        'payload'      => 'array',
        'processed_at' => 'datetime',
    ];
}
