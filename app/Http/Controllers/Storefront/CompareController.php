<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Catalog\Models\Product;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class CompareController extends Controller
{
    public function index(Request $request): Response
    {
        $ids = collect(explode(',', $request->string('ids')->value()))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->take(4)
            ->values();

        $products = Product::query()
            ->with(['brand', 'images', 'categories'])
            ->whereIn('id', $ids)
            ->published()
            ->get()
            ->map(fn (Product $p) => [
                'id'                     => $p->id,
                'name'                   => $p->name,
                'slug'                   => $p->slug,
                'sku'                    => $p->sku,
                'price_cents'            => $p->price_cents,
                'compare_at_price_cents' => $p->compare_at_price_cents,
                'has_discount'           => $p->hasDiscount(),
                'discount_percent'       => $p->discountPercent(),
                'cover_image'            => $p->coverImage()?->url(),
                'brand_name'             => $p->brand?->name,
                'weight_grams'           => $p->weight_grams,
                'specifications'         => $p->specifications ?? [],
                'short_description'      => $p->short_description,
                'in_stock'               => DB::table('stocks')
                    ->where('product_id', $p->id)
                    ->sum('quantity_available') > 0,
            ]);

        return Inertia::render('Storefront/Compare', [
            'products' => $products,
        ]);
    }
}
