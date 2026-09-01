<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Services;

use App\Domains\Catalog\Contracts\MarginTierRepositoryInterface;
use App\Domains\Catalog\Data\MarginTierData;
use App\Domains\Catalog\Models\MarginTier;
use App\Jobs\RecalculateKitPricesJob;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

/**
 * Calcula o preço de venda dos kits como `preço do fornecedor + margem de venda`,
 * onde a margem é escalável por potência (kWp): faixas menores podem ter margem
 * maior e faixas maiores margem menor, configuradas pelo admin.
 *
 * Regra de faixa ausente (gap): usa a faixa ativa mais próxima da potência do kit
 * (por distância até o limite mais próximo) em vez de bloquear o cálculo — decisão
 * de produto para não deixar kits sem preço por causa de uma lacuna de cadastro.
 */
final class MarginPricingService
{
    private const CACHE_KEY = 'margin_tiers_active';

    private const CACHE_TTL = 3600;

    public function __construct(
        private readonly MarginTierRepositoryInterface $tiers,
    ) {}

    /** @return Collection<int, MarginTier> */
    public function activeTiers(): Collection
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, fn () => $this->tiers->allActiveOrderedByMinKwp());
    }

    /** @return LengthAwarePaginator<MarginTier> */
    public function paginate(int $perPage = 50): LengthAwarePaginator
    {
        return $this->tiers->paginate($perPage);
    }

    /** @return Collection<int, MarginTier> */
    public function overlapping(float $minKwp, ?float $maxKwp, ?int $ignoreId = null): Collection
    {
        return $this->tiers->overlapping($minKwp, $maxKwp, $ignoreId);
    }

    public function create(MarginTierData $data): MarginTier
    {
        $tier = $this->tiers->create($data);
        $this->afterChange();

        return $tier;
    }

    public function update(MarginTier $tier, MarginTierData $data): MarginTier
    {
        $tier = $this->tiers->update($tier, $data);
        $this->afterChange();

        return $tier;
    }

    public function delete(MarginTier $tier): void
    {
        $this->tiers->delete($tier);
        $this->afterChange();
    }

    /**
     * Calcula o preço de venda em centavos a partir do preço de custo (fornecedor) e da
     * potência do kit. Retorna null quando não há nenhuma faixa cadastrada ou quando a
     * potência do kit é desconhecida — cabe ao chamador decidir o fallback (ver
     * AppSolarProductSyncService/InventorySyncService, que preservam o preço vindo da
     * integração como rede de segurança enquanto o admin não configura nenhuma faixa).
     */
    public function calculateSalePriceCents(int $costCents, ?float $kitPowerKwp): ?int
    {
        if ($kitPowerKwp === null || $kitPowerKwp <= 0) {
            return null;
        }

        $tier = $this->findTierFor($kitPowerKwp);

        if ($tier === null) {
            return null;
        }

        return (int) round($costCents * (1 + $tier->margin_percent / 100));
    }

    public function findTierFor(float $kitPowerKwp): ?MarginTier
    {
        $tiers = $this->activeTiers();

        if ($tiers->isEmpty()) {
            return null;
        }

        $exact = $tiers->first(
            fn (MarginTier $tier) => $kitPowerKwp >= $tier->min_kwp
                && ($tier->max_kwp === null || $kitPowerKwp <= $tier->max_kwp)
        );

        if ($exact !== null) {
            return $exact;
        }

        // Sem faixa exata (gap ou potência fora de toda faixa cadastrada): usa a mais próxima.
        return $tiers->sortBy(function (MarginTier $tier) use ($kitPowerKwp): float {
            if ($kitPowerKwp < $tier->min_kwp) {
                return $tier->min_kwp - $kitPowerKwp;
            }

            if ($tier->max_kwp !== null && $kitPowerKwp > $tier->max_kwp) {
                return $kitPowerKwp - $tier->max_kwp;
            }

            return 0.0;
        })->first();
    }

    private function afterChange(): void
    {
        Cache::forget(self::CACHE_KEY);
        RecalculateKitPricesJob::dispatch();
    }
}
