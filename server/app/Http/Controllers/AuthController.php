<?php

namespace App\Http\Controllers;

use App\Enums\AuthProvider;
use App\Enums\RoleId;
use App\Models\ExpansionAuth;
use App\Models\User;
use App\Models\UserProvider;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Laravel\Socialite\Socialite;
use Laravel\Socialite\Two\TwitchProvider;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use MrGarest\EchoApi\EchoApi;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function logIn(Request $request)
    {
        /** @var TwitchProvider $driver */
        $driver = Socialite::driver(AuthProvider::TWITCH->value);

        // return $driver->scopes(['user:read:email'])->redirect();
        return $driver->scopes(['user:read:email', 'chat:edit', 'chat:read'])->redirect();
    }

    private function getAuthView(array $jsonPageData)
    {
        return view('auth', [
            'jsonPageData' => $jsonPageData
        ]);
    }

    public function callback(Request $request)
    {
        $provider = AuthProvider::TWITCH->value;
        try {
            $socialite = Socialite::driver($provider)->user();
        } catch (\Exception $ex) {
            $socialite = null;
        }

        if (!$socialite) return $this->getAuthView(['error' => 'auth.failed']);

        $userProvider = UserProvider::findUser($provider, $socialite->id)->with(['user' => function ($query) {
            $query->withTrashed();
        }])->first();

        if ($userProvider) {
            $user = $userProvider->user;
            if ($user->trashed()) return $this->getAuthView(['error' => 'auth.accountHasBeenDeleted']);
            if ($user->deactivated_at != null) return $this->getAuthView(['error' => 'auth.accountHasBeenDeactivated']);

            $user->update([
                'username' => $socialite->name,
                'email' => null,
                'picture' => $socialite->avatar,
            ]);

            $userProvider->update([
                'name' => $socialite->name,
            ]);
        } else {
            $user = DB::transaction(function () use ($provider, $socialite) {
                $now = Carbon::now();
                $user = User::create([
                    'role_id' => RoleId::USER->value,
                    'username' => $socialite->name,
                    // 'email' => $socialite->email,
                    'email' => null,
                    'password' => null,
                    'picture' => $socialite->avatar,
                    'email_verified_at' => null
                ]);

                UserProvider::insert([
                    'user_id' => $user->id,
                    'provider' => $provider,
                    'account_id' => $socialite->id,
                    'name' => $socialite->name,
                    'created_at' => $now,
                    'updated_at' => $now
                ]);
                return $user;
            });
        }

        if (!$user) return $this->getAuthView(['error' => 'auth.failedCreateUser']);

        $token = Str::random(32);
        ExpansionAuth::create([
            'user_id' => $user->id,
            'token' => $token,
            'payload' => [
                'twitch' => $socialite->token && $socialite->refreshToken ? [
                    'access_token' => $socialite->token,
                    'refresh_token' => $socialite->refreshToken,
                    'expires_at' => $socialite->expiresIn ? Carbon::now()->addSeconds($socialite->expiresIn)->timestamp : null,
                ] : null
            ],
            'expires_at' => Carbon::now()->addHours(1),
        ]);


        return $this->getAuthView([
            'auth' => [
                'id' => $user->id,
                'token' => $token,
            ]
        ]);
    }

    public function extension(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|int',
            'token' => 'required|string'
        ]);

        if ($validator->fails()) return EchoApi::httpError(Response::HTTP_BAD_REQUEST);
        $data = $validator->getData();

        $userToken = ExpansionAuth::with('user')->userId($data['id'])->token($data['token'])->first();
        $twitchPayload = $userToken->payload['twitch'] ?? null;

        $user = $userToken->user ?? null;
        if (!$userToken || !$user) return EchoApi::findError('USER_NOT_FOUND');

        ExpansionAuth::userId($user->id)->delete();

        $token = $user->createToken('auth', ['*']);

        return EchoApi::success([
            'id' => $user->id,
            'role_id' => $user->role_id,
            'username' => $user->username,
            'picture' => $user->picture,
            'twitch' => $twitchPayload !== null ? [
                'access_token' => $twitchPayload['access_token'],
                'refresh_token' => $twitchPayload['refresh_token'],
                'expires_at' => $twitchPayload['expires_at']
            ] : null,
            'access_token' => $token->accessToken,
            'expires_at' => Carbon::now()->addMonths(10)->timestamp
        ]);
    }
}
