<?php

declare(strict_types=1);

namespace App\Domains\Orders\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

final class Quote extends Model
{
    protected $fillable = [
        'uuid', 'user_id', 'name', 'email', 'phone', 'company', 'cnpj',
        'items', 'message', 'status', 'quoted_total_cents', 'discount_percent',
        'admin_notes', 'expires_at', 'responded_at',
    ];

    protected $casts = [
        'items'       => 'array',
        'expires_at'  => 'datetime',
        'responded_at'=> 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(fn (self $q) => $q->uuid ??= Str::uuid()->toString());
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            'pending'   => 'Aguardando análise',
            'reviewing' => 'Em análise',
            'sent'      => 'Proposta enviada',
            'accepted'  => 'Aceita',
            'rejected'  => 'Recusada',
            default     => $this->status,
        };
    }

    public function statusColor(): string
    {
        return match ($this->status) {
            'pending'   => 'warning',
            'reviewing' => 'info',
            'sent'      => 'primary',
            'accepted'  => 'success',
            'rejected'  => 'error',
            default     => 'default',
        };
    }
}
