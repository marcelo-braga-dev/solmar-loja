<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

final class SocialiteController extends Controller
{
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable) {
            return to_route('login')->with('error', 'Falha ao autenticar com o Google. Tente novamente.');
        }

        // Buscar por google_id primeiro
        $user = User::where('google_id', $googleUser->getId())->first();

        if (! $user) {
            // Buscar por e-mail (conta já existe)
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                // Vincular google_id à conta existente
                $user->update([
                    'google_id'     => $googleUser->getId(),
                    'avatar_url'    => $googleUser->getAvatar(),
                    'auth_provider' => 'google',
                ]);
            } else {
                // Criar nova conta
                $user = User::create([
                    'name'           => $googleUser->getName(),
                    'email'          => $googleUser->getEmail(),
                    'password'       => Hash::make(Str::random(32)),
                    'google_id'      => $googleUser->getId(),
                    'avatar_url'     => $googleUser->getAvatar(),
                    'auth_provider'  => 'google',
                    'email_verified_at' => now(),
                ]);

                $user->assignRole('customer');
                $user->customer()->create(['type' => 'individual']);
            }
        }

        Auth::login($user, remember: true);

        return redirect()->intended('/conta')->with('success', "Bem-vindo, {$user->name}!");
    }
}
