<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Catalog\Contracts\ProductRepositoryInterface;
use App\Domains\Catalog\Services\ProductService;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class ProductController extends Controller
{
    public function __construct(
        private readonly ProductRepositoryInterface $products,
        private readonly ProductService $productService,
    ) {}

    public function show(string $slug): Response
    {
        $product = $this->products->findBySlug($slug);

        if ($product === null || ! $product->status->isVisible()) {
            abort(404);
        }

        $related = $this->productService->related($product, 6);

        $frequentlyBought = $product->frequentlyBoughtWith(4);

        return Inertia::render('Storefront/Product', [
            'product' => [
                'id'                     => $product->id,
                'name'                   => $product->name,
                'slug'                   => $product->slug,
                'sku'                    => $product->sku,
                'short_description'      => $product->short_description,
                'description'            => $product->description,
                'price_cents'            => $product->price_cents,
                'compare_at_price_cents' => $product->compare_at_price_cents,
                'has_discount'           => $product->hasDiscount(),
                'discount_percent'       => $product->discountPercent(),
                'brand'                  => $product->brand ? ['name' => $product->brand->name, 'slug' => $product->brand->slug] : null,
                'categories'             => $product->categories->map(fn ($c) => ['name' => $c->name, 'slug' => $c->slug]),
                'specifications'         => $product->specifications,
                'weight_grams'           => $product->weight_grams,
                'images'                 => $product->images->map(fn ($img) => [
                    'url'      => $img->url(),
                    'alt'      => $img->alt ?? $product->name,
                    'is_cover' => $img->is_cover,
                ]),
                'variants' => $product->variants->filter->is_active->map(fn ($v) => [
                    'id'          => $v->id,
                    'name'        => $v->name,
                    'sku'         => $v->sku,
                    'price_cents' => $v->effectivePrice(),
                    'attributes'  => $v->attributes,
                ]),
                'breadcrumbs' => $product->categories->first()?->ancestors()->map(fn ($a) => [
                    'name' => $a->name,
                    'slug' => $a->slug,
                ])->push(['name' => $product->categories->first()?->name, 'slug' => $product->categories->first()?->slug])
                    ->push(['name' => $product->name]),
                'meta_title'       => $product->meta_title ?? $product->name,
                'meta_description' => $product->meta_description ?? $product->short_description,
            ],
            'frequentlyBought' => $frequentlyBought->map(fn ($p) => [
                'id'          => $p->id,
                'name'        => $p->name,
                'slug'        => $p->slug,
                'price_cents' => $p->price_cents,
                'has_discount'=> $p->hasDiscount(),
                'brand_name'  => $p->brand?->name,
                'cover_image' => $p->coverImage()?->url(),
            ]),
            'relatedProducts' => $related->map(fn ($p) => [
                'id'                     => $p->id,
                'name'                   => $p->name,
                'slug'                   => $p->slug,
                'price_cents'            => $p->price_cents,
                'compare_at_price_cents' => $p->compare_at_price_cents,
                'has_discount'           => $p->hasDiscount(),
                'brand_name'             => $p->brand?->name,
                'cover_image'            => $p->coverImage()?->url(),
            ]),
        ]);
    }
}
