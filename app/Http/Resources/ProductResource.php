<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Product */
final class ProductResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id'                     => $this->id,
            'uuid'                   => $this->uuid,
            'name'                   => $this->name,
            'slug'                   => $this->slug,
            'sku'                    => $this->sku,
            'short_description'      => $this->short_description,
            'description'            => $this->description,
            'price_cents'            => $this->price_cents,
            'compare_at_price_cents' => $this->compare_at_price_cents,
            'cost_cents'             => $this->cost_cents,
            'status'                 => $this->status->value,
            'status_label'           => $this->status->label(),
            'brand_id'               => $this->brand_id,
            'brand'                  => new BrandResource($this->whenLoaded('brand')),
            'categories'             => CategoryResource::collection($this->whenLoaded('categories')),
            'featured'               => $this->featured,
            'has_discount'           => $this->hasDiscount(),
            'discount_percent'       => $this->discountPercent(),
            'weight_grams'           => $this->weight_grams,
            'length_mm'              => $this->length_mm,
            'width_mm'               => $this->width_mm,
            'height_mm'              => $this->height_mm,
            'specifications'         => $this->specifications,
            'meta_title'             => $this->meta_title,
            'meta_description'       => $this->meta_description,
            'external_id'            => $this->external_id,
            'published_at'           => $this->published_at?->toIso8601String(),
            'synced_at'              => $this->synced_at?->toIso8601String(),
            'created_at'             => $this->created_at->toIso8601String(),
            'cover_image'            => $this->when(
                $this->relationLoaded('images'),
                fn () => $this->coverImage()?->url(),
            ),
            'images' => $this->when(
                $this->relationLoaded('images'),
                fn () => $this->images->map(fn (ProductImage $img) => [
                    'id'       => $img->id,
                    'url'      => $img->url(),
                    'alt'      => $img->alt,
                    'position' => $img->position,
                    'is_cover' => $img->is_cover,
                ]),
            ),
            'variants' => $this->when(
                $this->relationLoaded('variants'),
                fn () => $this->variants->map(fn ($v) => [
                    'id'          => $v->id,
                    'sku'         => $v->sku,
                    'name'        => $v->name,
                    'price_cents' => $v->effectivePrice(),
                    'is_active'   => $v->is_active,
                ]),
            ),
        ];
    }
}
