<?php

declare(strict_types=1);

namespace App\Domains\Marketing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

final class Post extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uuid', 'author_id', 'post_category_id', 'title', 'slug', 'excerpt',
        'content', 'cover_image', 'status', 'meta_title', 'meta_description', 'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $post): void {
            $post->uuid  ??= Str::uuid()->toString();
            $post->slug  ??= Str::slug($post->title);
        });
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(PostCategory::class, 'post_category_id');
    }

    /** @param Builder<Post> $query */
    public function scopePublished(Builder $query): void
    {
        $query->where('status', 'published')->whereNotNull('published_at')->where('published_at', '<=', now());
    }

    public function isPublished(): bool
    {
        return $this->status === 'published' && $this->published_at?->isPast() === true;
    }

    public function readingTime(): int
    {
        $words = str_word_count(strip_tags($this->content));

        return (int) max(1, ceil($words / 200));
    }
}
