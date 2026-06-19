<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Catalog\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seed apenas as categorias do catálogo para produção.
 * Não cria produtos, marcas nem usuários de teste.
 */
final class ProductionCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $tree = [
            ['name' => 'Geradores Fotovoltaicos', 'icon' => 'bolt'],
            ['name' => 'Energia Solar', 'icon' => 'solar_power', 'children' => [
                ['name' => 'Kits Fotovoltaicos', 'icon' => 'inventory', 'children' => [
                    ['name' => 'Kits On Grid'],
                    ['name' => 'Kits Off Grid'],
                    ['name' => 'Kits Híbridos'],
                ]],
                ['name' => 'Painéis / Módulos Solares', 'icon' => 'wb_sunny'],
                ['name' => 'Inversores', 'icon' => 'electrical_services', 'children' => [
                    ['name' => 'Inversores String'],
                    ['name' => 'Inversores Micro'],
                    ['name' => 'Inversores Híbridos'],
                ]],
                ['name' => 'Baterias e Armazenamento', 'icon' => 'battery_charging_full', 'children' => [
                    ['name' => 'Baterias Estacionárias'],
                    ['name' => 'Baterias de Lítio'],
                ]],
                ['name' => 'Estruturas de Fixação', 'icon' => 'home'],
                ['name' => 'Cabos e Conectores', 'icon' => 'cable'],
                ['name' => 'Protetores e Dispositivos', 'icon' => 'security'],
                ['name' => 'Monitoramento', 'icon' => 'monitoring'],
            ]],
            ['name' => 'Mobilidade Elétrica', 'icon' => 'electric_bike', 'children' => [
                ['name' => 'Bicicletas Elétricas'],
                ['name' => 'Patinetes Elétricos'],
                ['name' => 'Carregadores Veiculares'],
            ]],
            ['name' => 'Produtos Elétricos', 'icon' => 'electrical_services', 'children' => [
                ['name' => 'Iluminação LED'],
                ['name' => 'Geradores'],
                ['name' => 'No-Breaks / UPS'],
            ]],
        ];

        $this->createCategoryTree($tree, null, 0);

        $this->command->info('Categorias criadas com sucesso.');
    }

    /** @param array<int, array<string, mixed>> $items */
    private function createCategoryTree(array $items, ?int $parentId, int $depth): void
    {
        foreach ($items as $position => $item) {
            $slug = Str::slug($item['name']);
            $existing = Category::where('slug', $slug)->first();

            if ($existing) {
                if (! empty($item['children'])) {
                    $this->createCategoryTree($item['children'], $existing->id, $depth + 1);
                }

                continue;
            }

            $category = Category::create([
                'name' => $item['name'],
                'slug' => $slug,
                'parent_id' => $parentId,
                'icon' => $item['icon'] ?? null,
                'position' => $position,
                'is_active' => true,
                'depth' => $depth,
            ]);

            if (! empty($item['children'])) {
                $this->createCategoryTree($item['children'], $category->id, $depth + 1);
            }
        }
    }
}
