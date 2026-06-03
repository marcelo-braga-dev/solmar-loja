<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isAdmin()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Acesso não autorizado.'], 403);
            }

            return redirect()->route('login')->with('error', 'Acesso restrito a administradores.');
        }

        return $next($request);
    }
}
