<?php

namespace App\DTO\Auth;

use App\Models\User;
use Carbon\Carbon;
use Laravel\Passport\PersonalAccessTokenResult;

readonly class ExtensionAuthData
{
    public function __construct(
        public int $id,
        public int $roleId,
        public string $username,
        public ?string $picture,
        public string $accessToken,
        public int $expiresAt,
        public ?TwitchAuthData $twitch = null,
    ) {}

    public static function fromModel(User $user, PersonalAccessTokenResult $token, ?TwitchAuthData $twitch = null): self
    {
        return new self(
            id: $user->id,
            roleId: $user->role_id,
            username: $user->username,
            picture: $user->picture,
            accessToken: $token->accessToken,
            expiresAt: Carbon::now()->addMonths(10)->timestamp,
            twitch: $twitch,
        );
    }
}
