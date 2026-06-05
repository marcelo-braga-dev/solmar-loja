<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Catalog\Models\PriceList;
use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Models\ProductPrice;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class PriceListController extends Controller
{
    public function index(): Response
    {
        $lists = PriceList::withCount('productPrices')
            ->orderBy('discount_percent')
            ->get()
            ->map(fn (PriceList $l) => [
                'id'                    => $l->id,
                'name'                  => $l->name,
                'code'                  => $l->code,
                'description'           => $l->description,
                'type'                  => $l->type,
                'type_label'            => $l->typeLabel(),
                'discount_percent'      => $l->discount_percent,
                'is_default'            => $l->is_default,
                'is_active'             => $l->is_active,
                'is_public'             => $l->is_public,
                'product_prices_count'  => $l->product_prices_count,
                'valid_from'            => $l->valid_from?->format('d/m/Y'),
                'valid_until'           => $l->valid_until?->format('d/m/Y'),
            ]);

        return Inertia::render('Admin/PriceLists/Index', [
            'lists' => $lists,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:80'],
            'code'             => ['required', 'string', 'max:20', 'unique:price_lists,code'],
            'description'      => ['nullable', 'string', 'max:300'],
            'type'             => ['required', 'in:retail,consultant,wholesale,special'],
            'discount_percent' => ['required', 'integer', 'min:0', 'max:100'],
            'is_active'        => ['boolean'],
            'is_public'        => ['boolean'],
            'valid_from'       => ['nullable', 'date'],
            'valid_until'      => ['nullable', 'date', 'after:valid_from'],
        ]);

        PriceList::create($validated);

        return back()->with('success', 'Tabela de preço criada.');
    }

    public function update(Request $request, PriceList $priceList): RedirectResponse
    {
        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:80'],
            'description'      => ['nullable', 'string', 'max:300'],
            'type'             => ['required', 'in:retail,consultant,wholesale,special'],
            'discount_percent' => ['required', 'integer', 'min:0', 'max:100'],
            'is_active'        => ['boolean'],
            'is_public'        => ['boolean'],
            'valid_from'       => ['nullable', 'date'],
            'valid_until'      => ['nullable', 'date'],
        ]);

        $priceList->update($validated);

        return back()->with('success', 'Tabela de preço atualizada.');
    }

    public function destroy(PriceList $priceList): RedirectResponse
    {
        if ($priceList->is_default) {
            return back()->with('error', 'A tabela padrão não pode ser excluída.');
        }

        $priceList->productPrices()->delete();
        $priceList->delete();

        return back()->with('success', 'Tabela excluída.');
    }

    /** Define preço customizado de um produto em uma tabela */
    public function setProductPrice(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id'       => ['required', 'integer', 'exists:products,id'],
            'price_list_id'    => ['required', 'integer', 'exists:price_lists,id'],
            'price_cents'      => ['required', 'integer', 'min:0'],
            'compare_at_cents' => ['nullable', 'integer', 'min:0'],
        ]);

        $price = ProductPrice::updateOrCreate(
            ['product_id' => $validated['product_id'], 'price_list_id' => $validated['price_list_id']],
            ['price_cents' => $validated['price_cents'], 'compare_at_cents' => $validated['compare_at_cents'] ?? null]
        );

        return response()->json(['success' => true, 'price' => $price]);
    }

    /** Remove preço customizado (volta a usar o desconto % da tabela) */
    public function removeProductPrice(Request $request): JsonResponse
    {
        ProductPrice::where('product_id', $request->integer('product_id'))
            ->where('price_list_id', $request->integer('price_list_id'))
            ->delete();

        return response()->json(['success' => true]);
    }

    /** Retorna todos os preços de um produto em todas as tabelas */
    public function productPrices(Product $product): JsonResponse
    {
        $lists = PriceList::active()->get();

        $prices = $lists->map(fn (PriceList $list) => [
            'list_id'        => $list->id,
            'list_name'      => $list->name,
            'list_code'      => $list->code,
            'discount_pct'   => $list->discount_percent,
            'base_price'     => $list->applyTo($product->price_cents),
            'custom_price'   => $product->prices()->where('price_list_id', $list->id)->first()?->price_cents,
            'effective_price'=> $product->priceForList($list->id),
        ]);

        return response()->json([
            'public_price' => $product->price_cents,
            'prices'       => $prices,
        ]);
    }
}
