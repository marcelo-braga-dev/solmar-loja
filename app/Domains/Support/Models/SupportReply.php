<?php

declare(strict_types=1);

namespace App\Domains\Support\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class SupportReply extends Model
{
    protected $fillable = ['ticket_id', 'user_id', 'message', 'is_staff', 'attachments'];

    protected $casts = [
        'is_staff'    => 'boolean',
        'attachments' => 'array',
    ];

    public function ticket(): BelongsTo { return $this->belongsTo(SupportTicket::class, 'ticket_id'); }
    public function user(): BelongsTo   { return $this->belongsTo(User::class); }
}
