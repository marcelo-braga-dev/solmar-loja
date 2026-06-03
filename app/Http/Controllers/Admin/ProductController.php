<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Catalog\Models\Brand;
use App\Domains\Catalog\Models\Category;
use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Services\CategoryService;
use App\Domains\Catalog\Services\BrandService;
use App\Domains\Catalog\Services\ProductService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
        private readonly CategoryService $categoryService,
        private readonly BrandService $brandService,
    ) {}

    public function index(Request $request): Response
    {
        $products = $this->productService->paginateForAdmin(
            perPage: 20,
            search: $request->string('q')->value() ?: null,
        );

        return Inertia::render('Admin/Products/Index', [
            'products' => $products->through(fn (Product $p) => [
                'id'           => $p->id,
                'uuid'         => $p->uuid,
                'name'         => $p->name,
                'sku'          => $p->sku,
                'status'       => $p->status->value,
                'status_label' => $p->status->label(),
                'status_color' => $p->status->color(),
                'price_cents'  => $p->price_cents,
                'featured'     => $p->featured,
                'brand'        => $p->brand?->name,
                'cover_image'  => $p->coverImage()?->url(),
                'created_at'   => $p->created_at->toIso8601String(),
            ]),
            'filters' => ['q' => $request->string('q')->value()],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Products/Form', [
            'categories' => $this->categoryService->allActive()->map(fn (Category $c) => [
                'id'   => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
            ]),
            'brands' => $this->brandService->allActive()->map(fn (Brand $b) => [
                'id'   => $b->id,
                'name' => $b->name,
            ]),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $product = $this->productService->create($request->toData());

        return to_route('admin.products.edit', $product->uuid)
            ->with('success', 'Produto criado com sucesso.');
    }

    public function edit(Product $product): Response
    {
        $product->load(['brand', 'categories', 'images', 'variants', 'attributeValues.attribute']);

        return Inertia::render('Admin/Products/Form', [
            'product' => [
                'id'                     => $product->id,
                'uuid'                   => $product->uuid,
                'name'                   => $product->name,
                'slug'                   => $product->slug,
                'sku'                    => $product->sku,
                'short_description'      => $product->short_description,
                'description'            => $product->description,
                'price_cents'            => $product->price_cents,
                'compare_at_price_cents' => $product->compare_at_price_cents,
                'cost_cents'             => $product->cost_cents,
                'status'                 => $product->status->value,
                'brand_id'               => $product->brand_id,
                'category_ids'           => $product->categories->pluck('id')->toArray(),
                'weight_grams'           => $product->weight_grams,
                'length_mm'              => $product->length_mm,
                'width_mm'               => $product->width_mm,
                'height_mm'              => $product->height_mm,
                'specifications'         => $product->specifications,
                'featured'               => $product->featured,
                'meta_title'             => $product->meta_title,
                'meta_description'       => $product->meta_description,
                'images'                 => $product->images->map(fn ($img) => [
                    'id'       => $img->id,
                    'url'      => $img->url(),
                    'alt'      => $img->alt,
                    'is_cover' => $img->is_cover,
                    'position' => $img->position,
                ]),
            ],
            'categories' => $this->categoryService->allActive()->map(fn (Category $c) => [
                'id'   => $c->id,
                'name' => $c->name,
            ]),
            'brands' => $this->brandService->allActive()->map(fn (Brand $b) => [
                'id'   => $b->id,
                'name' => $b->name,
            ]),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $this->productService->update($product, $request->toData());

        return back()->with('success', 'Produto atualizado com sucesso.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->productService->delete($product);

        return to_route('admin.products.index')
            ->with('success', 'Produto excluído.');
    }

    public function publish(Product $product): RedirectResponse
    {
        $this->productService->publish($product);

        return back()->with('success', 'Produto publicado.');
    }

    public function unpublish(Product $product): RedirectResponse
    {
        $this->productService->unpublish($product);

        return back()->with('success', 'Produto despublicado.');
    }
}
