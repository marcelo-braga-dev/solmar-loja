<?php

declare(strict_types=1);

namespace App\Domains\Orders\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

final class ReturnRequest extends Model
{
    protected $table = 'returns';

    protected $fillable = [
        'uuid', 'order_id', 'user_id', 'reason', 'description',
        'items', 'images', 'status', 'refund_amount_cents',
        'refund_method', 'admin_notes', 'approved_at', 'received_at', 'refunded_at',
    ];

    protected $casts = [
        'items'        => 'array',
        'images'       => 'array',
        'approved_at'  => 'datetime',
        'received_at'  => 'datetime',
        'refunded_at'  => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(fn (self $r) => $r->uuid ??= Str::uuid()->toString());
    }

    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function user(): BelongsTo  { return $this->belongsTo(User::class); }

    public function statusLabel(): string
    {
        return match ($this->status) {
            'requested' => 'Solicitado',  'approved' => 'Aprovado',
            'rejected'  => 'Rejeitado',   'received' => 'Recebido',
            'refunded'  => 'Reembolsado', default    => $this->status,
        };
    }

    public function statusColor(): string
    {
        return match ($this->status) {
            'requested' => 'warning', 'approved' => 'info',
            'rejected'  => 'error',   'received' => 'primary',
            'refunded'  => 'success', default    => 'default',
        };
    }
}
