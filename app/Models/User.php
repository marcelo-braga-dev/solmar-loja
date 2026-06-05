<?php

declare(strict_types=1);

namespace App\Models;

use App\Domains\Catalog\Models\PriceList;
use App\Domains\Customers\Models\Customer;
use App\Domains\Orders\Models\Order;
use App\Domains\Orders\Models\Proposal;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

final class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;
    use HasRoles;
    use Notifiable;

    protected $fillable = [
        'name', 'email', 'password',
        'google_id', 'avatar_url', 'auth_provider',
        'price_list_id', 'company_id',
        'two_factor_secret', 'two_factor_recovery_codes', 'two_factor_confirmed_at',
    ];

    protected $hidden = ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'];

    protected function casts(): array
    {
        return [
            'email_verified_at'       => 'datetime',
            'password'                => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function customer(): HasOne
    {
        return $this->hasOne(Customer::class);
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** @return HasMany<Proposal, $this> */
    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class, 'user_id');
    }

    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(\App\Domains\B2b\Models\Company::class);
    }

    public function consultantProfile(): HasOne
    {
        return $this->hasOne(\App\Domains\Consultant\Models\ConsultantProfile::class);
    }

    // ─── Guards de papel ─────────────────────────────────────────────────────

    /** Acessa o painel (admin ou consultor) */
    public function isAdmin(): bool
    {
        return $this->hasRole(['admin', 'consultant']);
    }

    /** Somente administradores completos */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /** Consultor comercial */
    public function isConsultant(): bool
    {
        return $this->hasRole('consultant');
    }

    /** Cliente da loja */
    public function isCustomer(): bool
    {
        return $this->hasRole('customer');
    }

    // ─── Preços ───────────────────────────────────────────────────────────────

    /**
     * Resolve a tabela de preço efetiva para este usuário.
     * Prioridade: price_list_id do usuário > role-based > empresa B2B > público
     */
    public function effectivePriceList(): ?PriceList
    {
        // 1. Tabela explicitamente atribuída ao usuário
        if ($this->price_list_id) {
            return $this->priceList;
        }

        // 2. Via empresa B2B (se for membro de empresa ativa)
        if ($this->company_id) {
            $company = $this->company()->with('priceList')->first();
            if ($company?->status === 'active' && $company->price_list_id) {
                return $company->priceList;
            }
        }

        // 3. Por role
        if ($this->isConsultant()) {
            return PriceList::where('code', 'CONSULTOR')->first();
        }

        return null; // null = preço público
    }

    /** Calcula o preço de um produto para este usuário */
    public function priceFor(int $publicPriceCents): int
    {
        $list = $this->effectivePriceList();

        if (! $list) {
            return $publicPriceCents;
        }

        return $list->applyTo($publicPriceCents);
    }

    // ─── 2FA ─────────────────────────────────────────────────────────────────

    public function hasTwoFactorEnabled(): bool
    {
        return ! empty($this->getAttribute('two_factor_secret'))
            && $this->getAttribute('two_factor_confirmed_at') !== null;
    }

    public function hasTwoFactorConfirmedInSession(): bool
    {
        return session()->has('two_factor_confirmed');
    }
}
