<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Catalog\Enums\ProductStatus;
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

        // Produtos via Meilisearch Scout
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

        // Categorias via SQL (tree é pequena, pode cachear)
        $categories = Cache::remember('search:categories', 300, fn () => Category::where('is_active', true)->select(['name', 'slug'])->get());
        $filteredCategories = $categories->filter(fn ($c) => str_contains(mb_strtolower($c->name), mb_strtolower($q)))->take(4)->values();

        return response()->json([
            'products'   => $products,
            'categories' => $filteredCategories->map(fn ($c) => ['name' => $c->name, 'slug' => $c->slug]),
        ]);
    }

    public function results(Request $request): Response
    {
        $q       = $request->string('q')->trim()->value();
        $perPage = 24;

        $products = $q
            ? Product::search($q)->where('status', ProductStatus::Published->value)->paginate($perPage)
            : Product::published()->with(['brand:id,name,slug', 'images' => fn ($q) => $q->where('is_cover', true)])->latest('published_at')->paginate($perPage);

        // Eager load para resultados Meilisearch (scout não faz eager load automático)
        if ($q) {
            $products->getCollection()->load(['brand:id,name,slug', 'images' => fn ($q) => $q->where('is_cover', true)]);
        }

        return Inertia::render('Storefront/Search', [
            'q'        => $q,
            'products' => $products->through(fn (Product $p) => [
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
        ]);
    }
}
