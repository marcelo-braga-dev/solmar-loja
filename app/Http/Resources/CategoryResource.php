<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domains\Catalog\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Category */
final class CategoryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'uuid'        => $this->uuid,
            'name'        => $this->name,
            'slug'        => $this->slug,
            'description' => $this->description,
            'image'       => $this->image,
            'icon'        => $this->icon,
            'position'    => $this->position,
            'is_active'   => $this->is_active,
            'parent_id'   => $this->parent_id,
            'depth'       => $this->depth,
            'children'    => self::collection($this->whenLoaded('children')),
        ];
    }
}
