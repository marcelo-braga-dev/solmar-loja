<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Services;

use App\Domains\Catalog\Contracts\ProductRepositoryInterface;
use App\Domains\Catalog\Data\ProductData;
use App\Domains\Catalog\Data\ProductFilterData;
use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Events\ProductPublished;
use App\Domains\Catalog\Events\ProductUpdated;
use App\Domains\Catalog\Models\Category;
use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Models\ProductImage;
use DomainException;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class ProductService
{
    public function __construct(
        private readonly ProductRepositoryInterface $products,
    ) {}

    public function create(ProductData $data): Product
    {
        $data = $this->normalizeSlug($data);

        return $this->products->create($data);
    }

    public function update(Product $product, ProductData $data): Product
    {
        $updated = $this->products->update($product, $data);

        event(new ProductUpdated($updated));

        return $updated;
    }

    public function publish(Product $product): Product
    {
        if ($product->images()->count() === 0) {
            throw new DomainException('Produto sem imagens não pode ser publicado.');
        }

        $data = ProductData::from([
            ...$product->toArray(),
            'priceCents'    => $product->price_cents,
            'status'        => ProductStatus::Published,
            'published_at'  => now(),
            'categoryIds'   => $product->categories->pluck('id')->toArray(),
        ]);

        $updated = $this->products->update($product, $data);

        event(new ProductPublished($updated));

        return $updated;
    }

    public function unpublish(Product $product): Product
    {
        $data = ProductData::from([
            ...$product->toArray(),
            'priceCents'  => $product->price_cents,
            'status'      => ProductStatus::Draft,
            'categoryIds' => $product->categories->pluck('id')->toArray(),
        ]);

        return $this->products->update($product, $data);
    }

    public function delete(Product $product): void
    {
        $this->products->delete($product);
    }

    /** @return LengthAwarePaginator<Product> */
    public function filter(ProductFilterData $filter): LengthAwarePaginator
    {
        return $this->products->filter($filter);
    }

    /**
     * Atributos filtráveis disponíveis para a categoria (e suas subcategorias), com contagem de produtos.
     *
     * @return array<int, array{id: int, name: string, values: array<int, array{id: int, value: string, count: int}>}>
     */
    public function facetsForCategory(Category $category): array
    {
        $categoryIds = [$category->id, ...$category->children->pluck('id')->all()];

        return $this->products->facetsForCategories($categoryIds)
            ->groupBy('attribute_id')
            ->map(fn ($rows) => [
                'id'     => (int) $rows->first()->attribute_id,
                'name'   => $rows->first()->attribute_name,
                'values' => $rows->map(fn ($r) => [
                    'id'    => (int) $r->value_id,
                    'value' => $r->value,
                    'count' => (int) $r->product_count,
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }

    /** @return LengthAwarePaginator<Product> */
    public function paginateForAdmin(int $perPage = 20, ?string $search = null): LengthAwarePaginator
    {
        return $this->products->paginateForAdmin($perPage, $search);
    }

    /** @return Collection<int, Product> */
    public function featured(int $limit = 8): Collection
    {
        return $this->products->featured($limit);
    }

    /** @return Collection<int, Product> */
    public function onSale(int $limit = 8): Collection
    {
        return $this->products->onSale($limit);
    }

    /** @return Collection<int, Product> */
    public function related(Product $product, int $limit = 6): Collection
    {
        $categoryIds = $product->categories->pluck('id')->toArray();

        return Product::published()
            ->where('id', '!=', $product->id)
            ->when(count($categoryIds) > 0, fn ($q) => $q->whereHas(
                'categories',
                fn ($q2) => $q2->whereIn('categories.id', $categoryIds),
            ))
            ->with(['brand:id,name,slug', 'images' => fn ($q) => $q->where('is_cover', true)])
            ->inRandomOrder()
            ->limit($limit)
            ->get();
    }

    public function uploadImage(Product $product, UploadedFile $file, bool $isCover = false): ProductImage
    {
        $path = $file->store("products/{$product->id}/images", 'public');

        if ($isCover) {
            $product->images()->update(['is_cover' => false]);
        }

        $position = $product->images()->max('position') + 1;

        return $product->images()->create([
            'path'     => $path,
            'alt'      => $product->name,
            'position' => $position,
            'is_cover' => $isCover || $product->images()->count() === 0,
        ]);
    }

    public function deleteImage(ProductImage $image): void
    {
        Storage::disk('public')->delete($image->path);
        $image->delete();
    }

    private function normalizeSlug(ProductData $data): ProductData
    {
        $slug = $data->slug ?: Str::slug($data->name);

        return new ProductData(
            name: $data->name,
            slug: $slug,
            sku: $data->sku,
            priceCents: $data->priceCents,
            status: $data->status,
            shortDescription: $data->shortDescription,
            description: $data->description,
            compareAtPriceCents: $data->compareAtPriceCents,
            costCents: $data->costCents,
            brandId: $data->brandId,
            weightGrams: $data->weightGrams,
            lengthMm: $data->lengthMm,
            widthMm: $data->widthMm,
            heightMm: $data->heightMm,
            specifications: $data->specifications,
            featured: $data->featured,
            metaTitle: $data->metaTitle,
            metaDescription: $data->metaDescription,
            externalId: $data->externalId,
            categoryIds: $data->categoryIds,
        );
    }
}
