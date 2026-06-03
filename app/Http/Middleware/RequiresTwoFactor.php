<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RequiresTwoFactor
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->isAdmin()) {
            return $next($request);
        }

        if (! $user->hasTwoFactorEnabled()) {
            return $next($request);
        }

        if ($user->hasTwoFactorConfirmedInSession()) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Verificação de dois fatores necessária.'], 403);
        }

        return redirect()->route('two-factor.challenge');
    }
}
