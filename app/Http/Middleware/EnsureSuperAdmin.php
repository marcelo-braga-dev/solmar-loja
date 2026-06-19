<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isSuperAdmin()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Acesso não autorizado.'], 403);
            }

            return redirect()->route('admin.dashboard')
                ->with('error', 'Acesso restrito ao administrador.');
        }

        return $next($request);
    }
}
