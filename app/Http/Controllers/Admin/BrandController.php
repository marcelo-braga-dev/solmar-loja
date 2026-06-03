<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Catalog\Data\BrandData;
use App\Domains\Catalog\Models\Brand;
use App\Domains\Catalog\Services\BrandService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

final class BrandController extends Controller
{
    public function __construct(
        private readonly BrandService $brandService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Brands/Index', [
            'brands' => $this->brandService->paginate(20)->through(fn (Brand $b) => [
                'id'             => $b->id,
                'name'           => $b->name,
                'slug'           => $b->slug,
                'logo'           => $b->logo,
                'is_active'      => $b->is_active,
                'products_count' => $b->products_count ?? 0,
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', 'unique:brands,slug'],
            'description' => ['nullable', 'string'],
            'website'     => ['nullable', 'url'],
            'is_active'   => ['boolean'],
        ]);

        $this->brandService->create(new BrandData(
            name: $validated['name'],
            slug: $validated['slug'] ?? Str::slug($validated['name']),
            description: $validated['description'] ?? null,
            isActive: $validated['is_active'] ?? true,
            website: $validated['website'] ?? null,
        ));

        return back()->with('success', 'Marca criada com sucesso.');
    }

    public function update(Request $request, Brand $brand): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', "unique:brands,slug,{$brand->id}"],
            'description' => ['nullable', 'string'],
            'website'     => ['nullable', 'url'],
            'is_active'   => ['boolean'],
        ]);

        $this->brandService->update($brand, new BrandData(
            name: $validated['name'],
            slug: $validated['slug'] ?? $brand->slug,
            description: $validated['description'] ?? null,
            isActive: $validated['is_active'] ?? true,
            website: $validated['website'] ?? null,
        ));

        return back()->with('success', 'Marca atualizada.');
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        $this->brandService->delete($brand);

        return back()->with('success', 'Marca excluída.');
    }
}
