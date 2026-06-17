<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Contracts;

use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Models\SolarKitSpecification;
use Carbon\CarbonInterface;

interface SolarKitSpecificationRepositoryInterface
{
    /** @param array<string, mixed> $attributes */
    public function updateOrCreateForProduct(Product $product, array $attributes): SolarKitSpecification;

    /**
     * Arquiva produtos com ficha técnica de kit solar que não foram tocados
     * por uma sincronização completa desde `$before` — ou seja, saíram do catálogo
     * do distribuidor. Retorna a quantidade de produtos arquivados.
     */
    public function archiveProductsNotSyncedSince(CarbonInterface $before): int;
}
