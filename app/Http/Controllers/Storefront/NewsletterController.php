<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Marketing\Services\NewsletterService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class NewsletterController extends Controller
{
    public function __construct(private readonly NewsletterService $newsletterService) {}

    public function subscribe(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:100'],
        ]);

        $this->newsletterService->subscribe(
            email: $request->string('email')->value(),
            name: $request->string('name')->value() ?: null,
        );

        return back()->with('success', 'Inscrição realizada! Verifique seu e-mail para confirmar.');
    }

    public function confirm(string $token): RedirectResponse
    {
        if (! $this->newsletterService->confirm($token)) {
            return redirect()->route('home')->with('error', 'Link inválido ou já confirmado.');
        }

        return redirect()->route('home')->with('success', 'Inscrição confirmada! Bem-vindo(a) à nossa newsletter.');
    }

    public function unsubscribe(string $token): RedirectResponse
    {
        $this->newsletterService->unsubscribe($token);

        return redirect()->route('home')->with('success', 'Você foi removido(a) da nossa newsletter.');
    }
}
