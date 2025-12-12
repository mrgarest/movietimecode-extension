<?php

namespace App\Clients;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

class TwitchClient
{
    const API_BASE = "https://api.twitch.tv";

    public static function withHeaders(string $accessToken)
    {
        return Http::withHeaders([
            'Client-ID' => 'Bearer ' . config('services.twitch.client_id'),
            'Accept' => 'application/json',
        ])->withToken($accessToken);
    }

    public static function stream(string $username, string $accessToken)
    {
        $response = static::withHeaders($accessToken)->get(self::API_BASE . '/helix/streams', [
            'user_login' => $username
        ]);
        if (!$response->successful()) return null;
        $data = $response->json()[0] ?? null;
        if (!$data) return null;

        return [
            'id' => $data['id'],
            'user_id' => $data['user_id'],
            'username' => $data['user_login'],
            'type' => $data['type'],
            'title' => $data['title'],
            'language' => $data['language'],
            'game' => [
                'id' => $data['game_id'],
                'name' =>  $data['game_name']
            ],
            'is_live' => $data['type'] == "live",
            'is_mature' => $data['type'],
        ];

        return $response->successful() ? $response->json() : null;
    }

    public static function refreshToken(string $refreshToken)
    {
        $response = Http::asForm()->post(self::API_BASE . '/oauth2/token', [
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
            'client_id' => config('services.twitch.client_id'),
            'client_secret' => config('services.twitch.client_secret'),
        ]);

        if (!$response->successful()) return null;
        $data = $response->json();
        return [
            'access_token' => $data['access_token'],
            'refresh_token' => $data['refresh_token'],
            'expires_at' => Carbon::now()->addSeconds($data['expires_in'])->timestamp,
        ];
    }
}
