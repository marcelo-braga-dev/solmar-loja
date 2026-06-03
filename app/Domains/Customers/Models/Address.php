<?php

declare(strict_types=1);

namespace App\Domains\Customers\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Address extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id', 'label', 'recipient', 'cep', 'street', 'number',
        'complement', 'district', 'city', 'state', 'country',
        'is_default_shipping', 'is_default_billing',
    ];

    protected $casts = [
        'is_default_shipping' => 'boolean',
        'is_default_billing'  => 'boolean',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function fullAddress(): string
    {
        $parts = [
            "{$this->street}, {$this->number}",
            $this->complement,
            $this->district,
            "{$this->city} — {$this->state}",
            $this->cep,
        ];

        return implode(', ', array_filter($parts));
    }
}
