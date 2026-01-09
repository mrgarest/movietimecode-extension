<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Login for the extension.
     */
    public function extension()
    {
        return $this->authService->login(AuthService::TARGET_EXTENSION);
    }

    public function callback(Request $request)
    {
        parse_str($request->input('state'), $stateData);
        $target = $stateData['target'] ?? 'extension';

        $data = $this->authService->callback($target);

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
