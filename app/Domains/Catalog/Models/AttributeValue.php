<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

final class AttributeValue extends Model
{
    protected $fillable = ['attribute_id', 'value', 'slug', 'position'];

    protected $casts = ['position' => 'integer'];

    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }

    /** @return BelongsToMany<Product, $this> */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_attribute_values');
    }
}
