<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Services\MarginPricingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

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

    /** Identifica esta rotina no histórico compartilhado `sync_logs` (mesma tabela do ERP/AppSolar). */
    public const LOG_SOURCE = 'margin_recalculation';

    public int $timeout = 3600;

    public int $tries = 3;

    public function __construct()
    {
        $this->onQueue('sync');
    }

    public function handle(MarginPricingService $pricing): void
    {
        $logId = DB::table('sync_logs')->insertGetId([
            'source' => self::LOG_SOURCE,
            'started_at' => now(),
            'status' => 'running',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $updated = 0;
        $unchanged = 0;
        $skippedNoTier = 0;

        try {
            Product::query()
                ->whereNotNull('kit_power_kwp')
                ->whereNotNull('cost_cents')
                ->chunkById(200, function ($products) use ($pricing, &$updated, &$unchanged, &$skippedNoTier): void {
                    foreach ($products as $product) {
                        $newPriceCents = $pricing->calculateSalePriceCents($product->cost_cents, $product->kit_power_kwp);

                        if ($newPriceCents === null) {
                            $skippedNoTier++;

                            continue;
                        }

                        // A maioria dos kits já chega com o preço certo (o sync com o ERP aplica a
                        // mesma margem ao gravar price_cents) — este job só precisa tocar os que
                        // ficaram desatualizados por uma mudança de faixa depois do último sync.
                        if ($newPriceCents !== $product->price_cents) {
                            $product->update(['price_cents' => $newPriceCents]);
                            $updated++;
                        } else {
                            $unchanged++;
                        }
                    }
                });

            $total = $updated + $unchanged + $skippedNoTier;

            $notes = array_filter([
                $unchanged > 0 ? "{$unchanged} kit(s) já estavam com o preço correto" : null,
                $skippedNoTier > 0 ? "{$skippedNoTier} kit(s) fora de qualquer faixa de margem ativa" : null,
            ]);

            DB::table('sync_logs')->where('id', $logId)->update([
                'status' => 'success',
                'finished_at' => now(),
                'total_items' => $total,
                'updated_items' => $updated,
                'notes' => $notes !== [] ? implode(' · ', $notes).'.' : null,
                'updated_at' => now(),
            ]);

            Log::info('Reprecificação por margem de venda concluída', [
                'updated' => $updated,
                'unchanged' => $unchanged,
                'skipped_no_tier' => $skippedNoTier,
            ]);
        } catch (Throwable $e) {
            DB::table('sync_logs')->where('id', $logId)->update([
                'status' => 'failed',
                'finished_at' => now(),
                'total_items' => $updated + $unchanged + $skippedNoTier,
                'updated_items' => $updated,
                'error_items' => 1,
                'errors' => json_encode(['fatal' => $e->getMessage()]),
                'updated_at' => now(),
            ]);

            Log::error('Reprecificação por margem de venda falhou', ['error' => $e->getMessage()]);

            throw $e;
        }
    }
}
