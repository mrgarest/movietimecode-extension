<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExtensionAuthResource;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Exchange a temporary extension token for a permanent Access Token and user data.
     */
    public function extension(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|int',
            'token' => 'required|string'
        ]);

        return new ExtensionAuthResource($this->authService->extensionAuth($validated['id'], $validated['token']));
    }
}
