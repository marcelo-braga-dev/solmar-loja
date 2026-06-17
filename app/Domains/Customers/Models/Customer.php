<?php

declare(strict_types=1);

namespace App\Domains\Customers\Models;

use App\Domains\Catalog\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'phone', 'cpf_cnpj', 'type', 'birth_date',
        'accepts_marketing', 'newsletter_token', 'newsletter_confirmed_at', 'meta',
        'wishlist_token', 'wishlist_public',
    ];

    protected $casts = [
        'birth_date'               => 'date',
        'accepts_marketing'        => 'boolean',
        'newsletter_confirmed_at'  => 'datetime',
        'meta'                     => 'array',
        'wishlist_public'          => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<Address, $this> */
    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    /** @return BelongsToMany<Product, $this> */
    public function favoriteProducts(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'favorites', 'customer_id', 'product_id');
    }

    public function defaultShippingAddress(): ?Address
    {
        return $this->addresses->firstWhere('is_default_shipping', true)
            ?? $this->addresses->first();
    }
}
