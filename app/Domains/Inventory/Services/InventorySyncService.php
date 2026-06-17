<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Services;

use App\Domains\Catalog\Contracts\CategoryRepositoryInterface;
use App\Domains\Catalog\Contracts\ProductRepositoryInterface;
use App\Domains\Catalog\Data\CategoryData;
use App\Domains\Catalog\Data\ProductData;
use App\Domains\Catalog\Enums\AttributeType;
use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Attribute;
use App\Domains\Catalog\Models\AttributeValue;
use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Models\ProductImage;
use App\Domains\Inventory\Contracts\ErpClientInterface;
use App\Domains\Inventory\Data\ErpProductData;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

final class InventorySyncService
{
    /** Specifications do ERP que se tornam atributos filtráveis (specKey => attribute slug). */
    private const FILTERABLE_SPECS = [
        'Marca do Inversor' => 'marca-do-inversor',
        'Marca do Painel'   => 'marca-do-painel',
        'Estrutura'         => 'estrutura',
        'Tensão'            => 'tensao',
    ];

    /** @var array<string, int> Cache de categoria já resolvida/criada nesta execução do sync. */
    private array $categoryCache = [];

    /** @var array<string, int> Cache de atributo (slug => id) já resolvido/criado nesta execução. */
    private array $attributeCache = [];

    /** @var array<string, int> Cache de valor de atributo ("attributeId|slug" => id) nesta execução. */
    private array $attributeValueCache = [];

    public function __construct(
        private readonly ErpClientInterface $client,
        private readonly ProductRepositoryInterface $products,
        private readonly CategoryRepositoryInterface $categories,
        private readonly StockService $stock,
    ) {}

