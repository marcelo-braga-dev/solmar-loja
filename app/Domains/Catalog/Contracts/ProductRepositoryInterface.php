<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Contracts;

use App\Domains\Catalog\Data\ProductData;
use App\Domains\Catalog\Data\ProductFilterData;
use App\Domains\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface ProductRepositoryInterface
{
    public function findBySlug(string $slug): ?Product;

    public function findById(int $id): ?Product;

    public function findByUuid(string $uuid): ?Product;

    public function findBySku(string $sku): ?Product;

    /** @return LengthAwarePaginator<Product> */
    public function filter(ProductFilterData $filter): LengthAwarePaginator;

    /**
     * Atributos filtráveis e seus valores disponíveis entre os produtos publicados das categorias informadas.
     *
     * @param  int[]  $categoryIds
     * @return \Illuminate\Support\Collection<int, object>
     */
    public function facetsForCategories(array $categoryIds): \Illuminate\Support\Collection;

    /** @return LengthAwarePaginator<Product> */
    public function paginateForAdmin(int $perPage = 20, ?string $search = null): LengthAwarePaginator;

    /** @return Collection<int, Product> */
    public function featured(int $limit = 8): Collection;

    /** @return Collection<int, Product> */
    public function onSale(int $limit = 8): Collection;

    /** @return Collection<int, Product> */
    public function related(Product $product, int $limit = 6): Collection;

    /** @return Collection<int, Product> */
    public function byCategorySlug(string $slug, int $limit = 8): Collection;

    public function create(ProductData $data): Product;

    public function update(Product $product, ProductData $data): Product;

    /**
     * Atualiza apenas os atributos informados, preservando os demais — usado por
     * sincronizações externas que não devem sobrescrever campos administrados localmente.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function updateAttributes(Product $product, array $attributes): Product;

    public function delete(Product $product): void;
}
