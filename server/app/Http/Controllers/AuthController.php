<?php

namespace App\Http\Controllers;

use App\Services\AuthService;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function extension()
    {
        return $this->authService->login(AuthService::TARGET_EXTENSION);
    }

    public function callback()
    {
        $data = $this->authService->callback();

        // Outdated authorization method
        $oldLoginData = $data->success ? ['auth' => [
            'id' => $data->id,
            'token' => $data->token,
        ]] : ['error' => $data->langKey];

        return view('auth', [
            'jsonPageData' => array_merge($data->toArray(), $oldLoginData)
        ]);
    }
}
