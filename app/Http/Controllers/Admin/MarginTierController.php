<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Catalog\Models\MarginTier;
use App\Domains\Catalog\Services\MarginPricingService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMarginTierRequest;
use App\Http\Requests\Admin\UpdateMarginTierRequest;
use App\Jobs\RecalculateKitPricesJob;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class MarginTierController extends Controller
{
    public function __construct(
        private readonly MarginPricingService $pricing,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/MarginTiers/Index', [
            'tiers' => $this->pricing->paginate(50)->through(fn (MarginTier $tier) => [
                'id' => $tier->id,
                'min_kwp' => $tier->min_kwp,
                'max_kwp' => $tier->max_kwp,
                'margin_percent' => $tier->margin_percent,
                'is_active' => $tier->is_active,
            ]),
            'hasActiveTiers' => $this->pricing->activeTiers()->isNotEmpty(),
            'recalculationLogs' => $this->recalculationLogs(),
        ]);
    }

    /** @return array<int, array<string, mixed>> */
    private function recalculationLogs(): array
    {
        return DB::table('sync_logs')
            ->where('source', RecalculateKitPricesJob::LOG_SOURCE)
            ->orderByDesc('started_at')
            ->limit(10)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'status' => $log->status,
                'status_label' => match ($log->status) {
                    'success' => 'Concluído',
                    'failed' => 'Falhou',
                    'running' => 'Processando...',
                    default => $log->status,
                },
                'started_at' => $log->started_at,
                'finished_at' => $log->finished_at,
                'updated_items' => $log->updated_items,
                'total_items' => $log->total_items,
                'notes' => $log->notes,
                'errors' => $log->errors,
            ])
            ->all();
    }

    public function store(StoreMarginTierRequest $request): RedirectResponse
    {
        $this->pricing->create($request->toData());

        return back()->with('success', 'Faixa de margem criada. Recalculando preços dos kits...');
    }

    public function update(UpdateMarginTierRequest $request, MarginTier $marginTier): RedirectResponse
    {
        $this->pricing->update($marginTier, $request->toData());

        return back()->with('success', 'Faixa de margem atualizada. Recalculando preços dos kits...');
    }

    public function destroy(MarginTier $marginTier): RedirectResponse
    {
        $this->pricing->delete($marginTier);

        return back()->with('success', 'Faixa de margem excluída. Recalculando preços dos kits...');
    }

    public function recalculate(): RedirectResponse
    {
        RecalculateKitPricesJob::dispatch();

        return back()->with('success', 'Recálculo de preços disparado — os kits serão atualizados em instantes.');
    }
}
