<?php

namespace App\DTO\Auth;

use Carbon\Carbon;

readonly class TwitchAuthData
{
    public function __construct(
        public string $accessToken,
        public string $refreshToken,
        public int $expiresAt,
    ) {}

    public static function fromPayload(?array $payload): ?self
    {
        if (!$payload) return null;

        return new self(
            accessToken: $payload['access_token'],
            refreshToken: $payload['refresh_token'],
            expiresAt: (int) $payload['expires_at'],
        );
    }

    public static function fromTwitch(array $data): ?self
    {
        return new self(
            accessToken: $data['access_token'],
            refreshToken: $data['refresh_token'],
            expiresAt: Carbon::now()->addSeconds($data['expires_in'])->timestamp
        );
    }

    public static function fromSocialite(\Laravel\Socialite\Contracts\User $socialite): ?self
    {
        return new self(
            accessToken: $socialite->token,
            refreshToken: $socialite->refreshToken,
            expiresAt: $socialite->expiresIn ? Carbon::now()->addSeconds($socialite->expiresIn)->timestamp : null
        );
    }

    public function toArray(): array
    {
        return [
            'access_token' => $this->accessToken,
            'refresh_token' => $this->refreshToken,
            'expires_at' => $this->expiresAt
        ];
    }
}
