<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Product;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class BulkProductController extends Controller
{
    public function bulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action'  => ['required', 'in:publish,archive,delete,feature,unfeature'],
            'ids'     => ['required', 'array', 'min:1', 'max:100'],
            'ids.*'   => ['integer'],
        ]);

        $ids    = $validated['ids'];
        $action = $validated['action'];

        $products = Product::whereIn('id', $ids)->get();
        $count    = $products->count();

        match ($action) {
            'publish'   => $products->each(fn ($p) => $p->update(['status' => ProductStatus::Published, 'published_at' => $p->published_at ?? now()])),
            'archive'   => $products->each(fn ($p) => $p->update(['status' => ProductStatus::Archived])),
            'delete'    => $products->each(fn ($p) => $p->delete()),
            'feature'   => Product::whereIn('id', $ids)->update(['featured' => true]),
            'unfeature' => Product::whereIn('id', $ids)->update(['featured' => false]),
        };

        $label = match ($action) {
            'publish'   => 'publicados',
            'archive'   => 'arquivados',
            'delete'    => 'excluídos',
            'feature'   => 'marcados como destaque',
            'unfeature' => 'removidos do destaque',
        };

        return response()->json([
            'success' => true,
            'message' => "{$count} produto(s) {$label} com sucesso.",
            'count'   => $count,
        ]);
    }
}
