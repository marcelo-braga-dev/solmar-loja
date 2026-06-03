<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Catalog\Models\Product;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::query()
            ->with(['brand', 'images'])
            ->withCount('variants')
            ->when($request->string('q')->value(), fn ($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('sku', 'like', "%{$s}%"))
            ->whereIn('status', ['published', 'draft'])
            ->latest()
            ->paginate(30);

        return Inertia::render('Admin/Inventory/Index', [
            'products' => $products->through(fn (Product $p) => [
                'id'          => $p->id,
                'uuid'        => $p->uuid,
                'name'        => $p->name,
                'sku'         => $p->sku,
                'status'      => $p->status->value,
                'status_label' => $p->status->label(),
                'status_color' => $p->status->color(),
                'brand'       => $p->brand?->name,
                'cover_image' => $p->coverImage()?->url(),
            ]),
            'filters' => $request->only(['q']),
        ]);
    }

    public function adjust(Request $request): RedirectResponse
    {
        $request->validate([
            'product_id'  => ['required', 'integer', 'exists:products,id'],
            'quantity'    => ['required', 'integer'],
            'reason'      => ['required', 'string', 'max:255'],
            'warehouse_id' => ['nullable', 'integer'],
        ]);

        // Registra movimentação de estoque
        \DB::table('stock_movements')->insert([
            'product_id'   => $request->integer('product_id'),
            'warehouse_id' => $request->integer('warehouse_id', 1),
            'type'         => $request->integer('quantity') > 0 ? 'in' : 'out',
            'quantity'     => $request->integer('quantity'),
            'reason'       => $request->string('reason')->value(),
            'user_id'      => Auth::id(),
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        // Atualiza saldo no stock
        \DB::table('stocks')->updateOrInsert(
            ['product_id' => $request->integer('product_id'), 'warehouse_id' => $request->integer('warehouse_id', 1), 'variant_id' => null],
            ['quantity_available' => \DB::raw("quantity_available + {$request->integer('quantity')}"), 'updated_at' => now()]
        );

        return back()->with('success', 'Estoque ajustado com sucesso.');
    }
}
