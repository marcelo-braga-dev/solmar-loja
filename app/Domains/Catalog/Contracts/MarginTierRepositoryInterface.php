<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Contracts;

use App\Domains\Catalog\Data\MarginTierData;
use App\Domains\Catalog\Models\MarginTier;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface MarginTierRepositoryInterface
{
    /** @return Collection<int, MarginTier> */
    public function allActiveOrderedByMinKwp(): Collection;

    /** @return LengthAwarePaginator<MarginTier> */
    public function paginate(int $perPage = 50): LengthAwarePaginator;

    public function findById(int $id): ?MarginTier;

    /**
     * Faixas ativas que se sobrepõem ao intervalo informado, ignorando opcionalmente uma
     * faixa (usado ao editar, para não colidir consigo mesma). Usada para validação.
     *
     * @return Collection<int, MarginTier>
     */
    public function overlapping(float $minKwp, ?float $maxKwp, ?int $ignoreId = null): Collection;

    public function create(MarginTierData $data): MarginTier;

    public function update(MarginTier $tier, MarginTierData $data): MarginTier;

    public function delete(MarginTier $tier): void;
}
