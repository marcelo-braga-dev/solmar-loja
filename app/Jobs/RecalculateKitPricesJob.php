<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Services\MarginPricingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Reprecifica todos os kits (cost_cents + kit_power_kwp preenchidos) usando as faixas
 * de margem ativas no momento — disparado sempre que uma faixa é criada, editada ou
 * excluída (MarginPricingService::afterChange), para que a mudança de margem reflita
 * nos preços da loja imediatamente, sem esperar a próxima sincronização com o ERP.
 */
final class RecalculateKitPricesJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;

    public int $timeout = 3600;

    public int $tries = 3;

    public function __construct()
    {
        $this->onQueue('sync');
    }

    public function handle(MarginPricingService $pricing): void
    {
        $updated = 0;
        $skipped = 0;

        Product::query()
            ->whereNotNull('kit_power_kwp')
            ->whereNotNull('cost_cents')
            ->chunkById(200, function ($products) use ($pricing, &$updated, &$skipped): void {
                foreach ($products as $product) {
                    $newPriceCents = $pricing->calculateSalePriceCents($product->cost_cents, $product->kit_power_kwp);

                    if ($newPriceCents === null) {
                        $skipped++;

                        continue;
                    }

                    if ($newPriceCents !== $product->price_cents) {
                        $product->update(['price_cents' => $newPriceCents]);
                        $updated++;
                    }
                }
            });

        Log::info('Reprecificação por margem de venda concluída', [
            'updated' => $updated,
            'skipped_no_tier' => $skipped,
        ]);
    }
}
