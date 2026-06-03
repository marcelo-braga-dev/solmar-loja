<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domains\Catalog\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Brand */
final class BrandResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'uuid'           => $this->uuid,
            'name'           => $this->name,
            'slug'           => $this->slug,
            'logo'           => $this->logo,
            'description'    => $this->description,
            'is_active'      => $this->is_active,
            'website'        => $this->website,
            'products_count' => $this->whenCounted('products'),
        ];
    }
}
