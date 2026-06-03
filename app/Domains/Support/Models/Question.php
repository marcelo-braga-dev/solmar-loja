<?php

declare(strict_types=1);

namespace App\Domains\Support\Models;

use App\Domains\Catalog\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Question extends Model
{
    protected $fillable = ['product_id', 'user_id', 'question', 'status', 'asker_name'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<Answer, $this> */
    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }

    public function askerName(): string
    {
        return $this->asker_name ?? $this->user?->name ?? 'Anônimo';
    }
}
