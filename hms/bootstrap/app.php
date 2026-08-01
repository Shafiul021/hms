<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum stateful SPA authentication
        $middleware->statefulApi();

        // Spatie role/permission middleware aliases
        $middleware->alias([
            'role'       => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->is('api/*') && !config('app.debug')) {
                // If it is not a validation or standard HTTP exception, show a generic 500 error
                if (!$e instanceof \Illuminate\Validation\ValidationException && 
                    !$e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                    return response()->json([
                        'message' => 'Server Error. Please contact support.',
                    ], 500);
                }
            }
        });
    })->create();
