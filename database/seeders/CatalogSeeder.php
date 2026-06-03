<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Brand;
use App\Domains\Catalog\Models\Category;
use App\Domains\Catalog\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedCategories();
        $this->seedBrands();
        $this->seedProducts();
    }

    private function seedCategories(): void
    {
        $tree = [
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
    }

    /** @param array<int, array<string, mixed>> $items */
    private function createCategoryTree(array $items, ?int $parentId, int $depth): void
    {
        foreach ($items as $position => $item) {
            $category = Category::create([
                'name'      => $item['name'],
                'slug'      => Str::slug($item['name']),
                'parent_id' => $parentId,
                'icon'      => $item['icon'] ?? null,
                'position'  => $position,
                'is_active' => true,
                'depth'     => $depth,
            ]);

            if (! empty($item['children'])) {
                $this->createCategoryTree($item['children'], $category->id, $depth + 1);
            }
        }
    }

    private function seedBrands(): void
    {
        $brands = [
            ['name' => 'Canadian Solar', 'slug' => 'canadian-solar'],
            ['name' => 'Jinko Solar', 'slug' => 'jinko-solar'],
            ['name' => 'LONGi Solar', 'slug' => 'longi-solar'],
            ['name' => 'BYD', 'slug' => 'byd'],
            ['name' => 'Growatt', 'slug' => 'growatt'],
            ['name' => 'Fronius', 'slug' => 'fronius'],
            ['name' => 'SMA', 'slug' => 'sma'],
            ['name' => 'Deye', 'slug' => 'deye'],
            ['name' => 'WEG', 'slug' => 'weg'],
            ['name' => 'Intelbras', 'slug' => 'intelbras'],
            ['name' => 'Huawei', 'slug' => 'huawei'],
            ['name' => 'ABB', 'slug' => 'abb'],
        ];

        foreach ($brands as $brand) {
            Brand::create([...$brand, 'is_active' => true]);
        }
    }

    private function seedProducts(): void
    {
        $panelCategory = Category::where('slug', 'paineis-modulos-solares')->first();
        $inverterCategory = Category::where('slug', 'inversores')->first();
        $brands = Brand::all();

        // Módulos solares
        $panelProducts = [
            ['name' => 'Módulo Solar Canadian Solar 550W Monocristalino', 'price' => 89900, 'sku' => 'CS3W-550'],
            ['name' => 'Painel Solar Jinko Solar Tiger Pro 540W', 'price' => 84900, 'sku' => 'JKM540M'],
            ['name' => 'Módulo Solar LONGi 455W Hi-MO4', 'price' => 74900, 'sku' => 'LR4-72HPH'],
            ['name' => 'Painel Solar BYD 430W Policristalino', 'price' => 69900, 'sku' => 'BYD430P'],
            ['name' => 'Módulo Solar 400W Full Black Monocristalino', 'price' => 79900, 'sku' => 'FB400M'],
            ['name' => 'Painel Solar 600W Bifacial Monocristalino', 'price' => 109900, 'sku' => 'BIF600M'],
        ];

        foreach ($panelProducts as $data) {
            $product = Product::create([
                'name'             => $data['name'],
                'slug'             => Str::slug($data['name']),
                'sku'              => $data['sku'],
                'price_cents'      => $data['price'],
                'compare_at_price_cents' => (int) ($data['price'] * 1.2),
                'cost_cents'       => (int) ($data['price'] * 0.7),
                'status'           => ProductStatus::Published,
                'brand_id'         => $brands->random()->id,
                'short_description' => 'Módulo solar de alta eficiência para sistemas fotovoltaicos residenciais e comerciais.',
                'weight_grams'     => 22000,
                'featured'         => rand(0, 3) === 0,
                'published_at'     => now(),
            ]);

            if ($panelCategory) {
                $product->categories()->attach($panelCategory->id, ['is_primary' => true]);
            }
        }

        // Inversores
        $inverterProducts = [
            ['name' => 'Inversor Solar Growatt MIN 3000TL-X 3kW', 'price' => 189900, 'sku' => 'GRW-MIN3KW'],
            ['name' => 'Inversor Fronius Symo 5.0-3-M 5kW Trifásico', 'price' => 459900, 'sku' => 'FRN-SYMO5'],
            ['name' => 'Inversor Deye SUN-6K-SG03LP1 6kW Híbrido', 'price' => 549900, 'sku' => 'DEY-6KH'],
            ['name' => 'Micro Inversor Hoymiles HM-1500 1.5kW', 'price' => 149900, 'sku' => 'HOY-HM1500'],
        ];

        foreach ($inverterProducts as $data) {
            $product = Product::create([
                'name'              => $data['name'],
                'slug'              => Str::slug($data['name']),
                'sku'               => $data['sku'],
                'price_cents'       => $data['price'],
                'cost_cents'        => (int) ($data['price'] * 0.65),
                'status'            => ProductStatus::Published,
                'brand_id'          => $brands->random()->id,
                'short_description' => 'Inversor solar de alta qualidade para sistemas fotovoltaicos on-grid.',
                'weight_grams'      => 12000,
                'featured'          => rand(0, 2) === 0,
                'published_at'      => now(),
            ]);

            if ($inverterCategory) {
                $product->categories()->attach($inverterCategory->id, ['is_primary' => true]);
            }
        }
    }
}
