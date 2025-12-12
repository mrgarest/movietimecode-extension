<?php

namespace App\Clients;

use Illuminate\Support\Facades\Http;

class ImdbClient
{
    public static function withHeaders()
    {
        $userAgents = config('user-agents');
        return Http::withHeaders([
            'Accept' => 'application/json',
            'User-Agent' => $userAgents[mt_rand(0, count($userAgents) - 1)]
        ]);
    }

    public static function get(string $url)
    {
        $response = static::withHeaders()->get($url);
        return $response->successful() ? $response->body() : null;
    }

    public static function info($id)
    {
        return static::get("https://www.imdb.com/title/$id/reference");
    }

    public static function contentInfo($id)
    {
        return static::get("https://www.imdb.com/title/$id/parentalguide/?ref_=tt_ov_pg#contentRating");
    }
}
