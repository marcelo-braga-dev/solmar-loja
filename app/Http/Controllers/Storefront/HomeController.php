<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Catalog\Services\BrandService;
use App\Domains\Catalog\Services\ProductService;
use App\Domains\Marketing\Models\Post;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class HomeController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
        private readonly BrandService $brandService,
    ) {}

    public function __invoke(): Response
    {
        return Inertia::render('Storefront/Home', [
            'featuredProducts' => $this->productService->featured(8)->map(fn ($p) => [
                'id' => $p->id,
                'uuid' => $p->uuid,
                'name' => $p->name,
                'slug' => $p->slug,
                'price_cents' => $p->price_cents,
                'compare_at_price_cents' => $p->compare_at_price_cents,
                'has_discount' => $p->hasDiscount(),
                'discount_percent' => $p->discountPercent(),
                'brand_name' => $p->brand?->name,
                'cover_image' => $p->coverImage()?->url(),
            ]),
            'onSaleProducts' => $this->productService->onSale(8)->map(fn ($p) => [
                'id' => $p->id,
                'uuid' => $p->uuid,
                'name' => $p->name,
                'slug' => $p->slug,
                'price_cents' => $p->price_cents,
                'compare_at_price_cents' => $p->compare_at_price_cents,
                'has_discount' => $p->hasDiscount(),
                'discount_percent' => $p->discountPercent(),
                'brand_name' => $p->brand?->name,
                'cover_image' => $p->coverImage()?->url(),
            ]),
            'generatorProducts' => $this->productService->byCategorySlug('geradores-fotovoltaicos', 6)->map(fn ($p) => [
                'id' => $p->id,
                'uuid' => $p->uuid,
                'name' => $p->name,
                'slug' => $p->slug,
                'price_cents' => $p->price_cents,
                'compare_at_price_cents' => $p->compare_at_price_cents,
                'has_discount' => $p->hasDiscount(),
                'discount_percent' => $p->discountPercent(),
                'brand_name' => $p->brand?->name,
                'cover_image' => $p->coverImage()?->url(),
            ]),
            'brands' => $this->brandService->allActive()->take(12)->map(fn ($b) => [
                'id' => $b->id,
                'name' => $b->name,
                'logo' => $b->logo,
                'slug' => $b->slug,
            ]),
            'latestPosts' => Post::published()
                ->orderByDesc('published_at')
                ->limit(3)
                ->get(['id', 'title', 'slug', 'excerpt', 'content', 'cover_image', 'published_at'])
                ->map(fn (Post $post) => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'slug' => $post->slug,
                    'excerpt' => $post->excerpt,
                    'cover_image' => $post->cover_image,
                    'published_at' => $post->published_at,
                    'reading_time' => $post->readingTime(),
                ]),
        ]);
    }
}
