<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'admin'      => \App\Http\Middleware\EnsureAdmin::class,
            'consultant' => \App\Http\Middleware\EnsureConsultant::class,
            'two-factor' => \App\Http\Middleware\RequiresTwoFactor::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response) {
            if (in_array($response->getStatusCode(), [403, 404, 500, 503], true) && ! app()->runningInConsole()) {
                return \Inertia\Inertia::render('Error', [
                    'status'  => $response->getStatusCode(),
                    'message' => $response->getStatusCode() === 500 ? 'Erro interno do servidor.' : null,
                ])
                    ->toResponse(request())
                    ->setStatusCode($response->getStatusCode());
            }

            return $response;
        });
    })->create();
