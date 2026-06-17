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

    private const PANEL_EFFICIENCY   = 0.20; // eficiência do painel (20%)
    private const SYSTEM_EFFICIENCY  = 0.78; // perdas do sistema
    private const PANEL_POWER_W      = 550;  // potência padrão de um painel (W)
    private const PANEL_AREA_M2      = 2.7;  // área de um painel 550W (m²)
    private const PANEL_DEGRADATION  = 0.005; // degradação anual do painel (0,5%/ano — NREL)
    private const SYSTEM_LIFETIME_YR = 25;

    /**
     * Tarifa residencial média por estado (R$/kWh) — ANEEL 2024.
     * Inclui tributos médios (ICMS, PIS/COFINS, taxa de iluminação).
     *
     * @var array<string, float>
     */
    private const TARIFF_BY_STATE = [
        'AC' => 0.78, 'AL' => 0.90, 'AM' => 0.96, 'AP' => 0.72, 'BA' => 0.92,
        'CE' => 0.86, 'DF' => 0.79, 'ES' => 0.83, 'GO' => 0.87, 'MA' => 0.82,
        'MG' => 0.82, 'MS' => 0.88, 'MT' => 0.89, 'PA' => 0.73, 'PB' => 0.89,
        'PE' => 0.88, 'PI' => 0.83, 'PR' => 0.78, 'RJ' => 1.08, 'RN' => 0.91,
        'RO' => 0.74, 'RR' => 0.68, 'RS' => 0.80, 'SC' => 0.80, 'SE' => 0.88,
        'SP' => 0.81, 'TO' => 0.82,
    ];

    /** @return array<string, mixed> */
    public function calculate(float $monthlyConsumptionKwh, string $state, string $roofType = 'ceramic'): array
    {
        $stateUpper       = strtoupper($state);
        $dailyConsumption = $monthlyConsumptionKwh / 30;
        $irradiance       = self::IRRADIANCE[$stateUpper] ?? 5.0;
        $tariff           = self::TARIFF_BY_STATE[$stateUpper] ?? 0.88;

        // Potência necessária do sistema (kWp)
        $systemPowerKwp = $dailyConsumption / ($irradiance * self::SYSTEM_EFFICIENCY);

        // Número de painéis
        $panelCount = (int) ceil($systemPowerKwp * 1000 / self::PANEL_POWER_W);

        // Geração anual estimada no ano 1 (kWh)
        $annualGenerationKwhYear1 = $systemPowerKwp * $irradiance * self::SYSTEM_EFFICIENCY * 365;

        // Economia mensal/anual no ano 1 usando tarifa local
        $monthlyBillEstimate    = $monthlyConsumptionKwh * $tariff;
        $monthlySavingsEstimate = ($monthlyConsumptionKwh * 0.95) * $tariff; // 95% coberto
        $annualSavingsYear1     = $monthlySavingsEstimate * 12;

        // Custo estimado do sistema (R$ 3.500 por kWp instalado)
        $systemCostEstimate = (int) ($systemPowerKwp * 3500 * 100); // centavos

        // Payback com degradação real — acumula economia ano a ano até cobrir o investimento
        $paybackYears    = null;
        $lifetimeSavings = 0.0;
        $accumulated     = 0.0;
        $paybackFound    = false;

        for ($yr = 1; $yr <= self::SYSTEM_LIFETIME_YR; $yr++) {
            $degradationFactor = (1 - self::PANEL_DEGRADATION) ** ($yr - 1);
            $yearSavings       = $annualSavingsYear1 * $degradationFactor;
            $lifetimeSavings  += $yearSavings;

            if (! $paybackFound) {
                $accumulated += $yearSavings;
                if ($accumulated >= ($systemCostEstimate / 100)) {
                    // Interpolação para fração de ano
                    $surplus = $accumulated - ($systemCostEstimate / 100);
                    $paybackYears = round($yr - ($surplus / $yearSavings), 1);
                    $paybackFound = true;
                }
            }
        }

        // Área de telhado necessária
        $roofAreaM2 = round($panelCount * self::PANEL_AREA_M2, 1);

        // Kit sugerido
        $suggestedKit = $this->findSuggestedKit($systemPowerKwp);

        return [
            'input' => [
                'monthly_kwh' => $monthlyConsumptionKwh,
                'state'       => $stateUpper,
                'roof_type'   => $roofType,
                'tariff'      => $tariff,
            ],
            'result' => [
                'system_power_kwp'        => round($systemPowerKwp, 2),
                'panel_count'             => $panelCount,
                'panel_power_w'           => self::PANEL_POWER_W,
                'annual_generation_kwh'   => round($annualGenerationKwhYear1),
                'monthly_bill_estimate'   => round($monthlyBillEstimate, 2),
                'monthly_savings_cents'   => (int) ($monthlySavingsEstimate * 100),
                'annual_savings_cents'    => (int) ($annualSavingsYear1 * 100),
                'system_cost_cents'       => $systemCostEstimate,
                'payback_years'           => $paybackYears,
                'roof_area_m2'            => $roofAreaM2,
                'co2_saved_kg_year'       => round($annualGenerationKwhYear1 * 0.074), // fator emissão SEEG
                'irradiance'              => $irradiance,
                'tariff'                  => $tariff,
                'lifetime_savings_cents'  => (int) ($lifetimeSavings * 100),
                'panel_degradation_pct'   => self::PANEL_DEGRADATION * 100,
            ],
            'suggested_kit' => $suggestedKit,
            'disclaimer'    => 'Cálculo considera degradação real de 0,5%/ano dos painéis e tarifa da distribuidora local. Solicite uma análise técnica para dimensionamento preciso.',
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
