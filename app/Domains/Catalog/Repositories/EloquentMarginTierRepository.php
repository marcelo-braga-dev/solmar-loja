<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Repositories;

use App\Domains\Catalog\Contracts\MarginTierRepositoryInterface;
use App\Domains\Catalog\Data\MarginTierData;
use App\Domains\Catalog\Models\MarginTier;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

final class EloquentMarginTierRepository implements MarginTierRepositoryInterface
{
    /** @return Collection<int, MarginTier> */
    public function allActiveOrderedByMinKwp(): Collection
    {
        return MarginTier::query()
            ->where('is_active', true)
            ->orderBy('min_kwp')
            ->get();
    }

    /** @return LengthAwarePaginator<MarginTier> */
    public function paginate(int $perPage = 50): LengthAwarePaginator
    {
        return MarginTier::query()
            ->orderBy('min_kwp')
            ->paginate($perPage);
    }

    public function findById(int $id): ?MarginTier
    {
        return MarginTier::query()->find($id);
    }

    /** @return Collection<int, MarginTier> */
    public function overlapping(float $minKwp, ?float $maxKwp, ?int $ignoreId = null): Collection
    {
        return MarginTier::query()
            ->where('is_active', true)
            ->when($ignoreId !== null, fn ($q) => $q->where('id', '!=', $ignoreId))
            // faixa existente começa antes do fim da nova faixa (nova sem limite superior = sempre verdade)
            ->when($maxKwp !== null, fn ($q) => $q->where('min_kwp', '<=', $maxKwp))
            // faixa existente termina depois do início da nova faixa (ou não tem limite superior)
            ->where(fn ($q) => $q->where('max_kwp', '>=', $minKwp)->orWhereNull('max_kwp'))
            ->get();
    }

    public function create(MarginTierData $data): MarginTier
    {
        return MarginTier::create([
            'min_kwp' => $data->minKwp,
            'max_kwp' => $data->maxKwp,
            'margin_percent' => $data->marginPercent,
            'is_active' => $data->isActive,
        ]);
    }

    public function update(MarginTier $tier, MarginTierData $data): MarginTier
    {
        $tier->update([
            'min_kwp' => $data->minKwp,
            'max_kwp' => $data->maxKwp,
            'margin_percent' => $data->marginPercent,
            'is_active' => $data->isActive,
        ]);

        return $tier->fresh() ?? $tier;
    }

    public function delete(MarginTier $tier): void
    {
        $tier->delete();
    }
}
