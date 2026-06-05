<?php

declare(strict_types=1);

namespace App\Domains\B2b\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CompanyProject extends Model
{
    protected $fillable = [
        'company_id', 'name', 'client_name', 'city', 'state',
        'type', 'system_kwp', 'status',
        'started_at', 'completed_at', 'contract_value_cents', 'notes',
    ];

    protected $casts = [
        'system_kwp'            => 'float',
        'contract_value_cents'  => 'integer',
        'started_at'            => 'date',
        'completed_at'          => 'date',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            'prospect'    => 'Prospecção',
            'approved'    => 'Aprovado',
            'in_progress' => 'Em andamento',
            'completed'   => 'Concluído',
            'cancelled'   => 'Cancelado',
            default       => $this->status,
        };
    }

    public function typeLabel(): string
    {
        return match ($this->type) {
            'residencial' => 'Residencial',
            'comercial'   => 'Comercial',
            'industrial'  => 'Industrial',
            'rural'       => 'Rural / Agro',
            default       => $this->type ?? '—',
        };
    }
}
