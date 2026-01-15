<?php

namespace App\Clients;

use App\Exceptions\ApiException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class TwitchClient
{
    const API_BASE = "https://api.twitch.tv";

    private ?string $clientId = null;
    private ?string $clientSecret = null;

    public function __construct()
    {
        $data = config('services.twitch');
        $this->clientId = $data['client_id'] ?? null;
        $this->clientSecret = $data['client_secret'] ?? null;
    }

    public function withHeaders(string $accessToken): PendingRequest
    {
        return Http::withHeaders([
            'Client-Id' => $this->clientId,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])->withToken($accessToken);
    }

    /**
     * Handles the response from the API. If it was successful, it returns an array with json. If not, it throws an error.
     * 
     * @param Response $response
     * @return mixed
     */
    protected function handleResponse(Response $response): mixed
    {
        $data = $response->json();
        if ($response->successful()) {
            return $data;
        }


        $status = $response->status();

        throw match ($status) {
            401 => str_contains($data['message'] ?? '', 'Missing scope')
                ? ApiException::missingScope($data['message']) : ApiException::accessTokenInvalid(),
            403 => ApiException::forbidden(),
            404 => ApiException::notFound(),
            default => ApiException::badRequest($data['message'] ?? 'Unknown error'),
        };
    }

    /**
     * Get information about stream.
     * 
     * @param string $accessToken
     * @param int $userId
     * @return array|null
     */
    public function stream(string $accessToken, int $userId): ?array
    {
        /** @var Response $response */
        $response = $this->withHeaders($accessToken)->get(self::API_BASE . '/helix/streams', [
            'user_id' => $userId
        ]);

        return $this->handleResponse($response)[0] ?? null;
    }

    /**
     * Modify Channel Information.
     * 
     * @param string $accessToken
     * @param int $broadcasterId
     * @param array $data
     * @return bool
     */
    public function channels(string $accessToken, int $broadcasterId, array $data): bool
    {
        /** @var Response $response */
        $response = $this->withHeaders($accessToken)->patch(self::API_BASE . '/helix/channels?broadcaster_id=' . $broadcasterId, $data);

        $this->handleResponse($response);

        return true;
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
        $response = Http::asForm()->post('https://id.twitch.tv/oauth2/token', [
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret
        ]);

        return $this->handleResponse($response);
    }
}
