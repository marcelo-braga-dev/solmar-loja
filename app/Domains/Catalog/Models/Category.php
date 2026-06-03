<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

final class Category extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'uuid', 'name', 'slug', 'parent_id', 'description',
        'image', 'icon', 'position', 'is_active',
        'meta_title', 'meta_description',
        '_lft', '_rgt', 'depth',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'position'  => 'integer',
        'depth'     => 'integer',
        '_lft'      => 'integer',
        '_rgt'      => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $category): void {
            $category->uuid ??= Str::uuid()->toString();
        });
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /** @return HasMany<Category, $this> */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('position');
    }

    /** @return BelongsToMany<Product, $this> */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class)
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /** Retorna todos os ancestrais da raiz até o pai (sem lazy loading). */
    public function ancestors(): Collection
    {
        $ancestors = new Collection();
        $parentId  = $this->parent_id;

        while ($parentId !== null) {
            $parent = self::find($parentId, ['id', 'name', 'slug', 'parent_id']);

            if ($parent === null) {
                break;
            }

            $ancestors->prepend($parent);
            $parentId = $parent->parent_id;
        }

        return $ancestors;
    }
}