    public function sync(): array
    {
        $syncId  = Str::uuid()->toString();
        $started = now();
        $results = ['total' => 0, 'created' => 0, 'updated' => 0, 'errors' => 0, 'error_list' => []];
        $this->categoryCache       = [];
        $this->attributeCache      = [];
        $this->attributeValueCache = [];

        $logId = DB::table('sync_logs')->insertGetId([
            'source'     => $this->client->name(),
            'started_at' => $started,
            'status'     => 'running',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            $items = $this->client->fetchProducts();
            $results['total'] = $items->count();

            foreach ($items as $item) {
                try {
                    $this->processItem($item, $results);
                } catch (Throwable $e) {
                    $results['errors']++;
                    $results['error_list'][] = [
                        'sku'   => $item->sku,
                        'error' => $e->getMessage(),
                    ];
                    Log::warning('Sync item failed', ['sku' => $item->sku, 'error' => $e->getMessage()]);
                }
            }

            DB::table('sync_logs')->where('id', $logId)->update([
                'status'        => $results['errors'] > 0 ? 'partial' : 'success',
                'finished_at'   => now(),
                'total_items'   => $results['total'],
                'created_items' => $results['created'],
                'updated_items' => $results['updated'],
                'error_items'   => $results['errors'],
                'errors'        => $results['errors'] > 0 ? json_encode($results['error_list']) : null,
                'updated_at'    => now(),
            ]);
        } catch (Throwable $e) {
            DB::table('sync_logs')->where('id', $logId)->update([
                'status'      => 'failed',
                'finished_at' => now(),
                'errors'      => json_encode(['fatal' => $e->getMessage()]),
                'updated_at'  => now(),
            ]);
            Log::error('Inventory sync failed', ['error' => $e->getMessage()]);
        }

        return $results;
    }

    private function processItem(ErpProductData $data, array &$results): void
    {
        $product    = Product::where('external_id', $data->externalId)
            ->orWhere('sku', $data->sku)
            ->first();
        $categoryId = $this->resolveCategoryId($data->categoryName);

        if ($product === null) {
            // Cria produto novo como draft
            $productData = new ProductData(
                name: $data->name,
                slug: Str::slug($data->name).'-'.Str::random(4),
                sku: $data->sku,
                priceCents: $data->priceCents,
                status: ProductStatus::Draft,
                description: $data->description,
                compareAtPriceCents: $data->compareAtPriceCents,
                weightGrams: $data->weightGrams,
                specifications: $data->specifications,
                externalId: $data->externalId,
                categoryIds: $categoryId !== null ? [$categoryId] : [],
            );

            $product = $this->products->create($productData);
            $results['created']++;
        } else {
            // Atualiza preço, estoque e dados do ERP (preserva status e outros campos locais)
            $product->update([
                'price_cents'            => $data->priceCents,
                'compare_at_price_cents' => $data->compareAtPriceCents,
                'weight_grams'           => $data->weightGrams ?? $product->weight_grams,
                'specifications'         => $data->specifications ?? $product->specifications,
                'external_id'            => $data->externalId,
                'synced_at'              => now(),
            ]);

            if ($categoryId !== null) {
                $product->categories()->sync([$categoryId => ['is_primary' => true]]);
            }

            $results['updated']++;
        }

        // Sincroniza estoque
        $this->stock->syncFromErp($product, $data);

        // Sincroniza galeria de imagens vinda do ERP
        $this->syncImages($product, $data->imageUrls);

        // Sincroniza atributos filtráveis (marca do inversor/painel, estrutura, tensão)
        $this->syncAttributes($product, $data->specifications);

        // Reindexa no Meilisearch se publicado
        if ($product->status === ProductStatus::Published) {
            $product->searchable();
        }
    }

    /** @param string[] $imageUrls */
    private function syncImages(Product $product, array $imageUrls): void
    {
        if ($imageUrls === []) {
            return;
        }

        // Substitui apenas as imagens vindas do ERP (path http*), preservando uploads manuais
        ProductImage::where('product_id', $product->id)
            ->where('path', 'like', 'http%')
            ->delete();

        foreach ($imageUrls as $position => $url) {
            ProductImage::create([
                'product_id' => $product->id,
                'path'       => $url,
                'alt'        => $product->name,
                'position'   => $position,
                'is_cover'   => $position === 0 && ! $product->images()->where('is_cover', true)->exists(),
            ]);
        }
    }

    /** @param array<string, mixed>|null $specifications */
    private function syncAttributes(Product $product, ?array $specifications): void
    {
        if ($specifications === null || $specifications === []) {
            return;
        }

        $attributeIds = [];
        $valueIds     = [];

        foreach (self::FILTERABLE_SPECS as $specKey => $attrSlug) {
            $value = $specifications[$specKey] ?? null;

            if ($value === null || $value === '') {
                continue;
            }

            $attributeId    = $this->resolveAttributeId($attrSlug, $specKey);
            $attributeIds[] = $attributeId;
            $valueIds[]     = $this->resolveAttributeValueId($attributeId, (string) $value);
        }

        if ($attributeIds === []) {
            return;
        }

        // Remove apenas pivots dos atributos geridos pelo ERP, preservando outros atributos manuais
        $product->attributeValues()->whereIn('attribute_values.attribute_id', $attributeIds)->detach();
        $product->attributeValues()->syncWithoutDetaching($valueIds);
    }

    private function resolveAttributeId(string $slug, string $name): int
    {
        if (isset($this->attributeCache[$slug])) {
            return $this->attributeCache[$slug];
        }

        $attribute = Attribute::firstOrCreate(
            ['slug' => $slug],
            ['name' => $name, 'type' => AttributeType::Select, 'is_filterable' => true],
        );

        return $this->attributeCache[$slug] = $attribute->id;
    }

    private function resolveAttributeValueId(int $attributeId, string $value): int
    {
        $slug = Str::slug($value);
        $key  = "{$attributeId}|{$slug}";

        if (isset($this->attributeValueCache[$key])) {
            return $this->attributeValueCache[$key];
        }

        $attributeValue = AttributeValue::firstOrCreate(
            ['attribute_id' => $attributeId, 'slug' => $slug],
            ['value' => $value],
        );

        return $this->attributeValueCache[$key] = $attributeValue->id;
    }

    private function resolveCategoryId(?string $categoryName): ?int
    {
        if ($categoryName === null) {
            return null;
        }

        $slug = Str::slug($categoryName);

        if (isset($this->categoryCache[$slug])) {
            return $this->categoryCache[$slug];
        }

        $category = $this->categories->findBySlug($slug);

        if ($category === null) {
            $category = $this->categories->create(new CategoryData(
                name: ucwords(mb_strtolower($categoryName)),
                slug: $slug,
            ));
        }

        return $this->categoryCache[$slug] = $category->id;
    }
}
