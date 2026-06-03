<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeder seguro para produção.
 * Roda apenas dados estruturais: roles, permissões, configurações e categorias.
 * Nunca cria usuários de teste, produtos fake ou dados sensíveis.
 */
final class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            SettingsSeeder::class,
            ProductionCategoriesSeeder::class,
        ]);
    }
}
