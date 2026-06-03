<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domains\Catalog\Data\ProductData;
use App\Domains\Catalog\Enums\ProductStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Enum;

final class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Proteger por middleware de auth
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name'                   => ['required', 'string', 'max:255'],
            'slug'                   => ['nullable', 'string', 'max:255', 'unique:products,slug'],
            'sku'                    => ['required', 'string', 'max:100', 'unique:products,sku'],
            'price_cents'            => ['required', 'integer', 'min:0'],
            'compare_at_price_cents' => ['nullable', 'integer', 'min:0'],
            'cost_cents'             => ['nullable', 'integer', 'min:0'],
            'status'                 => ['required', new Enum(ProductStatus::class)],
            'short_description'      => ['nullable', 'string', 'max:500'],
            'description'            => ['nullable', 'string'],
            'brand_id'               => ['nullable', 'integer', 'exists:brands,id'],
            'category_ids'           => ['nullable', 'array'],
            'category_ids.*'         => ['integer', 'exists:categories,id'],
            'weight_grams'           => ['nullable', 'integer', 'min:0'],
            'length_mm'              => ['nullable', 'integer', 'min:0'],
            'width_mm'               => ['nullable', 'integer', 'min:0'],
            'height_mm'              => ['nullable', 'integer', 'min:0'],
            'specifications'         => ['nullable', 'array'],
            'featured'               => ['boolean'],
            'meta_title'             => ['nullable', 'string', 'max:255'],
            'meta_description'       => ['nullable', 'string', 'max:500'],
        ];
    }

    public function toData(): ProductData
    {
        $validated = $this->validated();

        return new ProductData(
            name: $validated['name'],
            slug: $validated['slug'] ?? Str::slug($validated['name']),
            sku: $validated['sku'],
            priceCents: (int) $validated['price_cents'],
            status: ProductStatus::from($validated['status']),
            shortDescription: $validated['short_description'] ?? null,
            description: $validated['description'] ?? null,
            compareAtPriceCents: isset($validated['compare_at_price_cents']) ? (int) $validated['compare_at_price_cents'] : null,
            costCents: isset($validated['cost_cents']) ? (int) $validated['cost_cents'] : null,
            brandId: isset($validated['brand_id']) ? (int) $validated['brand_id'] : null,
            weightGrams: isset($validated['weight_grams']) ? (int) $validated['weight_grams'] : null,
            lengthMm: isset($validated['length_mm']) ? (int) $validated['length_mm'] : null,
            widthMm: isset($validated['width_mm']) ? (int) $validated['width_mm'] : null,
            heightMm: isset($validated['height_mm']) ? (int) $validated['height_mm'] : null,
            specifications: $validated['specifications'] ?? null,
            featured: (bool) ($validated['featured'] ?? false),
            metaTitle: $validated['meta_title'] ?? null,
            metaDescription: $validated['meta_description'] ?? null,
            categoryIds: $validated['category_ids'] ?? [],
        );
    }
}
