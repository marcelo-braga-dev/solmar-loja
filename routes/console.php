<?php

declare(strict_types=1);

use App\Jobs\AbandonedCartRecoveryJob;
use App\Jobs\SyncInventoryJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Sincronização diária de estoque às 3h
Schedule::job(new SyncInventoryJob())->dailyAt('03:00')->name('sync-inventory')->withoutOverlapping();

// Artisan manual para disparar sync imediatamente
Artisan::command('inventory:sync', function () {
    $this->info('Disparando sincronização de estoque...');
    SyncInventoryJob::dispatch();
    $this->info('Job despachado para a fila "sync".');
})->purpose('Dispatch inventory sync job');

// Recuperação de carrinhos abandonados — a cada hora
Schedule::job(new AbandonedCartRecoveryJob())->hourly()->name('abandoned-cart-recovery')->withoutOverlapping();

// Limpar expirations (reservas vencidas, etc.)
Schedule::command('queue:prune-failed --hours=72')->daily();
