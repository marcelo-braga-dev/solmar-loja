<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Repositories;

use App\Domains\Catalog\Contracts\ProductRepositoryInterface;
use App\Domains\Catalog\Data\ProductData;
use App\Domains\Catalog\Data\ProductFilterData;
use App\Domains\Catalog\Models\AttributeValue;
use App\Domains\Catalog\Models\Category;
use App\Domains\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class EloquentProductRepository implements ProductRepositoryInterface
{
    public function findBySlug(string $slug): ?Product
    {
        return Product::query()
            ->with(['brand', 'categories', 'images', 'variants', 'attributeValues.attribute'])
            ->where('slug', $slug)
            ->first();
    }

    public function findById(int $id): ?Product
    {
        return Product::query()->with(['brand', 'categories', 'images'])->find($id);
    }

    public function findByUuid(string $uuid): ?Product
    {
        return Product::query()->where('uuid', $uuid)->first();
    }

    /** @return LengthAwarePaginator<Product> */
    public function filter(ProductFilterData $filter): LengthAwarePaginator
    {
        $query = Product::query()
            ->with(['brand', 'images', 'categories'])
            ->published();

        if (! empty($filter->categoryIds)) {
            // Seleção explícita (ex.: múltiplas subcategorias irmãs marcadas no filtro)
            $query->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $filter->categoryIds));
        } elseif ($filter->categoryId !== null) {
            $categoryIds = $this->categoryAndChildrenIds($filter->categoryId);

            $query->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $categoryIds));
        }

        if ($filter->brandId !== null) {
            $query->where('brand_id', $filter->brandId);
        }

        if ($filter->priceMin !== null) {
            $query->where('price_cents', '>=', $filter->priceMin);
        }

        if ($filter->priceMax !== null) {
            $query->where('price_cents', '<=', $filter->priceMax);
        }

        if ($filter->featured) {
            $query->featured();
        }

        if ($filter->onSale) {
            $query->whereNotNull('compare_at_price_cents')
                ->whereColumn('price_cents', '<', 'compare_at_price_cents');
        }

        if ($filter->inStock) {
            $query->whereExists(fn ($sub) => $sub->from('stocks')
                ->whereColumn('stocks.product_id', 'products.id')
                ->whereNull('stocks.variant_id')
                ->where('stocks.quantity_available', '>', 0)
            );
        }

        if (! empty($filter->attributeValueIds)) {
            // Mesmo atributo = OR (qualquer marca selecionada); atributos diferentes = AND (refinam juntos)
            $valuesByAttribute = AttributeValue::whereIn('id', $filter->attributeValueIds)
                ->get(['id', 'attribute_id'])
                ->groupBy('attribute_id');

            foreach ($valuesByAttribute as $valueIds) {
                $query->whereHas(
                    'attributeValues',
                    fn ($q) => $q->whereIn('attribute_values.id', $valueIds->pluck('id'))
                );
            }
        }

        $query->orderBy($filter->sortColumn(), $filter->sortDirection());

        return $query->paginate($filter->perPage);
    }

    /** @return \Illuminate\Support\Collection<int, object> */
    public function facetsForCategories(array $categoryIds): \Illuminate\Support\Collection
    {
        return DB::table('product_attribute_values as pav')
            ->join('products as p', 'p.id', '=', 'pav.product_id')
            ->join('category_product as cp', 'cp.product_id', '=', 'p.id')
            ->join('attribute_values as av', 'av.id', '=', 'pav.attribute_value_id')
            ->join('attributes as a', 'a.id', '=', 'av.attribute_id')
            ->whereIn('cp.category_id', $categoryIds)
            ->where('p.status', 'published')
            ->where('a.is_filterable', true)
            ->groupBy('a.id', 'a.name', 'a.position', 'av.id', 'av.value', 'av.position')
            ->orderBy('a.position')
            ->orderBy('av.position')
            ->get([
                'a.id as attribute_id',
                'a.name as attribute_name',
                'av.id as value_id',
                'av.value',
                DB::raw('COUNT(DISTINCT p.id) as product_count'),
            ]);
    }

    /** @return int[] */
    private function categoryAndChildrenIds(int $categoryId): array
    {
        return Category::where('id', $categoryId)
            ->orWhere('parent_id', $categoryId)
            ->pluck('id')
            ->all();
    }

    /** @return LengthAwarePaginator<Product> */
    public function paginateForAdmin(int $perPage = 20, ?string $search = null): LengthAwarePaginator
    {
        $query = Product::query()
            ->with(['brand', 'images'])
            ->withTrashed();

        if ($search !== null && $search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('external_id', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($perPage);
    }

    /** @return Collection<int, Product> */
    public function featured(int $limit = 8): Collection
    {
        return Product::query()
            ->with(['brand', 'images'])
            ->published()
            ->featured()
            ->inRandomOrder()
            ->limit($limit)
            ->get();
    }

    /** @return Collection<int, Product> */
    public function onSale(int $limit = 8): Collection
    {
        return Product::query()
            ->with(['brand', 'images'])
            ->published()
            ->whereNotNull('compare_at_price_cents')
            ->whereColumn('price_cents', '<', 'compare_at_price_cents')
            ->orderByDesc(DB::raw('compare_at_price_cents - price_cents'))
            ->limit($limit)
            ->get();
    }

    /** @return Collection<int, Product> */
    public function related(Product $product, int $limit = 6): Collection
    {
        $categoryIds = $product->categories->pluck('id');

        return Product::query()
            ->with(['brand', 'images'])
            ->published()
            ->where('id', '!=', $product->id)
            ->where(function ($q) use ($categoryIds, $product): void {
                $q->whereHas('categories', fn ($cq) => $cq->whereIn('categories.id', $categoryIds))
                    ->orWhere('brand_id', $product->brand_id);
            })
            ->limit($limit)
            ->get();
    }

    public function create(ProductData $data): Product
    {
        $product = Product::create($this->toAttributes($data));
        $this->syncCategories($product, $data->categoryIds);

        return $product->load(['brand', 'categories', 'images']);
    }

    public function update(Product $product, ProductData $data): Product
    {
        $product->update($this->toAttributes($data));
        $this->syncCategories($product, $data->categoryIds);

        return $product->fresh(['brand', 'categories', 'images']) ?? $product;
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }

    /** @return array<string, mixed> */
    private function toAttributes(ProductData $data): array
    {
        return [
            'name' => $data->name,
            'slug' => $data->slug,
            'sku' => $data->sku,
            'short_description' => $data->shortDescription,
            'description' => $data->description,
            'price_cents' => $data->priceCents,
            'compare_at_price_cents' => $data->compareAtPriceCents,
            'cost_cents' => $data->costCents,
            'status' => $data->status,
            'brand_id' => $data->brandId,
            'weight_grams' => $data->weightGrams,
            'length_mm' => $data->lengthMm,
            'width_mm' => $data->widthMm,
            'height_mm' => $data->heightMm,
            'specifications' => $data->specifications,
            'featured' => $data->featured,
            'meta_title' => $data->metaTitle,
            'meta_description' => $data->metaDescription,
            'external_id' => $data->externalId,
        ];
    }

    /** @param int[] $categoryIds */
    private function syncCategories(Product $product, array $categoryIds): void
    {
        if (empty($categoryIds)) {
            return;
        }

        $pivotData = [];
        foreach ($categoryIds as $i => $id) {
            $pivotData[$id] = ['is_primary' => $i === 0];
        }

        $product->categories()->sync($pivotData);
    }
}
