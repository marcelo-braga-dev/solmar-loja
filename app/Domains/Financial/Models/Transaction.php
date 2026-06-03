<?php

declare(strict_types=1);

namespace App\Domains\Financial\Models;

use App\Domains\Orders\Models\Order;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Transaction extends Model
{
    protected $fillable = ['type', 'category', 'amount_cents', 'order_id', 'description', 'date', 'status', 'reference'];

    protected $casts = [
        'amount_cents' => 'integer',
        'date'         => 'date',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function isRevenue(): bool
    {
        return $this->type === 'revenue';
    }

    public function isExpense(): bool
    {
        return $this->type === 'expense';
    }
}
