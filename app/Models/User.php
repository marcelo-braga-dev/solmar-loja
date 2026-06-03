<?php

declare(strict_types=1);

namespace App\Models;

use App\Domains\Customers\Models\Customer;
use App\Domains\Orders\Models\Order;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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
        'two_factor_secret', 'two_factor_recovery_codes', 'two_factor_confirmed_at',
    ];

    protected $hidden = ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'];

    protected function casts(): array
    {
        return [
            'email_verified_at'      => 'datetime',
            'password'               => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function customer(): HasOne
    {
        return $this->hasOne(Customer::class);
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(['admin', 'manager']);
    }

    public function isCustomer(): bool
    {
        return $this->hasRole('customer');
    }

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
