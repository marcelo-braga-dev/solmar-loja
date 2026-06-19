<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Domains\Auth\Services\AuthService;
use App\Domains\Settings\Services\SettingsService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class LoginController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly SettingsService $settings,
    ) {}

    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => true,
            'status' => session('status'),
            'googleLoginEnabled' => (bool) $this->settings->get('google_oauth_enabled', false)
                && filled($this->settings->get('google_client_id'))
                && filled($this->settings->get('google_client_secret')),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['boolean'],
        ]);

        $user = $this->authService->login(
            email: $validated['email'],
            password: $validated['password'],
            remember: $validated['remember'] ?? false,
        );

        $request->session()->regenerate();

        return redirect()->intended(
            $user->isAdmin() ? '/admin' : '/conta'
        );
    }

    public function destroy(Request $request): RedirectResponse
    {
        $this->authService->logout();

        return to_route('home');
    }
}
