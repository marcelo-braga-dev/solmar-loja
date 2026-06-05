<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Catalog\Models\Product;
use App\Domains\Marketing\Models\FlashSale;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class FlashSaleController extends Controller
{
    public function index(): Response
    {
        $flashSales = FlashSale::with('product:id,name,uuid')
            ->orderByDesc('starts_at')
            ->paginate(20);

        return Inertia::render('Admin/FlashSales/Index', [
            'flashSales' => $flashSales->through(fn (FlashSale $f) => [
                'id'               => $f->id,
                'title'            => $f->title,
                'product_name'     => $f->product?->name ?? 'Todos com desconto',
                'product_uuid'     => $f->product?->uuid,
                'discount_percent' => $f->discount_percent,
                'max_quantity'     => $f->max_quantity,
                'sold_count'       => $f->sold_count,
                'starts_at'        => $f->starts_at->format('d/m/Y H:i'),
                'ends_at'          => $f->ends_at->format('d/m/Y H:i'),
                'is_active'        => $f->is_active,
                'is_running'       => $f->isRunning(),
                'remaining_s'      => $f->remainingSeconds(),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title'            => ['required', 'string', 'max:120'],
            'product_id'       => ['nullable', 'integer', 'exists:products,id'],
            'discount_percent' => ['required', 'integer', 'min:1', 'max:90'],
            'max_quantity'     => ['nullable', 'integer', 'min:1'],
            'starts_at'        => ['required', 'date'],
            'ends_at'          => ['required', 'date', 'after:starts_at'],
        ]);

        FlashSale::create($validated);

        return back()->with('success', 'Flash Sale criada com sucesso!');
    }

    public function toggle(FlashSale $flashSale): RedirectResponse
    {
        $flashSale->update(['is_active' => ! $flashSale->is_active]);

        return back()->with('success', $flashSale->is_active ? 'Flash Sale ativada.' : 'Flash Sale desativada.');
    }

    public function destroy(FlashSale $flashSale): RedirectResponse
    {
        $flashSale->delete();

        return back()->with('success', 'Flash Sale excluída.');
    }

    /** Endpoint público para buscar flash sale ativa de um produto */
    public function activeForProduct(Product $product): \Illuminate\Http\JsonResponse
    {
        $flash = FlashSale::active()
            ->where(function ($q) use ($product): void {
                $q->where('product_id', $product->id)->orWhereNull('product_id');
            })
            ->first();

        if (! $flash || ! $flash->hasStock()) {
            return response()->json(['active' => false]);
        }

        return response()->json([
            'active'           => true,
            'title'            => $flash->title,
            'discount_percent' => $flash->discount_percent,
            'remaining_s'      => $flash->remainingSeconds(),
            'max_quantity'     => $flash->max_quantity,
            'sold_count'       => $flash->sold_count,
            'progress_percent' => $flash->progressPercent(),
        ]);
    }
}
