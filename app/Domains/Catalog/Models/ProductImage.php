<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

final class ProductImage extends Model
{
    protected $fillable = ['product_id', 'path', 'alt', 'position', 'is_cover', 'tag'];

    protected $casts = [
        'position' => 'integer',
        'is_cover' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function url(): string
    {
        if (str_starts_with($this->path, 'http')) {
            return $this->path;
        }

        return Storage::disk('public')->url($this->path);
    }
}
