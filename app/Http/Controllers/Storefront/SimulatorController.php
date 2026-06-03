<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Marketing\Services\SolarSimulatorService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class SimulatorController extends Controller
{
    public function __construct(
        private readonly SolarSimulatorService $simulator,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Storefront/Simulator');
    }

    public function calculate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'monthly_kwh' => ['required', 'numeric', 'min:50', 'max:50000'],
            'state'       => ['required', 'string', 'size:2'],
            'roof_type'   => ['nullable', 'string', 'in:ceramic,metal,slab,other'],
        ]);

        $result = $this->simulator->calculate(
            monthlyConsumptionKwh: (float) $validated['monthly_kwh'],
            state: $validated['state'],
            roofType: $validated['roof_type'] ?? 'ceramic',
        );

        return response()->json($result);
    }
}
