<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Contracts;

use App\Domains\Catalog\Data\CategoryData;
use App\Domains\Catalog\Models\Category;
use Illuminate\Database\Eloquent\Collection;

interface CategoryRepositoryInterface
{
    /** @return Collection<int, Category> */
    public function allActive(): Collection;

    /** @return Collection<int, Category> */
    public function tree(): Collection;

    public function findBySlug(string $slug): ?Category;

    public function findById(int $id): ?Category;

    public function create(CategoryData $data): Category;

    public function update(Category $category, CategoryData $data): Category;

    public function delete(Category $category): void;
}
