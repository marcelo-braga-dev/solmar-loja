<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Catalog\Models\Category;
use App\Domains\Settings\Models\MenuItem;
use Illuminate\Database\Seeder;

final class MenuItemSeeder extends Seeder
{
    public function run(): void
    {
        $categorySlugs = [
            'energia-solar',
            'geradores-fotovoltaicos',
            'paineis-modulos-solares',
            'inversores',
            'baterias-e-armazenamento',
            'mobilidade-eletrica',
        ];

        $position = 0;

        foreach ($categorySlugs as $slug) {
            $category = Category::where('slug', $slug)->first();

            if ($category === null) {
                continue;
            }

            MenuItem::firstOrCreate(
                ['type' => 'category', 'category_id' => $category->id],
                ['label' => $category->name, 'position' => $position, 'is_active' => true],
            );

            $position++;
        }

        $pages = [
            'kit_builder' => '🔧 Monte seu Kit',
            'simulator'   => '☀ Simulador',
            'blog'        => 'Blog',
        ];

        foreach ($pages as $key => $label) {
            MenuItem::firstOrCreate(
                ['type' => 'page', 'page_key' => $key],
                ['label' => $label, 'position' => $position, 'is_active' => true],
            );

            $position++;
        }
    }
}
