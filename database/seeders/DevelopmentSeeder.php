<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeder de desenvolvimento.
 * Cria dados fake para testes locais. NUNCA rodar em produção.
 */
final class DevelopmentSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command->error('DevelopmentSeeder NÃO pode rodar em produção!');

            return;
        }

        $this->call([
            RolesAndPermissionsSeeder::class,
            SettingsSeeder::class,
            CatalogSeeder::class,
        ]);
    }
}
