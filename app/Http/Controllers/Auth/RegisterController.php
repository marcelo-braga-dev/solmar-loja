<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Domains\Auth\Services\AuthService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class RegisterController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'email', 'unique:users,email'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'terms'                 => ['accepted'],
        ]);

        $user = $this->authService->register(
            name: $validated['name'],
            email: $validated['email'],
            password: $validated['password'],
        );

        Auth::login($user);

        return to_route('verification.notice');
    }
}
