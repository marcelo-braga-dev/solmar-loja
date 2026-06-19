<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Settings\Services\SettingsService;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

final class SocialiteController extends Controller
{
    public function __construct(
        private readonly SettingsService $settings,
    ) {}

    public function redirectToGoogle(): RedirectResponse
    {
        if (! $this->isGoogleLoginEnabled()) {
            return to_route('login')->with('error', 'Login com Google não está habilitado.');
        }

        $this->configureGoogleDriver();

        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(): RedirectResponse
    {
        if (! $this->isGoogleLoginEnabled()) {
            return to_route('login')->with('error', 'Login com Google não está habilitado.');
        }

        $this->configureGoogleDriver();

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
                    'google_id' => $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'auth_provider' => 'google',
                ]);
            } else {
                // Criar nova conta
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'password' => Hash::make(Str::random(32)),
                    'google_id' => $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'auth_provider' => 'google',
                    'email_verified_at' => now(),
                ]);

                $user->assignRole('customer');
                $user->customer()->create(['type' => 'individual']);
            }
        }

        Auth::login($user, remember: true);

        return redirect()->intended('/conta')->with('success', "Bem-vindo, {$user->name}!");
    }

    public function isGoogleLoginEnabled(): bool
    {
        return (bool) $this->settings->get('google_oauth_enabled', false)
            && filled($this->settings->get('google_client_id'))
            && filled($this->settings->get('google_client_secret'));
    }

    public function testConfiguration(): JsonResponse
    {
        $checks = [];

        $enabled = (bool) $this->settings->get('google_oauth_enabled', false);
        $checks[] = [
            'label' => 'Login com Google habilitado',
            'ok' => $enabled,
            'detail' => $enabled ? null : 'Ative o botão "Login com Google habilitado" e salve as configurações.',
        ];

        $clientId = (string) $this->settings->get('google_client_id', '');
        $validClientId = filled($clientId) && str_ends_with($clientId, '.apps.googleusercontent.com');
        $checks[] = [
            'label' => 'Client ID configurado e com formato válido',
            'ok' => $validClientId,
            'detail' => $validClientId ? null : 'O Client ID deve terminar com ".apps.googleusercontent.com" (copiado do Google Cloud Console).',
        ];

        $clientSecret = (string) $this->settings->get('google_client_secret', '');
        $validSecret = mb_strlen($clientSecret) >= 10;
        $checks[] = [
            'label' => 'Client Secret configurado',
            'ok' => $validSecret,
            'detail' => $validSecret ? null : 'Cole o Client Secret gerado pelo Google Cloud Console.',
        ];

        $configuredRedirect = (string) $this->settings->get('google_redirect_url', '');
        $expectedRedirect = route('auth.google.callback');
        $redirectMatches = rtrim($configuredRedirect, '/') === rtrim($expectedRedirect, '/');
        $checks[] = [
            'label' => 'URL de callback corresponde à URL da aplicação',
            'ok' => $redirectMatches,
            'detail' => $redirectMatches ? null : "Configurado: {$configuredRedirect} — Esperado: {$expectedRedirect}",
        ];

        $googleReachable = $this->canReachGoogle();
        $checks[] = [
            'label' => 'Conectividade com os servidores OAuth do Google',
            'ok' => $googleReachable,
            'detail' => $googleReachable ? null : 'O servidor não conseguiu acessar accounts.google.com. Verifique firewall/DNS/proxy de saída.',
        ];

        $success = ! in_array(false, array_column($checks, 'ok'), true);

        return response()->json([
            'success' => $success,
            'message' => $success
                ? 'Configuração válida. O login com Google está pronto para uso.'
                : 'Foram encontrados problemas na configuração. Veja os detalhes abaixo.',
            'checks' => $checks,
        ]);
    }

    private function canReachGoogle(): bool
    {
        try {
            return Http::timeout(5)
                ->get('https://accounts.google.com/.well-known/openid-configuration')
                ->successful();
        } catch (\Throwable) {
            return false;
        }
    }

    private function configureGoogleDriver(): void
    {
        config([
            'services.google.client_id' => $this->settings->get('google_client_id') ?: config('services.google.client_id'),
            'services.google.client_secret' => $this->settings->get('google_client_secret') ?: config('services.google.client_secret'),
            'services.google.redirect' => $this->settings->get('google_redirect_url') ?: config('services.google.redirect'),
        ]);
    }
}
