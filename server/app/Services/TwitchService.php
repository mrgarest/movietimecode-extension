<?php

namespace App\Services;

use App\Cache\TwitchCacheKey;
use App\Clients\TwitchClient;
use App\DTO\Auth\TwitchAuthData;
use App\DTO\Twitch\StreamStatusData;
use App\Exceptions\ApiException;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class TwitchService
{
    public function __construct(
        protected TwitchService $twitchService,
        protected TwitchClient $twitchClient
    ) {}

    /**
     * Get a new access token from Twitch.
     * 
     * @param string $refreshToken
     * @return TwitchAuthData
     */
    public function token(string $refreshToken): TwitchAuthData
    {
        $data = $this->twitchClient->refreshToken($refreshToken);

        if (!$data) throw ApiException::clientResponseNotReceived();

        return TwitchAuthData::fromTwitch($data);
    }

    /**
     * Get information about stream.
     * 
     * @param string $accessToken
     * @param string $username
     * @return StreamStatusData|null
     */
    public function stream(string $accessToken, string $username): ?StreamStatusData
    {
        $data = Cache::remember(TwitchCacheKey::stream($username), Carbon::now()->addMinutes(5), function () use ($username, $accessToken) {
            return $this->twitchClient->stream($accessToken, $username);
        });

        return $data ? StreamStatusData::fromTwitch($data) : null;
    }
}
