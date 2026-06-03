<?php

declare(strict_types=1);

namespace App\Domains\Auth\Services;

use App\Domains\Customers\Models\Customer;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

final class AuthService
{
    public function register(string $name, string $email, string $password): User
    {
        $user = User::create([
            'name'     => $name,
            'email'    => $email,
            'password' => Hash::make($password),
        ]);

        $user->assignRole('customer');

        Customer::create(['user_id' => $user->id]);

        $user->sendEmailVerificationNotification();

        return $user;
    }

    public function login(string $email, string $password, bool $remember = false): User
    {
        if (! Auth::attempt(['email' => $email, 'password' => $password], $remember)) {
            throw ValidationException::withMessages([
                'email' => ['As credenciais informadas não correspondem a nenhum cadastro.'],
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        return $user;
    }

    public function logout(): void
    {
        Auth::logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();
    }
}
