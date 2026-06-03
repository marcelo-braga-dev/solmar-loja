<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Models;

use App\Domains\Catalog\Enums\ProductStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Laravel\Scout\Searchable;

final class Product extends Model
{
    use HasFactory;
    use Searchable;
    use SoftDeletes;

    protected $fillable = [
        'uuid', 'name', 'slug', 'sku', 'short_description', 'description',
        'price_cents', 'compare_at_price_cents', 'cost_cents',
        'status', 'brand_id', 'weight_grams', 'length_mm', 'width_mm', 'height_mm',
        'specifications', 'featured', 'meta_title', 'meta_description',
        'external_id', 'synced_at', 'published_at',
    ];

    protected $casts = [
        'status'         => ProductStatus::class,
        'specifications' => 'array',
        'featured'       => 'boolean',
        'published_at'   => 'datetime',
        'synced_at'      => 'datetime',
        'price_cents'    => 'integer',
        'compare_at_price_cents' => 'integer',
        'cost_cents'     => 'integer',
        'weight_grams'   => 'integer',
        'length_mm'      => 'integer',
        'width_mm'       => 'integer',
        'height_mm'      => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $product): void {
            $product->uuid ??= Str::uuid()->toString();
        });
    }

    // ─── Relacionamentos ─────────────────────────────────────────────────────

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /** @return BelongsToMany<Category, $this> */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class)
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    /** @return HasMany<ProductImage, $this> */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('position');
    }

    /** @return HasMany<ProductVariant, $this> */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /** @return BelongsToMany<AttributeValue, $this> */
    public function attributeValues(): BelongsToMany
    {
        return $this->belongsToMany(AttributeValue::class, 'product_attribute_values');
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    /** @param Builder<Product> $query */
    public function scopePublished(Builder $query): void
    {
        $query->where('status', ProductStatus::Published);
    }

    /** @param Builder<Product> $query */
    public function scopeFeatured(Builder $query): void
    {
        $query->where('featured', true);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function coverImage(): ?ProductImage
    {
        return $this->images->firstWhere('is_cover', true)
            ?? $this->images->first();
    }

    public function hasDiscount(): bool
    {
        return $this->compare_at_price_cents !== null
            && $this->compare_at_price_cents > $this->price_cents;
    }

    public function discountPercent(): int
    {
        if (! $this->hasDiscount() || $this->compare_at_price_cents === null) {
            return 0;
        }

        return (int) round(
            (1 - $this->price_cents / $this->compare_at_price_cents) * 100
        );
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    // ─── Scout / Meilisearch ─────────────────────────────────────────────────

    /** @return array<string, mixed> */
    public function toSearchableArray(): array
    {
        return [
            'id'                => $this->id,
            'uuid'              => $this->uuid,
            'name'              => $this->name,
            'slug'              => $this->slug,
            'sku'               => $this->sku,
            'short_description' => $this->short_description,
            'price_cents'       => $this->price_cents,
            'brand_name'        => $this->brand?->name,
            'categories'        => $this->categories->pluck('name')->toArray(),
            'status'            => $this->status->value,
            'featured'          => $this->featured,
            'published_at'      => $this->published_at?->timestamp,
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return $this->status === ProductStatus::Published;
    }
}
