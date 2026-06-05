<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Category;
use App\Domains\Catalog\Models\Product;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class KitBuilderController extends Controller
{
    public function index(): Response
    {
        // Buscar painéis solares publicados
        $panelCat = Category::where('slug', 'paineis-modulos-solares')->first();

        $panels = Product::query()
            ->published()
            ->with(['brand', 'images'])
            ->when($panelCat, fn ($q) => $q->whereHas('categories', fn ($c) => $c->where('categories.id', $panelCat->id)))
            ->orderBy('price_cents')
            ->take(20)
            ->get()
            ->map(fn (Product $p) => $this->mapProduct($p, ['power_w']));

        return Inertia::render('Storefront/KitBuilder', [
            'panels' => $panels,
        ]);
    }

    /** Retorna inversores compatíveis com o painel selecionado */
    public function inverters(Request $request): JsonResponse
    {
        $panelId = $request->integer('panel_id');
        $panel   = Product::find($panelId);

        if (! $panel) {
            return response()->json(['inverters' => []]);
        }

        $panelPowerW = $this->extractSpec($panel, 'Potência', 'power_w');

        $inverterCat = Category::where('slug', 'inversores')->first();

        $inverters = Product::query()
            ->published()
            ->with(['brand', 'images'])
            ->when($inverterCat, fn ($q) => $q->whereHas('categories', fn ($c) => $c->where('categories.id', $inverterCat->id)))
            ->orderBy('price_cents')
            ->take(15)
            ->get()
            ->map(fn (Product $p) => $this->mapProduct($p, ['power_kw']));

        return response()->json(['inverters' => $inverters]);
    }

    /** Retorna estruturas e cabos */
    public function accessories(Request $request): JsonResponse
    {
        $estruturaCat = Category::where('slug', 'estruturas-de-fixacao')->first();
        $cableCat     = Category::where('slug', 'cabos-e-conectores')->first();

        $estruturas = Product::query()
            ->published()
            ->with(['brand', 'images'])
            ->when($estruturaCat, fn ($q) => $q->whereHas('categories', fn ($c) => $c->where('categories.id', $estruturaCat->id)))
            ->orderBy('price_cents')
            ->take(6)
            ->get()
            ->map(fn ($p) => $this->mapProduct($p, []));

        $cabos = Product::query()
            ->published()
            ->with(['brand', 'images'])
            ->when($cableCat, fn ($q) => $q->whereHas('categories', fn ($c) => $c->where('categories.id', $cableCat->id)))
            ->orderBy('price_cents')
            ->take(6)
            ->get()
            ->map(fn ($p) => $this->mapProduct($p, []));

        return response()->json([
            'estruturas' => $estruturas,
            'cabos'      => $cabos,
        ]);
    }

    /** @param array<string> $specKeys */
    private function mapProduct(Product $p, array $specKeys): array
    {
        return [
            'id'          => $p->id,
            'name'        => $p->name,
            'slug'        => $p->slug,
            'sku'         => $p->sku,
            'price_cents' => $p->price_cents,
            'has_discount'=> $p->hasDiscount(),
            'brand_name'  => $p->brand?->name,
            'cover_image' => $p->coverImage()?->url(),
            'specifications' => $p->specifications ?? [],
        ];
    }

    private function extractSpec(Product $product, string $key, string $fallback): ?float
    {
        $specs = $product->specifications ?? [];
        foreach ($specs as $k => $v) {
            if (str_contains(strtolower($k), strtolower($key))) {
                return (float) preg_replace('/[^\d.]/', '', $v);
            }
        }

        return null;
    }
}
