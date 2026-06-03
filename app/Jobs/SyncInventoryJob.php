<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domains\Inventory\Services\InventorySyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

final class SyncInventoryJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $timeout  = 3600; // 1 hora
    public int $tries    = 3;
    public int $backoff  = 300; // 5 min entre tentativas

    public function __construct()
    {
        $this->onQueue('sync');
    }

    public function handle(InventorySyncService $syncService): void
    {
        Log::info('Sincronização de estoque iniciada');

        $results = $syncService->sync();

        Log::info('Sincronização concluída', $results);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('SyncInventoryJob falhou definitivamente', ['error' => $exception->getMessage()]);
    }
}
