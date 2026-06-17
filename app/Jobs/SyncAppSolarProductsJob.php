<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domains\Integrations\Services\AppSolarProductSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

final class SyncAppSolarProductsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $timeout = 7200; // 2h — catálogo do AppSolar pode ter dezenas de milhares de SKUs

    public int $tries = 3;

    public int $backoff = 600; // 10 min entre tentativas

    public function __construct(private readonly bool $full = false)
    {
        $this->onQueue('sync');
    }

    public function handle(AppSolarProductSyncService $syncService): void
    {
        Log::info('Sincronização de produtos AppSolar iniciada', ['full' => $this->full]);

        $results = $this->full ? $syncService->syncFull() : $syncService->syncIncremental();

        Log::info('Sincronização de produtos AppSolar concluída', $results);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('SyncAppSolarProductsJob falhou definitivamente', ['error' => $exception->getMessage()]);
    }
}
