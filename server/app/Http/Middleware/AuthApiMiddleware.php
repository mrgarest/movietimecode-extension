<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * @deprecated old
 */
class AuthApiMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('api')->user();

        // Authorization check
        if (!$user) {
            throw ApiException::accessTokenInvalid();
        }

        // Deactivation check
        if ($user->deactivated_at) {
            throw ApiException::userDeactivated();
        }

        $request->setUserResolver(fn() => $user);

        return $next($request);
    }
}
