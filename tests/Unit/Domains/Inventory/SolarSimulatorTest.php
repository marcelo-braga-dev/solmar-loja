<?php

declare(strict_types=1);

use App\Domains\Marketing\Services\SolarSimulatorService;

it('calculates system power for given consumption', function (): void {
    $service = new SolarSimulatorService();
    $result  = $service->calculate(300, 'SP');

    expect($result['result']['system_power_kwp'])->toBeGreaterThan(0);
    expect($result['result']['panel_count'])->toBeInt()->toBeGreaterThan(0);
    expect($result['result']['annual_generation_kwh'])->toBeGreaterThan(0);
});

it('higher consumption requires more panels', function (): void {
    $service = new SolarSimulatorService();
    $small   = $service->calculate(200, 'SP');
    $large   = $service->calculate(1000, 'SP');

    expect($large['result']['panel_count'])->toBeGreaterThan($small['result']['panel_count']);
    expect($large['result']['system_power_kwp'])->toBeGreaterThan($small['result']['system_power_kwp']);
});

it('generates savings estimates', function (): void {
    $service = new SolarSimulatorService();
    $result  = $service->calculate(300, 'RJ');

    expect($result['result']['monthly_savings_cents'])->toBeInt()->toBeGreaterThan(0);
    expect($result['result']['annual_savings_cents'])->toBeInt()->toBeGreaterThan(0);
    expect($result['result']['system_cost_cents'])->toBeInt()->toBeGreaterThan(0);
});

it('calculates co2 savings', function (): void {
    $service = new SolarSimulatorService();
    $result  = $service->calculate(400, 'CE');

    expect($result['result']['co2_saved_kg_year'])->toBeGreaterThan(0);
});

it('has valid structure for all states', function (): void {
    $service = new SolarSimulatorService();
    $states  = ['SP', 'RJ', 'MG', 'RS', 'BA', 'CE', 'AM', 'DF'];

    foreach ($states as $state) {
        $result = $service->calculate(300, $state);
        expect($result['result'])->toHaveKey('system_power_kwp');
        expect($result['result'])->toHaveKey('panel_count');
        expect($result)->toHaveKey('disclaimer');
    }
});
