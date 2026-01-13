<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use Redirect;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function extension()
    {
        return $this->authService->login(AuthService::TARGET_EXTENSION);
    }

    public function server()
    {
        return $this->authService->login(AuthService::TARGET_SERVER);
    }

    public function callback()
    {
        $data = $this->authService->callback();

        if($data->target === AuthService::TARGET_SERVER) {
            return Redirect::to('/dashboard');
        }
        return view('auth', ['jsonPageData' => $data->toArray()]);
    }
}
