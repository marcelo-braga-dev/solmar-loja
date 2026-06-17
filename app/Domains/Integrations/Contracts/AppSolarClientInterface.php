<?php

declare(strict_types=1);

namespace App\Domains\Integrations\Contracts;

use App\Domains\Integrations\Data\AppSolarProductData;
use Carbon\CarbonInterface;
use Generator;

interface AppSolarClientInterface
{
    /**
     * Itera todo o catálogo de produtos do AppSolar, paginando automaticamente.
     *
     * Quando `$updatedSince` é informado, busca apenas produtos atualizados desde
     * aquela data (sincronização incremental / delta sync).
     *
     * @return Generator<int, AppSolarProductData>
     */
    public function fetchProducts(?CarbonInterface $updatedSince = null): Generator;

    /** Busca um único produto pelo SKU. Retorna null se não existir, estiver inativo ou for de outro fornecedor. */
    public function findBySku(string $sku): ?AppSolarProductData;
}
