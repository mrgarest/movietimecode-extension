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
        return view('auth', ['jsonPageData' => $this->authService->callback()->toArray()]);
    }
}
