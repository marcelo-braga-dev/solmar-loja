<?php

declare(strict_types=1);

namespace App\Domains\Marketing\Services;

use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Product;

final class SolarSimulatorService
{
    /**
     * Irradiância média diária por estado (kWh/m²/dia).
     * Fonte: CRESESB / Atlas Solarimétrico do Brasil.
     *
     * @var array<string, float>
     */
    private const IRRADIANCE = [
        'AC' => 5.0, 'AL' => 5.8, 'AM' => 4.8, 'AP' => 4.7, 'BA' => 5.9,
        'CE' => 5.9, 'DF' => 5.4, 'ES' => 5.1, 'GO' => 5.5, 'MA' => 5.5,
        'MG' => 5.4, 'MS' => 5.5, 'MT' => 5.4, 'PA' => 4.7, 'PB' => 5.9,
        'PE' => 5.8, 'PI' => 5.8, 'PR' => 5.0, 'RJ' => 5.1, 'RN' => 6.0,
        'RO' => 4.9, 'RR' => 4.8, 'RS' => 4.8, 'SC' => 4.9, 'SE' => 5.7,
        'SP' => 5.2, 'TO' => 5.6,
    ];

    private const PANEL_EFFICIENCY  = 0.20; // eficiência do painel (20%)
    private const SYSTEM_EFFICIENCY = 0.78; // perdas do sistema
    private const PANEL_POWER_W     = 550;  // potência padrão de um painel (W)
    private const PANEL_AREA_M2     = 2.7;  // área de um painel 550W (m²)
    private const KWH_TARIFF        = 0.88; // tarifa média kWh (R$)

    /** @return array<string, mixed> */
    public function calculate(float $monthlyConsumptionKwh, string $state, string $roofType = 'ceramic'): array
    {
        $dailyConsumption = $monthlyConsumptionKwh / 30;
        $irradiance       = self::IRRADIANCE[strtoupper($state)] ?? 5.0;

        // Potência necessária do sistema (kWp)
        $systemPowerKwp = $dailyConsumption / ($irradiance * self::SYSTEM_EFFICIENCY);

        // Número de painéis
        $panelCount = (int) ceil($systemPowerKwp * 1000 / self::PANEL_POWER_W);

        // Geração anual estimada (kWh)
        $annualGenerationKwh = $systemPowerKwp * $irradiance * self::SYSTEM_EFFICIENCY * 365;

        // Economia estimada
        $monthlyBillEstimate    = $monthlyConsumptionKwh * self::KWH_TARIFF;
        $monthlySavingsEstimate = ($monthlyConsumptionKwh * 0.95) * self::KWH_TARIFF; // 95% coberto
        $annualSavings          = $monthlySavingsEstimate * 12;

        // Custo estimado do sistema (R$ 3.500 por kWp instalado)
        $systemCostEstimate = (int) ($systemPowerKwp * 3500 * 100); // centavos

        // Payback estimado (anos)
        $paybackYears = $annualSavings > 0
            ? round($systemCostEstimate / 100 / $annualSavings, 1)
            : null;

        // Área de telhado necessária
        $roofAreaM2 = round($panelCount * self::PANEL_AREA_M2, 1);

        // Kit sugerido
        $suggestedKit = $this->findSuggestedKit($systemPowerKwp);

        return [
            'input' => [
                'monthly_kwh' => $monthlyConsumptionKwh,
                'state'       => strtoupper($state),
                'roof_type'   => $roofType,
            ],
            'result' => [
                'system_power_kwp'        => round($systemPowerKwp, 2),
                'panel_count'             => $panelCount,
                'panel_power_w'           => self::PANEL_POWER_W,
                'annual_generation_kwh'   => round($annualGenerationKwh),
                'monthly_bill_estimate'   => round($monthlyBillEstimate, 2),
                'monthly_savings_cents'   => (int) ($monthlySavingsEstimate * 100),
                'annual_savings_cents'    => (int) ($annualSavings * 100),
                'system_cost_cents'       => $systemCostEstimate,
                'payback_years'           => $paybackYears,
                'roof_area_m2'            => $roofAreaM2,
                'co2_saved_kg_year'       => round($annualGenerationKwh * 0.074), // fator emissão SEEG
                'irradiance'              => $irradiance,
            ],
            'suggested_kit' => $suggestedKit,
            'disclaimer'    => 'Esta é uma estimativa simplificada. Solicite uma análise técnica completa para dimensionamento preciso.',
        ];
    }

    /** @return array<string, mixed>|null */
    private function findSuggestedKit(float $systemPowerKwp): ?array
    {
        try {
            $kit = Product::where('status', ProductStatus::Published)
                ->where('name', 'like', '%Kit%')
                ->inRandomOrder()
                ->first(['id', 'name', 'slug', 'price_cents']);
        } catch (\Throwable) {
            return null;
        }

        return $kit ? [
            'id'          => $kit->id,
            'name'        => $kit->name,
            'slug'        => $kit->slug,
            'price_cents' => $kit->price_cents,
        ] : null;
    }
}
