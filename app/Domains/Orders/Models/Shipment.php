<?php

declare(strict_types=1);

namespace App\Domains\Orders\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Shipment extends Model
{
    protected $fillable = ['order_id', 'carrier', 'service', 'tracking_code', 'label_url', 'status', 'cost_cents', 'shipped_at', 'delivered_at'];

    protected $casts = ['cost_cents' => 'integer', 'shipped_at' => 'datetime', 'delivered_at' => 'datetime'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
