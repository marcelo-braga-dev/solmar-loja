<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Services;

use App\Domains\Catalog\Contracts\BrandRepositoryInterface;
use App\Domains\Catalog\Data\BrandData;
use App\Domains\Catalog\Models\Brand;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

final class BrandService
{
    public function __construct(
        private readonly BrandRepositoryInterface $brands,
    ) {}

    /** @return Collection<int, Brand> */
    public function allActive(): Collection
    {
        return $this->brands->allActive();
    }

    /** @return LengthAwarePaginator<Brand> */
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->brands->paginate($perPage);
    }

    public function create(BrandData $data): Brand
    {
        $data = new BrandData(
            name: $data->name,
            slug: $data->slug ?: Str::slug($data->name),
            logo: $data->logo,
            description: $data->description,
            isActive: $data->isActive,
            website: $data->website,
            metaTitle: $data->metaTitle,
            metaDescription: $data->metaDescription,
        );

        return $this->brands->create($data);
    }

    public function update(Brand $brand, BrandData $data): Brand
    {
        return $this->brands->update($brand, $data);
    }

    public function delete(Brand $brand): void
    {
        $this->brands->delete($brand);
    }
}
