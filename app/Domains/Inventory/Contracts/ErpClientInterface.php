<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Contracts;

use App\Domains\Inventory\Data\ErpProductData;
use Illuminate\Support\Collection;

interface ErpClientInterface
{
    public function name(): string;

    /**
     * Busca todos os produtos ativos da fonte externa.
     *
     * @return Collection<int, ErpProductData>
     */
    public function fetchProducts(): Collection;

    public function isAvailable(): bool;
}
