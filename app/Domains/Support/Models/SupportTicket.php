<?php

declare(strict_types=1);

namespace App\Domains\Support\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

final class SupportTicket extends Model
{
    protected $fillable = [
        'uuid', 'user_id', 'name', 'email', 'subject',
        'category', 'priority', 'status', 'order_id',
    ];

    protected static function booted(): void
    {
        static::creating(fn (self $t) => $t->uuid ??= Str::uuid()->toString());
    }

    public function user(): BelongsTo    { return $this->belongsTo(User::class); }
    /** @return HasMany<SupportReply, $this> */
    public function replies(): HasMany   { return $this->hasMany(SupportReply::class, 'ticket_id')->orderBy('created_at'); }

    public function statusLabel(): string
    {
        return match ($this->status) {
            'open'        => 'Aberto',
            'in_progress' => 'Em andamento',
            'waiting'     => 'Aguardando cliente',
            'resolved'    => 'Resolvido',
            'closed'      => 'Fechado',
            default       => $this->status,
        };
    }

    public function statusColor(): string
    {
        return match ($this->status) {
            'open'        => 'error',
            'in_progress' => 'warning',
            'waiting'     => 'info',
            'resolved'    => 'success',
            'closed'      => 'default',
            default       => 'default',
        };
    }

    public function priorityLabel(): string
    {
        return match ($this->priority) {
            'low'    => 'Baixa', 'normal' => 'Normal',
            'high'   => 'Alta',  'urgent' => 'Urgente',
            default  => $this->priority,
        };
    }

    public function categoryLabel(): string
    {
        return match ($this->category) {
            'general'   => 'Geral',     'technical' => 'Técnico',
            'order'     => 'Pedido',    'payment'   => 'Pagamento',
            'returns'   => 'Devolução', default     => $this->category,
        };
    }
}
