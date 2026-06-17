<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Brand;
use App\Domains\Catalog\Models\Category;
use App\Domains\Catalog\Models\Product;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

final class SearchController extends Controller
{
    public function autocomplete(Request $request): JsonResponse
    {
        $q = $request->string('q')->trim()->value();

        if (strlen($q) < 2) {
            return response()->json(['products' => [], 'categories' => []]);
        }

        $productCollection = Product::search($q)
            ->where('status', ProductStatus::Published->value)
            ->take(6)
            ->get();

        $productCollection->load(['images' => fn ($q) => $q->where('is_cover', true)]);

        $products = $productCollection->map(fn (Product $p) => [
            'name'        => $p->name,
            'slug'        => $p->slug,
            'price_cents' => $p->price_cents,
            'cover_image' => $p->coverImage()?->url(),
        ]);

        $categories = Cache::remember('search:categories', 300, fn () => Category::where('is_active', true)->select(['name', 'slug'])->get());
        $filteredCategories = $categories->filter(fn ($c) => str_contains(mb_strtolower($c->name), mb_strtolower($q)))->take(4)->values();

        return response()->json([
            'products'   => $products,
            'categories' => $filteredCategories->map(fn ($c) => ['name' => $c->name, 'slug' => $c->slug]),
        ]);
    }

    public function results(Request $request): Response
    {
        $q        = $request->string('q')->trim()->value();
        $onSale   = $request->boolean('on_sale');
        $inStock  = $request->boolean('in_stock');
        $brandId  = $request->integer('brand') ?: null;
        $priceMin = $request->integer('price_min') ?: null;
        $priceMax = $request->integer('price_max') ?: null;
        $sortBy   = $request->string('sort')->value() ?: 'relevance';
        $perPage  = 24;

        if ($q) {
            $query    = Product::search($q)->where('status', ProductStatus::Published->value);
            $products = $query->paginate($perPage);
            $products->getCollection()->load(['brand:id,name,slug', 'images' => fn ($q) => $q->where('is_cover', true)]);

            $collection = $products->getCollection();
            if ($onSale) {
                $collection = $collection->filter(fn (Product $p) => $p->hasDiscount());
            }
            if ($brandId) {
                $collection = $collection->filter(fn (Product $p) => $p->brand_id === $brandId);
            }
            if ($priceMin) {
                $collection = $collection->filter(fn (Product $p) => $p->price_cents >= $priceMin);
            }
            if ($priceMax) {
                $collection = $collection->filter(fn (Product $p) => $p->price_cents <= $priceMax);
            }
            $products->setCollection($collection->values());
        } else {
            $query = Product::published()->with(['brand:id,name,slug', 'images' => fn ($q) => $q->where('is_cover', true)]);

            if ($onSale) {
                $query->whereNotNull('compare_at_price_cents')->whereColumn('price_cents', '<', 'compare_at_price_cents');
            }
            if ($inStock) {
                $query->whereExists(fn ($sub) => $sub->from('stocks')
                    ->whereColumn('stocks.product_id', 'products.id')
                    ->whereNull('stocks.variant_id')
                    ->where('stocks.quantity_available', '>', 0)
                );
            }
            if ($brandId) {
                $query->where('brand_id', $brandId);
            }
            if ($priceMin) {
                $query->where('price_cents', '>=', $priceMin);
            }
            if ($priceMax) {
                $query->where('price_cents', '<=', $priceMax);
            }

            $query->orderBy(
                match ($sortBy) {
                    'price_asc', 'price_desc' => 'price_cents',
                    default                   => 'published_at',
                },
                match ($sortBy) {
                    'price_asc' => 'asc',
                    default     => 'desc',
                }
            );

            $products = $query->paginate($perPage);
        }

        $brands = Brand::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Storefront/Search', [
            'q'         => $q,
            'on_sale'   => $onSale,
            'in_stock'  => $inStock,
            'brand'     => $brandId,
            'price_min' => $priceMin,
            'price_max' => $priceMax,
            'sort'      => $sortBy === 'relevance' ? null : $sortBy,
            'brands'    => $brands->map(fn ($b) => ['id' => $b->id, 'name' => $b->name]),
            'products'  => $products->through(fn (Product $p) => [
                'id'                     => $p->id,
                'name'                   => $p->name,
                'slug'                   => $p->slug,
                'price_cents'            => $p->price_cents,
                'compare_at_price_cents' => $p->compare_at_price_cents,
                'has_discount'           => $p->hasDiscount(),
                'discount_percent'       => $p->discountPercent(),
                'featured'               => $p->featured,
                'brand_name'             => $p->brand?->name,
                'cover_image'            => $p->coverImage()?->url(),
            ]),
        ]);
    }
}
