<?php

use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureConsultant;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RequiresTwoFactor;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'admin' => EnsureAdmin::class,
            'consultant' => EnsureConsultant::class,
            'super-admin' => EnsureSuperAdmin::class,
            'two-factor' => RequiresTwoFactor::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response) {
            if (in_array($response->getStatusCode(), [403, 404, 500, 503], true) && ! app()->runningInConsole()) {
                return Inertia::render('Error', [
                    'status' => $response->getStatusCode(),
                    'message' => $response->getStatusCode() === 500 ? 'Erro interno do servidor.' : null,
                ])
                    ->toResponse(request())
                    ->setStatusCode($response->getStatusCode());
            }

            return $response;
        });
    })->create();
