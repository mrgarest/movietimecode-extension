<?php

namespace App\Clients;

use Illuminate\Support\Facades\Http;

class TmdbClient
{
    const API_BASE = "https://api.themoviedb.org/3";

    public static function withHeaders()
    {
        return Http::withHeaders([
            'Accept' => 'application/json',
        ])->withToken(config('services.tmdb.token'));
    }

    public static function get(string $url, $query = null)
    {
        $response = static::withHeaders()->get($url, $query);
        return $response->successful() ? $response->json() : null;
    }

    public static function searchMovie($query, $language = 'en-US', $page = 1, int|null $year = null)
    {
        $queryParams = [
            'query' => $query,
            'include_adult' => 'false',
            'language' => $language,
            'page' => $page,
        ];
        if ($year != null) $queryParams['year'] = $year;
        return static::get(self::API_BASE . '/search/movie', $queryParams);
    }

    public static function movieDetails($id, $language = 'en-US')
    {
        return static::get(self::API_BASE . "/movie/$id?language=$language");
    }

    public static function movieTranslations($id)
    {
        return static::get(self::API_BASE . "/movie/$id/translations");
    }

    public static function movieImages($id)
    {
        return static::get(self::API_BASE . "/movie/$id/images");
    }

    public static function movieExternalIds($id)
    {
        return static::get(self::API_BASE . "/movie/$id/external_ids");
    }

    public static function getImageUrl(string $size, $path)
    {
        return $path ? "https://image.tmdb.org/t/p/$size/$path" : null;
    }
}
