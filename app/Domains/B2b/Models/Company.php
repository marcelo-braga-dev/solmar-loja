<?php

declare(strict_types=1);

namespace App\Domains\B2b\Models;

use App\Domains\Catalog\Models\PriceList;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

final class Company extends Model
{
    protected $fillable = [
        'uuid', 'razao_social', 'nome_fantasia', 'cnpj',
        'inscricao_estadual', 'inscricao_municipal', 'website', 'logo_url',
        'type', 'segment',
        'contact_name', 'contact_email', 'contact_phone', 'contact_whatsapp',
        'cep', 'street', 'number', 'complement', 'district', 'city', 'state',
        'price_list_id', 'credit_limit_cents', 'payment_term_days', 'extra_discount_pct',
        'status', 'rejection_reason', 'approved_at', 'approved_by',
        'notes',
    ];

    protected $casts = [
        'credit_limit_cents' => 'integer',
        'payment_term_days'  => 'integer',
        'extra_discount_pct' => 'integer',
        'approved_at'        => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(fn (self $c) => $c->uuid ??= Str::uuid()->toString());
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /** @return BelongsToMany<User, $this> */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'company_users')
            ->withPivot('role', 'is_primary_contact')
            ->withTimestamps();
    }

    /** @return HasMany<CompanyProject, $this> */
    public function projects(): HasMany
    {
        return $this->hasMany(CompanyProject::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /** @param Builder<Company> $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', 'active');
    }

    /** @param Builder<Company> $query */
    public function scopePending(Builder $query): void
    {
        $query->where('status', 'pending');
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function statusLabel(): string
    {
        return match ($this->status) {
            'pending'   => 'Aguardando aprovação',
            'active'    => 'Ativo',
            'suspended' => 'Suspenso',
            'rejected'  => 'Reprovado',
            default     => $this->status,
        };
    }

    public function statusColor(): string
    {
        return match ($this->status) {
            'pending'   => 'warning',
            'active'    => 'success',
            'suspended' => 'error',
            'rejected'  => 'error',
            default     => 'default',
        };
    }

    public function typeLabel(): string
    {
        return match ($this->type) {
            'integrador'   => 'Integrador',
            'distribuidor' => 'Distribuidor',
            'engenharia'   => 'Engenharia',
            'revendedor'   => 'Revendedor',
            default        => $this->type,
        };
    }

    public function cnpjClean(): string
    {
        return preg_replace('/\D/', '', $this->cnpj) ?? '';
    }

    /** Calcula o preço efetivo para esta empresa (tabela + desconto extra) */
    public function effectivePrice(int $publicPriceCents): int
    {
        $afterList = $this->priceList
            ? $this->priceList->applyTo($publicPriceCents)
            : $publicPriceCents;

        if ($this->extra_discount_pct > 0) {
            return (int) round($afterList * (1 - $this->extra_discount_pct / 100));
        }

        return $afterList;
    }
}
