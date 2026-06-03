<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Services;

use App\Domains\Catalog\Contracts\CategoryRepositoryInterface;
use App\Domains\Catalog\Data\CategoryData;
use App\Domains\Catalog\Models\Category;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

final class CategoryService
{
    public function __construct(
        private readonly CategoryRepositoryInterface $categories,
    ) {}

    /** @return Collection<int, Category> */
    public function tree(): Collection
    {
        return $this->categories->tree();
    }

    /** @return Collection<int, Category> */
    public function allActive(): Collection
    {
        return $this->categories->allActive();
    }

    public function create(CategoryData $data): Category
    {
        $data = new CategoryData(
            name: $data->name,
            slug: $data->slug ?: Str::slug($data->name),
            parentId: $data->parentId,
            description: $data->description,
            image: $data->image,
            icon: $data->icon,
            position: $data->position,
            isActive: $data->isActive,
            metaTitle: $data->metaTitle,
            metaDescription: $data->metaDescription,
        );

        return $this->categories->create($data);
    }

    public function update(Category $category, CategoryData $data): Category
    {
        return $this->categories->update($category, $data);
    }

    public function delete(Category $category): void
    {
        $this->categories->delete($category);
    }
}
