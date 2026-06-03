<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Repositories;

use App\Domains\Catalog\Contracts\BrandRepositoryInterface;
use App\Domains\Catalog\Data\BrandData;
use App\Domains\Catalog\Models\Brand;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

final class EloquentBrandRepository implements BrandRepositoryInterface
{
    /** @return Collection<int, Brand> */
    public function allActive(): Collection
    {
        return Brand::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /** @return LengthAwarePaginator<Brand> */
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Brand::query()
            ->withCount('products')
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findBySlug(string $slug): ?Brand
    {
        return Brand::query()->where('slug', $slug)->first();
    }

    public function findById(int $id): ?Brand
    {
        return Brand::query()->find($id);
    }

    public function create(BrandData $data): Brand
    {
        return Brand::create([
            'name'             => $data->name,
            'slug'             => $data->slug,
            'logo'             => $data->logo,
            'description'      => $data->description,
            'is_active'        => $data->isActive,
            'website'          => $data->website,
            'meta_title'       => $data->metaTitle,
            'meta_description' => $data->metaDescription,
        ]);
    }

    public function update(Brand $brand, BrandData $data): Brand
    {
        $brand->update([
            'name'             => $data->name,
            'slug'             => $data->slug,
            'logo'             => $data->logo,
            'description'      => $data->description,
            'is_active'        => $data->isActive,
            'website'          => $data->website,
            'meta_title'       => $data->metaTitle,
            'meta_description' => $data->metaDescription,
        ]);

        return $brand->fresh() ?? $brand;
    }

    public function delete(Brand $brand): void
    {
        $brand->delete();
    }
}
