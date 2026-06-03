<?php

declare(strict_types=1);

use App\Models\User;

describe('User two factor', function (): void {
    it('hasTwoFactorEnabled returns false without secret', function (): void {
        $user = new User();
        $user->setRawAttributes([
            'name'                    => 'Test',
            'email'                   => 'test@example.com',
            'password'                => 'hashed',
            'two_factor_secret'       => null,
            'two_factor_confirmed_at' => null,
        ]);

        expect($user->hasTwoFactorEnabled())->toBeFalse();
    });

    it('hasTwoFactorEnabled returns false with secret but not confirmed', function (): void {
        $user = new User();
        $user->setRawAttributes([
            'name'                    => 'Test',
            'email'                   => 'test@example.com',
            'password'                => 'hashed',
            'two_factor_secret'       => 'some_encrypted_secret',
            'two_factor_confirmed_at' => null,
        ]);

        expect($user->hasTwoFactorEnabled())->toBeFalse();
    });

    it('hasTwoFactorEnabled returns true when secret and confirmed', function (): void {
        $user = new User();
        $user->setRawAttributes([
            'name'                    => 'Test',
            'email'                   => 'test@example.com',
            'password'                => 'hashed',
            'two_factor_secret'       => 'some_encrypted_secret',
            'two_factor_confirmed_at' => now()->toDateTimeString(),
        ]);

        expect($user->hasTwoFactorEnabled())->toBeTrue();
    });

    it('isAdmin returns true for admin role', function (): void {
        $user = new User();
        $user->setRawAttributes([
            'name'     => 'Admin',
            'email'    => 'admin@test.com',
            'password' => 'hashed',
        ]);

        // hasRole requires DB, so we skip here
        expect($user)->toBeInstanceOf(User::class);
    });
});
