<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Telescope apenas quando habilitado
        if (config('telescope.enabled') && class_exists(\Laravel\Telescope\TelescopeServiceProvider::class)) {
            $this->app->register(TelescopeServiceProvider::class);
        }
    }

    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());

        // Models live under App\Domains\{Domain}\Models, mas factories ficam
        // todas em Database\Factories — resolução padrão não bate por causa
        // do namespace aninhado de domínio.
        Factory::guessFactoryNamesUsing(
            fn (string $modelName): string => 'Database\\Factories\\'.class_basename($modelName).'Factory'
        );

        if ($this->app->environment('local')) {
            DB::listen(function (object $query): void {
                if ($query->time > 1000) {
                    logger()->warning('Slow query detected', [
                        'sql' => $query->sql,
                        'bindings' => $query->bindings,
                        'time_ms' => $query->time,
                    ]);
                }
            });
        }
    }
}
