<?php

declare(strict_types=1);

namespace App\Domains\Marketing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

final class LoyaltyTransaction extends Model
{
    protected $fillable = [
        'user_id', 'type', 'points', 'balance_after',
        'description', 'source_type', 'source_id', 'expires_at',
    ];

    protected $casts = [
        'points'       => 'integer',
        'balance_after'=> 'integer',
        'expires_at'   => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }
}
