<?php

namespace App\Providers;

use App\Exceptions\ApiException;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60, 15)->by($request->ip())->response(function (Request $request, array $headers) {
                throw ApiException::tooManyRequests();
            });
        });

        Passport::tokensCan([
            AuthService::TARGET_EXTENSION => 'Permission to use extension API',
            AuthService::TARGET_SERVER => 'Permission to use server API',
        ]);
    }
}
