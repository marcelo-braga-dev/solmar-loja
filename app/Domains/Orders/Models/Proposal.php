<?php

declare(strict_types=1);

namespace App\Domains\Orders\Models;

use App\Domains\B2b\Models\Company;
use App\Domains\Customers\Models\Customer;
use App\Models\User;
use Database\Factories\ProposalFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

final class Proposal extends Model
{
    /** @use HasFactory<ProposalFactory> */
    use HasFactory;

    protected $fillable = [
        'uuid', 'user_id', 'customer_id', 'company_id',
        'customer_name', 'customer_email', 'customer_phone', 'customer_cpf_cnpj',
        'customer_city', 'customer_state',
        'title', 'reference', 'status',
        'valid_until', 'subtotal_cents', 'discount_cents', 'tax_cents', 'total_cents',
        'notes', 'internal_notes', 'simulator_data',
        'pdf_path', 'pdf_generated_at',
        'sent_at', 'viewed_at', 'accepted_at', 'rejected_at',
    ];

    protected $casts = [
        'valid_until' => 'date',
        'simulator_data' => 'array',
        'subtotal_cents' => 'integer',
        'discount_cents' => 'integer',
        'tax_cents' => 'integer',
        'total_cents' => 'integer',
        'pdf_generated_at' => 'datetime',
        'sent_at' => 'datetime',
        'viewed_at' => 'datetime',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        self::creating(function (self $p): void {
            $p->uuid ??= Str::uuid()->toString();
            $p->reference ??= 'PROP-'.strtoupper(substr((string) $p->uuid, 0, 6));
        });
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    /**
     * Consultor que criou a proposta
     *
     * @return BelongsTo<User, $this>
     */
    public function consultant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** @return HasMany<ProposalItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(ProposalItem::class)->orderBy('position');
    }

    // ─── Business logic ───────────────────────────────────────────────────────

    public function statusLabel(): string
    {
        return match ($this->status) {
            'draft' => 'Rascunho',
            'sent' => 'Enviada',
            'viewed' => 'Visualizada',
            'accepted' => 'Aceita',
            'rejected' => 'Recusada',
            'expired' => 'Expirada',
            'converted' => 'Convertida',
            default => $this->status,
        };
    }

    public function statusColor(): string
    {
        return match ($this->status) {
            'draft' => 'default',
            'sent' => 'info',
            'viewed' => 'primary',
            'accepted' => 'success',
            'rejected' => 'error',
            'expired' => 'warning',
            'converted' => 'success',
            default => 'default',
        };
    }

    public function isEditable(): bool
    {
        return $this->status === 'draft';
    }

    public function isExpired(): bool
    {
        return $this->valid_until !== null
            && $this->valid_until->isPast()
            && ! in_array($this->status, ['accepted', 'converted']);
    }

    /** Recalcula totais a partir dos itens */
    public function recalculate(): void
    {
        $this->load('items');
        $subtotal = $this->items->sum('total_cents');
        $this->update([
            'subtotal_cents' => $subtotal,
            'total_cents' => max(0, $subtotal - $this->discount_cents + $this->tax_cents),
        ]);
    }
}
