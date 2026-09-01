<?php

declare(strict_types=1);

use App\Domains\Catalog\Contracts\MarginTierRepositoryInterface;
use App\Domains\Catalog\Data\MarginTierData;
use App\Domains\Catalog\Models\MarginTier;
use App\Domains\Catalog\Services\MarginPricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function pricingService(): MarginPricingService
{
    return app(MarginPricingService::class);
}

function makeTier(float $min, ?float $max, float $marginPercent, bool $active = true): MarginTier
{
    return app(MarginTierRepositoryInterface::class)->create(new MarginTierData(
        minKwp: $min,
        maxKwp: $max,
        marginPercent: $marginPercent,
        isActive: $active,
    ));
}

it('applies the margin of the exact matching tier', function (): void {
    makeTier(0, 3, 40);
    makeTier(3.01, 6, 30);
    makeTier(6.01, null, 20);

    // custo R$ 1.000,00, kit de 2 kWp -> primeira faixa (40%)
    expect(pricingService()->calculateSalePriceCents(100000, 2.0))->toBe(140000);

    // kit de 4 kWp -> segunda faixa (30%)
    expect(pricingService()->calculateSalePriceCents(100000, 4.0))->toBe(130000);

    // kit de 10 kWp -> terceira faixa, sem limite superior (20%)
    expect(pricingService()->calculateSalePriceCents(100000, 10.0))->toBe(120000);
});

it('matches tier boundaries inclusively on both ends', function (): void {
    makeTier(0, 3, 40);
    makeTier(3.01, 6, 30);

    expect(pricingService()->findTierFor(3.0)->margin_percent)->toBe(40.0);
    expect(pricingService()->findTierFor(3.01)->margin_percent)->toBe(30.0);
    expect(pricingService()->findTierFor(6.0)->margin_percent)->toBe(30.0);
});

it('falls back to the nearest tier when the kwp falls in a gap between tiers', function (): void {
    makeTier(0, 3, 40);
    makeTier(5, 10, 20);

    // 4 kWp está no gap (3 a 5) -- mais perto da faixa 0-3 (dist 1) do que da 5-10 (dist 1)... empate,
    // então usamos 4.5 kWp para não empatar: mais perto da faixa 5-10 (dist 0.5) que da 0-3 (dist 1.5)
    expect(pricingService()->findTierFor(4.5)->margin_percent)->toBe(20.0);

    // 3.5 kWp está mais perto da faixa 0-3 (dist 0.5) que da 5-10 (dist 1.5)
    expect(pricingService()->findTierFor(3.5)->margin_percent)->toBe(40.0);
});

it('falls back to the nearest tier when the kwp is below every tier', function (): void {
    makeTier(5, 10, 20);
    makeTier(10.01, null, 15);

    expect(pricingService()->findTierFor(1.0)->margin_percent)->toBe(20.0);
});

it('falls back to the nearest (last) tier when the kwp is above every bounded tier', function (): void {
    makeTier(0, 3, 40);
    makeTier(3.01, 6, 30);

    // nenhuma faixa vai até o infinito -- 20 kWp usa a faixa mais próxima (a mais alta)
    expect(pricingService()->findTierFor(20.0)->margin_percent)->toBe(30.0);
});

it('ignores inactive tiers when finding a match', function (): void {
    makeTier(0, 10, 40, active: false);
    makeTier(0, 10, 25, active: true);

    expect(pricingService()->findTierFor(5.0)->margin_percent)->toBe(25.0);
});

it('returns null when no tier is configured at all', function (): void {
    expect(pricingService()->findTierFor(5.0))->toBeNull();
    expect(pricingService()->calculateSalePriceCents(100000, 5.0))->toBeNull();
});

it('returns null when the kit power is missing or non-positive', function (): void {
    makeTier(0, 10, 40);

    expect(pricingService()->calculateSalePriceCents(100000, null))->toBeNull();
    expect(pricingService()->calculateSalePriceCents(100000, 0))->toBeNull();
    expect(pricingService()->calculateSalePriceCents(100000, -1))->toBeNull();
});

it('rounds the sale price to the nearest cent', function (): void {
    makeTier(0, 10, 33.33);

    // 100050 * 1.3333 = 133396,665 -> arredonda para 133397
    expect(pricingService()->calculateSalePriceCents(100050, 5.0))->toBe(133397);
});

it('invalidates the cached tier list after create/update/delete', function (): void {
    $tier = makeTier(0, 10, 40);
    expect(pricingService()->calculateSalePriceCents(100000, 5.0))->toBe(140000);

    pricingService()->update($tier, new MarginTierData(minKwp: 0, maxKwp: 10, marginPercent: 20, isActive: true));
    expect(pricingService()->calculateSalePriceCents(100000, 5.0))->toBe(120000);

    pricingService()->delete($tier->fresh());
    expect(pricingService()->calculateSalePriceCents(100000, 5.0))->toBeNull();
});
