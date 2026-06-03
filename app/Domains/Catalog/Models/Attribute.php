<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Models;

use App\Domains\Catalog\Enums\AttributeType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Attribute extends Model
{
    protected $fillable = ['name', 'slug', 'type', 'unit', 'is_filterable', 'position'];

    protected $casts = [
        'type'          => AttributeType::class,
        'is_filterable' => 'boolean',
        'position'      => 'integer',
    ];

    /** @return HasMany<AttributeValue, $this> */
    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class)->orderBy('position');
    }
}
