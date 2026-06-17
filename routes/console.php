<?php

declare(strict_types=1);

use App\Jobs\AbandonedCartRecoveryJob;
use App\Jobs\SyncAppSolarProductsJob;
use App\Jobs\SyncInventoryJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Sincronização diária de estoque às 3h
Schedule::job(new SyncInventoryJob)->dailyAt('03:00')->name('sync-inventory')->withoutOverlapping();

// Artisan manual para disparar sync imediatamente
Artisan::command('inventory:sync', function () {
    $this->info('Disparando sincronização de estoque...');
    SyncInventoryJob::dispatch();
    $this->info('Job despachado para a fila "sync".');
})->purpose('Dispatch inventory sync job');

// Sincronização completa do catálogo AppSolar (Edeltec) — diária, 02:00, antes do sync de estoque
Schedule::job(new SyncAppSolarProductsJob(full: true))
    ->dailyAt('02:00')
    ->name('sync-appsolar-products-full')
    ->withoutOverlapping();

// Sincronização incremental (delta) — de hora em hora, captura mudanças de preço/disponibilidade
Schedule::job(new SyncAppSolarProductsJob(full: false))
    ->hourly()
    ->name('sync-appsolar-products-incremental')
    ->withoutOverlapping();

Artisan::command('appsolar:sync {--full : Roda sincronização completa em vez de incremental}', function () {
    $full = (bool) $this->option('full');
    $this->info($full ? 'Disparando sincronização completa do AppSolar...' : 'Disparando sincronização incremental do AppSolar...');
    SyncAppSolarProductsJob::dispatch($full);
    $this->info('Job despachado para a fila "sync".');
})->purpose('Dispatch AppSolar products sync');

// Recuperação de carrinhos abandonados — a cada hora
Schedule::job(new AbandonedCartRecoveryJob)->hourly()->name('abandoned-cart-recovery')->withoutOverlapping();

// Limpar expirations (reservas vencidas, etc.)
Schedule::command('queue:prune-failed --hours=72')->daily();
