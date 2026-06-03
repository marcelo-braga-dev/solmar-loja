<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Catalog\Data\CategoryData;
use App\Domains\Catalog\Models\Category;
use App\Domains\Catalog\Services\CategoryService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

final class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryService $categoryService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Categories/Index', [
            'categories' => $this->categoryService->tree()->map(fn (Category $c) => $this->mapCategory($c)),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', 'unique:categories,slug'],
            'parent_id'   => ['nullable', 'integer', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'icon'        => ['nullable', 'string', 'max:50'],
            'position'    => ['integer', 'min:0'],
            'is_active'   => ['boolean'],
        ]);

        $this->categoryService->create(new CategoryData(
            name: $validated['name'],
            slug: $validated['slug'] ?? Str::slug($validated['name']),
            parentId: $validated['parent_id'] ?? null,
            description: $validated['description'] ?? null,
            icon: $validated['icon'] ?? null,
            position: $validated['position'] ?? 0,
            isActive: $validated['is_active'] ?? true,
        ));

        return back()->with('success', 'Categoria criada com sucesso.');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', "unique:categories,slug,{$category->id}"],
            'parent_id'   => ['nullable', 'integer', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'icon'        => ['nullable', 'string', 'max:50'],
            'position'    => ['integer', 'min:0'],
            'is_active'   => ['boolean'],
        ]);

        $this->categoryService->update($category, new CategoryData(
            name: $validated['name'],
            slug: $validated['slug'] ?? $category->slug,
            parentId: $validated['parent_id'] ?? null,
            description: $validated['description'] ?? null,
            icon: $validated['icon'] ?? null,
            position: $validated['position'] ?? 0,
            isActive: $validated['is_active'] ?? true,
        ));

        return back()->with('success', 'Categoria atualizada.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $this->categoryService->delete($category);

        return back()->with('success', 'Categoria excluída.');
    }

    /** @return array<string, mixed> */
    private function mapCategory(Category $category): array
    {
        return [
            'id'        => $category->id,
            'name'      => $category->name,
            'slug'      => $category->slug,
            'icon'      => $category->icon,
            'is_active' => $category->is_active,
            'position'  => $category->position,
            'parent_id' => $category->parent_id,
            'depth'     => $category->depth,
            'children'  => $category->relationLoaded('children')
                ? $category->children->map(fn (Category $c) => $this->mapCategory($c))->values()->toArray()
                : [],
        ];
    }
}
