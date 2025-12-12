<?php

namespace App\Http\Middleware;


use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use MrGarest\EchoApi\EchoApi;
use Symfony\Component\HttpFoundation\Response;

class AuthApiMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::guard('api')->guest()) {
            return EchoApi::findError('ACCESS_TOKEN_INVALID');
        }

        $user = Auth::guard('api')->user();
        if (!$user) return EchoApi::findError('USER_NOT_FOUND');

        if ($user->deactivated_at != null) return EchoApi::findError('USER_DEACTIVATED');
        $request->setUserResolver(fn() => $user);
        return $next($request);
    }
}
