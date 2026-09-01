<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domains\Catalog\Data\MarginTierData;
use App\Domains\Catalog\Models\MarginTier;
use App\Domains\Catalog\Services\MarginPricingService;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateMarginTierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Protegido pelo middleware de admin da rota
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'min_kwp' => ['required', 'numeric', 'min:0', 'max:9999.99'],
            'max_kwp' => ['nullable', 'numeric', 'gt:min_kwp', 'max:9999.99'],
            'margin_percent' => ['required', 'numeric', 'min:0', 'max:500'],
            'is_active' => ['boolean'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator): void {
            if ($validator->errors()->has('min_kwp') || $validator->errors()->has('max_kwp')) {
                return;
            }

            $minKwp = (float) $this->input('min_kwp');
            $maxKwp = $this->filled('max_kwp') ? (float) $this->input('max_kwp') : null;

            $conflict = app(MarginPricingService::class)->overlapping($minKwp, $maxKwp, $this->tierId())->first();

            if ($conflict !== null) {
                $conflictRange = $conflict->max_kwp !== null ? "{$conflict->min_kwp} a {$conflict->max_kwp} kWp" : "a partir de {$conflict->min_kwp} kWp";
                $validator->errors()->add('min_kwp', "Essa faixa sobrepõe a faixa já cadastrada de {$conflictRange} (margem {$conflict->margin_percent}%).");
            }
        });
    }

    private function tierId(): int
    {
        $tier = $this->route('marginTier');

        return $tier instanceof MarginTier ? $tier->id : (int) $tier;
    }

    public function toData(): MarginTierData
    {
        $validated = $this->validated();

        return new MarginTierData(
            minKwp: (float) $validated['min_kwp'],
            maxKwp: isset($validated['max_kwp']) ? (float) $validated['max_kwp'] : null,
            marginPercent: (float) $validated['margin_percent'],
            isActive: (bool) ($validated['is_active'] ?? true),
        );
    }
}
