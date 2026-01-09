<?php

namespace App\Services\IMDB;

use App\Cache\ImdbCacheKey;
use App\DTO\Movie\MovieContentRatingData;
use App\Enums\ImdbContentRatingId;
use App\Enums\MovieExternalId;
use App\Models\ImdbContentRating;
use App\Models\Movie;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class ImdbService
{
    /**
     * Get the IMDB ID for a movie.
     *
     * @param Movie $movie
     * @return string|null
     */
    public function getImdbId(Movie $movie): ?string
    {
        return Cache::remember(ImdbCacheKey::id($movie->id), Carbon::now()->addMinutes(5), function () use ($movie) {
            return $movie->externalIds->where('external_id', MovieExternalId::IMDB->value)->first()?->value;
        });
    }


    /**
     * Get content ratings from IMDB.
     *
     * @param Movie $movie
     * @return Collection
     */
    public function getContentRatings(Movie $movie): Collection
    {
        $cacheKey = ImdbCacheKey::contentRatings($movie->id);

        if ($cached = Cache::get($cacheKey)) {
            return collect($cached)->map(fn($item) => MovieContentRatingData::fromArray($item));
        }

        $movie->loadMissing('imdbContentRatings');

        $ratings = $movie->imdbContentRatings->map(function ($rating) {
            return MovieContentRatingData::fromModel($rating);
        });

        Cache::put($cacheKey, $ratings->map->toArray()->all(), Carbon::now()->addMinutes(5));

        return $ratings;
    }

    /**
     * Get the content rating from IMDB and update it for the movie.
     *
     * @param ImdbParserService $parserService
     * @param Movie $movie
     * @param string $imdbId
     */
    public function updateContentRatings(ImdbParserService $parserService, Movie $movie, string $imdbId): void
    {
        $content = $parserService->contentInfo($imdbId);
        if (empty($content['rating'])) return;

        $now = Carbon::now();
        $data = collect(ImdbContentRatingId::supportedMap())
            ->filter(fn($enum, $key) => isset($content['rating'][$key]))
            ->map(fn($enum, $key) => [
                'movie_id' => $movie->id,
                'content_id' => $enum->value,
                'level' => $content['rating'][$key],
                'created_at' => $now,
                'updated_at' => $now
            ])
            ->values()
            ->toArray();


        if (empty($data)) return;
        ImdbContentRating::upsert(
            $data,
            ['movie_id', 'content_id'],
            ['level', 'updated_at']
        );
    }
}
