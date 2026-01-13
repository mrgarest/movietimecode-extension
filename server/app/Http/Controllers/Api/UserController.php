<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SuccessResource;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function me(Request $request)
    {
        $user = $request->user();

        return new SuccessResource([
            'id' => $user->id,
            'role_id' => $user->role_id->value,
            'username' => $user->username,
            'picture' => $user->picture
        ]);
    }
}
