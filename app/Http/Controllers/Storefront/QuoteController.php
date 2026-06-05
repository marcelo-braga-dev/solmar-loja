<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Catalog\Models\Product;
use App\Domains\Orders\Models\Quote;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

final class QuoteController extends Controller
{
    public function index(): Response
    {
        $quotes = Quote::where('user_id', Auth::id())
            ->latest()
            ->paginate(10);

        return Inertia::render('Storefront/Account/Quotes', [
            'quotes' => $quotes->through(fn (Quote $q) => [
                'uuid'         => $q->uuid,
                'status'       => $q->status,
                'status_label' => $q->statusLabel(),
                'status_color' => $q->statusColor(),
                'items_count'  => count($q->items ?? []),
                'created_at'   => $q->created_at->format('d/m/Y'),
            ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:120'],
            'email'   => ['required', 'email'],
            'phone'   => ['nullable', 'string', 'max:20'],
            'company' => ['nullable', 'string', 'max:120'],
            'cnpj'    => ['nullable', 'string', 'max:18'],
            'message' => ['nullable', 'string', 'max:1000'],
            'items'   => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.qty'        => ['required', 'integer', 'min:1', 'max:9999'],
        ]);

        // Enriquecer itens com nome e preço
        $productIds = collect($validated['items'])->pluck('product_id');
        $products   = Product::whereIn('id', $productIds)->get()->keyBy('id');

        $items = collect($validated['items'])->map(fn ($item) => [
            'product_id'  => $item['product_id'],
            'name'        => $products[$item['product_id']]?->name ?? 'Produto',
            'sku'         => $products[$item['product_id']]?->sku ?? '',
            'qty'         => $item['qty'],
            'price_cents' => $products[$item['product_id']]?->price_cents ?? 0,
        ])->values()->all();

        $quote = Quote::create([
            'user_id' => Auth::id(),
            'name'    => $validated['name'],
            'email'   => $validated['email'],
            'phone'   => $validated['phone'] ?? null,
            'company' => $validated['company'] ?? null,
            'cnpj'    => $validated['cnpj'] ?? null,
            'message' => $validated['message'] ?? null,
            'items'   => $items,
            'status'  => 'pending',
        ]);

        // Notificar admin
        try {
            \App\Models\User::role('admin')->each(function ($admin) use ($quote): void {
                $admin->notify(new \App\Notifications\NewQuoteNotification($quote));
            });
        } catch (\Throwable) {}

        return response()->json([
            'success' => true,
            'message' => 'Cotação enviada! Nossa equipe entrará em contato em até 24h úteis.',
            'uuid'    => $quote->uuid,
        ]);
    }
}
