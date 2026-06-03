<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Category;
use App\Domains\Catalog\Models\Product;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

final class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $sitemap = Cache::remember('sitemap', 3600, function (): string {
            $categories = Category::where('is_active', true)->select(['slug', 'updated_at'])->get();
            $products   = Product::where('status', ProductStatus::Published)->select(['slug', 'updated_at'])->get();

            return view('sitemap.xml', compact('categories', 'products'))->render();
        });

        return response($sitemap, 200, ['Content-Type' => 'application/xml']);
    }
}
