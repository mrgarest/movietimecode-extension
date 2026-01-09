<?php

namespace App\Clients;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

class TwitchClient
{
    const API_BASE = "https://api.twitch.tv";

    private ?string $clientId = null;
    private ?string $clientSecret = null;

    public function __construct()
    {
        $data = config('services.twitch.client_id');
        $this->clientId = $data['client_id'] ?? null;
        $this->clientSecret = $data['client_secret'] ?? null;
    }

    public function withHeaders(string $accessToken)
    {
        return Http::withHeaders([
            'Client-ID' => 'Bearer ' . $this->clientId,
            'Accept' => 'application/json',
        ])->withToken($accessToken);
    }

    /**
     * Get information about stream.
     * 
     * @param string $accessToken
     * @param string $username
     * @return array|null
     */
    public function stream(string $accessToken, string $username): ?array
    {
        /** @var Response $response */
        $response = $this->withHeaders($accessToken)->get(self::API_BASE . '/helix/streams', [
            'user_login' => $username
        ]);

        return $response->successful() ? $response->json()[0] ?? null : null;
    }

    /**
     * Get a new access token from Twitch.
     * 
     * @param string $refreshToken
     * @return array|null
     */
    public function refreshToken(string $refreshToken): ?array
    {
        /** @var Response $response */
        $response = Http::asForm()->post(self::API_BASE . '/oauth2/token', [
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret
        ]);

        return $response->successful() ? $response->json() : null;
    }
}
