<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Catalog\Contracts\CategoryRepositoryInterface;
use App\Domains\Catalog\Data\ProductFilterData;
use App\Domains\Catalog\Services\BrandService;
use App\Domains\Catalog\Services\ProductService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryRepositoryInterface $categories,
        private readonly ProductService $productService,
        private readonly BrandService $brandService,
    ) {}

    public function show(string $slug, Request $request): Response
    {
        $category = $this->categories->findBySlug($slug);

        if ($category === null) {
            abort(404);
        }

        $filter = new ProductFilterData(
            q: $request->string('q')->value() ?: null,
            categoryId: $category->id,
            brandId: $request->integer('brand') ?: null,
            priceMin: $request->integer('price_min') ?: null,
            priceMax: $request->integer('price_max') ?: null,
            inStock: $request->boolean('in_stock'),
            onSale: $request->boolean('on_sale'),
            sortBy: $request->string('sort')->value() ?: 'relevance',
            perPage: 24,
        );

        $products = $this->productService->filter($filter);

        return Inertia::render('Storefront/Category', [
            'category' => [
                'id'          => $category->id,
                'name'        => $category->name,
                'slug'        => $category->slug,
                'description' => $category->description,
                'image'       => $category->image,
                'breadcrumbs' => $category->ancestors()->map(fn ($a) => [
                    'name' => $a->name,
                    'slug' => $a->slug,
                ])->push(['name' => $category->name, 'slug' => $category->slug]),
            ],
            'products'     => $products->through(fn ($p) => [
                'id'                     => $p->id,
                'name'                   => $p->name,
                'slug'                   => $p->slug,
                'price_cents'            => $p->price_cents,
                'compare_at_price_cents' => $p->compare_at_price_cents,
                'has_discount'           => $p->hasDiscount(),
                'discount_percent'       => $p->discountPercent(),
                'brand_name'             => $p->brand?->name,
                'cover_image'            => $p->coverImage()?->url(),
            ]),
            'brands'  => $this->brandService->allActive()->map(fn ($b) => ['id' => $b->id, 'name' => $b->name]),
            'filters' => [
                'brand'     => $request->integer('brand') ?: null,
                'price_min' => $request->integer('price_min') ?: null,
                'price_max' => $request->integer('price_max') ?: null,
                'in_stock'  => $request->boolean('in_stock') ?: null,
                'on_sale'   => $request->boolean('on_sale') ?: null,
                'sort'      => $request->string('sort')->value() ?: null,
                'q'         => $request->string('q')->value() ?: null,
            ],
        ]);
    }
}
