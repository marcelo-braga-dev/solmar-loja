<?php

declare(strict_types=1);

namespace App\Domains\Marketing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class LoyaltyBalance extends Model
{
    protected $fillable = ['user_id', 'points', 'lifetime_points'];

    protected $casts = [
        'points'          => 'integer',
        'lifetime_points' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<LoyaltyTransaction, $this> */
    public function transactions(): HasMany
    {
        return $this->hasMany(LoyaltyTransaction::class, 'user_id', 'user_id');
    }

    /** Valor em reais do saldo (1 ponto = R$ 0,01) */
    public function valueInCents(): int
    {
        return $this->points; // 1 ponto = 1 centavo
    }
}
