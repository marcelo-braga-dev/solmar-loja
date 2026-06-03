<?php

declare(strict_types=1);

namespace App\Domains\Marketing\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

final class NewsletterSubscriber extends Model
{
    protected $fillable = ['email', 'name', 'confirmed', 'token', 'confirmed_at', 'unsubscribed_at'];

    protected $casts = [
        'confirmed'       => 'boolean',
        'confirmed_at'    => 'datetime',
        'unsubscribed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(fn (self $sub) => $sub->token ??= Str::random(64));
    }

    /** @param Builder<NewsletterSubscriber> $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('confirmed', true)->whereNull('unsubscribed_at');
    }

    public function isActive(): bool
    {
        return $this->confirmed && $this->unsubscribed_at === null;
    }
}
