<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Repositories;

use App\Domains\Catalog\Contracts\CategoryRepositoryInterface;
use App\Domains\Catalog\Data\CategoryData;
use App\Domains\Catalog\Models\Category;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

final class EloquentCategoryRepository implements CategoryRepositoryInterface
{
    /** @return Collection<int, Category> */
    public function allActive(): Collection
    {
        return Category::query()
            ->where('is_active', true)
            ->orderBy('position')
            ->get();
    }

    /** @return Collection<int, Category> */
    public function tree(): Collection
    {
        return Category::query()
            ->with([
                'children'                           => fn ($q) => $q->orderBy('position'),
                'children.children'                  => fn ($q) => $q->orderBy('position'),
                'children.children.children'         => fn ($q) => $q->orderBy('position'),
                'children.children.children.children' => fn ($q) => $q->orderBy('position'),
            ])
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('position')
            ->get();
    }

    public function findBySlug(string $slug): ?Category
    {
        return Category::query()->where('slug', $slug)->first();
    }

    public function findById(int $id): ?Category
    {
        return Category::query()->find($id);
    }

    public function create(CategoryData $data): Category
    {
        return Category::create([
            'name'             => $data->name,
            'slug'             => $data->slug ?: Str::slug($data->name),
            'parent_id'        => $data->parentId,
            'description'      => $data->description,
            'image'            => $data->image,
            'icon'             => $data->icon,
            'position'         => $data->position,
            'is_active'        => $data->isActive,
            'meta_title'       => $data->metaTitle,
            'meta_description' => $data->metaDescription,
        ]);
    }

    public function update(Category $category, CategoryData $data): Category
    {
        $category->update([
            'name'             => $data->name,
            'slug'             => $data->slug,
            'parent_id'        => $data->parentId,
            'description'      => $data->description,
            'image'            => $data->image,
            'icon'             => $data->icon,
            'position'         => $data->position,
            'is_active'        => $data->isActive,
            'meta_title'       => $data->metaTitle,
            'meta_description' => $data->metaDescription,
        ]);

        return $category->fresh() ?? $category;
    }

    public function delete(Category $category): void
    {
        $category->delete();
    }
}
