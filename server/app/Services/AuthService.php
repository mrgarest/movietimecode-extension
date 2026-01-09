<?php

namespace App\Services;

use App\DTO\Auth\CallbackAuthData;
use App\DTO\Auth\ExtensionAuthData;
use App\DTO\Auth\TwitchAuthData;
use App\Enums\AuthProvider;
use App\Enums\RoleId;
use App\Exceptions\ApiException;
use App\Models\ExpansionAuth;
use App\Models\User;
use App\Models\UserProvider;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Socialite;
use Laravel\Socialite\Two\TwitchProvider;

class AuthService
{
    public const TARGET_EXTENSION = 'extension';

    /**
     * Redirect the user of the application to the provider's authentication screen.
     *
     * @param string $target
     * @return RedirectResponse
     */
    public function login(string $target): RedirectResponse
    {
        /** @var TwitchProvider $driver */
        $driver = Socialite::driver(AuthProvider::TWITCH->value);

        return $driver->scopes(['user:read:email', 'chat:edit', 'chat:read'])->with(['state' => 'target=' . $target])->redirect();
    }

    /**
     * Handling the result of authorization via Socialite.
     * 
     * @param string|null $target
     * @return CallbackAuthData
     */
    public function callback(?string $target): CallbackAuthData
    {
        $provider = AuthProvider::TWITCH;

        try {
            $socialite = Socialite::driver($provider->value)->user();
        } catch (\Exception $ex) {
            \Log::error("Socialite error: " . $ex->getMessage());
            return new CallbackAuthData(
                success: false,
                target: $target,
                langKey: 'auth.failed'
            );
        }

        try {
            return DB::transaction(function () use ($socialite, $provider, $target) {
                $userProvider = UserProvider::with(['user' => fn($q) => $q->withTrashed()])
                    ->provider($provider)
                    ->accountId($socialite->id)
                    ->first();

                if ($userProvider) {
                    $user = $userProvider->user;

                    if ($user->trashed()) {
                        return new CallbackAuthData(
                            success: false,
                            target: $target,
                            langKey: 'auth.accountHasBeenDeleted'
                        );
                    }

                    if ($user->deactivated_at !== null) {
                        return new CallbackAuthData(
                            success: false,
                            target: $target,
                            langKey: 'auth.accountHasBeenDeactivated'
                        );
                    }

                    // Updating data every time you log in
                    $user->update([
                        'username' => $socialite->name ?? $socialite->nickname,
                        'picture' => $socialite->avatar
                    ]);

                    $userProvider->update(['name' => $socialite->name]);
                } else {
                    // Create a new user if not previously registered
                    $user = User::create([
                        'role_id' => RoleId::USER->value,
                        'username' => $socialite->name ?? $socialite->nickname,
                        'email' => null,
                        'picture' => $socialite->avatar,
                    ]);

                    UserProvider::create([
                        'user_id' => $user->id,
                        'provider' => $provider->value,
                        'account_id' => $socialite->id,
                        'name' => $socialite->name,
                    ]);
                }

                // Creating a temporary token for extension
                $token = Str::random(64);

                ExpansionAuth::create([
                    'user_id' => $user->id,
                    'token' => $token,
                    'payload' => [
                        'twitch' => TwitchAuthData::fromSocialite($socialite)->toArray()
                    ],
                    'expires_at' => Carbon::now()->addMinutes(5),
                ]);

                return new CallbackAuthData(
                    success: true,
                    target: $target,
                    id: $user->id,
                    token: $token
                );
            });
        } catch (\Throwable $ex) {
            \Log::error("transaction error: " . $ex->getMessage());
            return new CallbackAuthData(
                success: false,
                target: $target,
                langKey: 'auth.failedCreateUser'
            );
        }
    }

    /**
     * Exchange a temporary extension token for a permanent Access Token and user data.
     *
     * @param int $id
     * @param string $token
     * @return RedirectResponse
     */
    public function extensionAuth(int $id, string $token): ExtensionAuthData
    {
        $userToken = ExpansionAuth::with('user')
            ->userId($id)
            ->token($token)
            ->first();

        $user = $userToken->user ?? null;
        if (!$userToken || !$user) throw ApiException::userNotFound();

        $twitch = TwitchAuthData::fromPayload($userToken->payload['twitch'] ?? null);

        ExpansionAuth::userId($user->id)->delete();

        $tokenResult = $user->createToken('Extension', [self::TARGET_EXTENSION]);

        return ExtensionAuthData::fromModel($user, $tokenResult, $twitch);
    }
}
