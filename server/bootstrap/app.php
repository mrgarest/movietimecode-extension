<?php

use App\Exceptions\ApiException;
use App\Http\Middleware\CheckDeactivated;
use App\Http\Resources\ErrorResource;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Laravel\Passport\Exceptions\AuthenticationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: '*');
        $middleware->alias([
            'not_deactivated' => CheckDeactivated::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Intercepts validation error to implement custom error response
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ErrorResource::make(
                    code: 'BAD_REQUEST',
                    status: 400,
                    message: $e->getMessage(),
                )->toResponse($request);
            }
            return null;
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return ApiException::accessTokenInvalid();
            }
        });

        // Disables API error logging
        $exceptions->dontReport([
            ApiException::class,
        ]);
    })->create();
