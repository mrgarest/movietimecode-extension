<?php

namespace App\Services;

use App\Cache\TwitchCacheKey;
use App\Clients\TwitchClient;
use App\DTO\Auth\TwitchAuthData;
use App\DTO\Twitch\StreamStatusData;
use App\Enums\AuthProvider;
use App\Enums\TwitchContentClassification;
use App\Exceptions\ApiException;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class TwitchService
{
    public function __construct(
        protected TwitchClient $twitchClient
    ) {}

    public function getAccountId(User $user): ?string
    {
        return Cache::remember(TwitchCacheKey::accountId($user->id), Carbon::now()->addMinutes(4), function () use ($user) {
            return $user->providers()->provider(AuthProvider::TWITCH)->value('account_id');
        });
    }

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
     * @param User $user
     * @return StreamStatusData|null
     */
    public function stream(string $accessToken, User $user): ?StreamStatusData
    {
        $accountId = $this->getAccountId($user);

        $data = Cache::remember(TwitchCacheKey::stream($accountId), Carbon::now()->addMinutes(5), function () use ($accountId, $accessToken) {
            return $this->twitchClient->stream($accessToken, $accountId);
        });

        return $data ? StreamStatusData::fromTwitch($data) : null;
    }

    /**
     * Updates content classification tags for the user's Twitch channel.
     * 
     * @param string $accessToken
     * @param User $user
     * @param array<int> $ids
     * @param bool $enabled
     * @return StreamStatusData|null
     */
    public function updateContentClassification(string $accessToken, User $user, array $ids, bool $enabled)
    {
        $accountId = $this->getAccountId($user);

        // Transform internal IDs into Twitch API tag format
        $labels = collect($ids)
            ->map(fn($id) => TwitchContentClassification::tryFrom($id))
            ->filter()
            ->map(fn(TwitchContentClassification $enum) => [
                'id' => $enum->toTwitchLabel(),
                'is_enabled' => $enabled
            ])
            ->values()
            ->toArray();
        if (empty($labels)) return;

        $this->twitchClient->channels($accessToken, $accountId, ['content_classification_labels' => $labels]);
    }
}
