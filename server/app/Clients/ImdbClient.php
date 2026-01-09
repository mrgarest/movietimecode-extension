<?php

namespace App\Clients;

use Illuminate\Support\Facades\Http;

class ImdbClient
{
    public function withHeaders()
    {
        $userAgents = config('user-agents');
        return Http::withHeaders([
            'Accept' => 'application/json',
            'User-Agent' => $userAgents[mt_rand(0, count($userAgents) - 1)]
        ]);
    }

    public function get(string $url)
    {
        /** @var Response $response */
        $response = static::withHeaders()->get($url);
        return $response->successful() ? $response->body() : null;
    }

    public function info($id)
    {
        return $this->get("https://www.imdb.com/title/$id/reference");
    }

    public function contentInfo($id)
    {
        return $this->get("https://www.imdb.com/title/$id/parentalguide/?ref_=tt_ov_pg#contentRating");
    }
}
