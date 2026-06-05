<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Catalog\Models\Product;
use App\Domains\Inventory\Services\StockAlertService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class StockAlertController extends Controller
{
    public function __construct(
        private readonly StockAlertService $service,
    ) {}

    public function subscribe(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name'  => ['nullable', 'string', 'max:100'],
        ]);

        $alert = $this->service->subscribe($product, $validated['email'], $validated['name'] ?? null);

        $wasNew = $alert->wasRecentlyCreated;

        return response()->json([
            'success' => true,
            'message' => $wasNew
                ? 'Ótimo! Você será notificado quando o produto estiver disponível.'
                : 'Você já está na lista de espera para este produto.',
        ]);
    }

    public function unsubscribe(string $token): RedirectResponse
    {
        $this->service->unsubscribe($token);

        return redirect('/')->with('success', 'Você foi removido da lista de alertas de estoque.');
    }
}
