<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Check if the user has been deactivated.
 */
class CheckDeactivated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) throw ApiException::accessTokenInvalid();

        if ($user->deactivated_at !== null) throw ApiException::userDeactivated();

        return $next($request);
    }
}
