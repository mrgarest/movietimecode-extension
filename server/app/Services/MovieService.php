<?php

namespace App\Services;

use App\Clients\TmdbClient;
use App\Enums\ImdbContentRatingId;
use App\Enums\MovieCompanyRole;
use App\Enums\MovieExternalId as EnumsMovieExternalId;
use App\Enums\StorageId;
use App\Models\Company;
use App\Models\ImdbContentRating;
use App\Models\Movie;
use App\Models\MovieCompany;
use App\Models\MovieExternalId;
use App\Models\MovieTranslation;
use App\Services\ImdbService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class MovieService
{
    /**
     * Receives information about the film from sources and adds the film to the database
     *
     * @param int $tmdbId
     * @return array|null
     */
    public static function handleAddMovie($tmdbId)
    {
        $movieDetails = TmdbClient::movieDetails($tmdbId);
        if (!$movieDetails) return null;
        $movieTranslations = TmdbClient::movieTranslations($tmdbId);

        $infoImdb = ImdbService::info($movieDetails['imdb_id']);

        $storageId = StorageId::TMDB->value;
        $now = Carbon::now();
        $movieLangs = config('movie.langs');

        $movie = Movie::create([
            'storage_id' => $storageId,
            'lang_code' => strtolower($movieDetails['original_language']),
            'title' => $movieDetails['original_title'],
            'duration' => $movieDetails['runtime'] * 60,
            'poster_path' => $movieDetails['poster_path'] != null ? str_replace('/', '', $movieDetails['poster_path']) : null,
            'backdrop_path' => $movieDetails['backdrop_path'] != null ? str_replace('/', '', $movieDetails['backdrop_path']) : null,
            'rating_imdb' => $infoImdb['rating'] ?? null,
            'release_date' => $movieDetails['release_date']
        ]);

        if ($movieTranslations !== null) {
            $movieTranslationData = [];

            foreach ($movieTranslations['translations'] as $translation) {
                $langCode = strtolower($translation['iso_639_1']);
                $title = isset($translation['data']['title']) && $translation['data']['title'] != '' ? $translation['data']['title'] : null;

                if (!in_array($langCode, $movieLangs) || collect($movieTranslationData)->contains('lang_code', $langCode) || $title == null) continue;

                $movieTranslationData[] = [
                    'movie_id' => $movie->id,
                    'storage_id' => null,
                    'lang_code' => $langCode,
                    'title' => $title,
                    'created_at' => $now,
                    'updated_at' => $now
                ];
            }
            if (!empty($movieTranslationData)) MovieTranslation::insert($movieTranslationData);
        }

        MovieExternalId::insert([
            [
                'movie_id' => $movie->id,
                'external_id' => EnumsMovieExternalId::TMDB,
                'value' => $movieDetails['id'],
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'movie_id' => $movie->id,
                'external_id' => EnumsMovieExternalId::IMDB,
                'value' => $movieDetails['imdb_id'],
                'created_at' => $now,
                'updated_at' => $now
            ]
        ]);

        $cacheKeyMovieCompany = 'MovieCompany_name_id_';

        $movieCompanyInsert = [];
        if ($movieDetails['production_companies'] != null) foreach ($movieDetails['production_companies'] as $productionCompanies) {
            $name = trim($productionCompanies['name']);
            $cacheKey = $cacheKeyMovieCompany . md5($name);
            $movieCompanyId = Cache::get($cacheKey, null);

            if ($movieCompanyId == null) {
                $movieCompanyId = Company::firstOrCreate([
                    'name' => $name,
                ], [
                    'country' => strtolower($productionCompanies['origin_country']),
                ])->id;

                Cache::put($cacheKey, $movieCompanyId, Carbon::now()->addHour());
            }

            $movieCompanyInsert[] = [
                'role_id' => MovieCompanyRole::PRODUCTION->value,
                'movie_id' => $movie->id,
                'company_id' => $movieCompanyId,
                'created_at' => $now,
                'updated_at' => $now
            ];
        }

        if ($infoImdb != null && $infoImdb['distributors'] != null) foreach ($infoImdb['distributors'] as $distributor) {
            $cacheKey = $cacheKeyMovieCompany . md5($distributor);
            $movieCompanyId = Cache::get($cacheKey, null);

            if ($movieCompanyId == null) {
                $movieCompanyId = Company::firstOrCreate([
                    'name' => $distributor,
                ], [
                    'country' => null,
                ])->id;

                Cache::put($cacheKey, $movieCompanyId, Carbon::now()->addHour());
            }

            $movieCompanyInsert[] = [
                'role_id' => MovieCompanyRole::DISTRIBUTOR->value,
                'movie_id' => $movie->id,
                'company_id' => $movieCompanyId,
                'created_at' => $now,
                'updated_at' => $now
            ];
        }

        if (!empty($movieCompanyInsert)) MovieCompany::insert($movieCompanyInsert);


        $contentInfo = ImdbService::contentInfo($movieDetails['imdb_id']);

        if ($contentInfo != null && isset($contentInfo['rating'])) {
            $contentRatingInsert = [];
            if ($contentInfo['rating']['nudity'] !== null) $contentRatingInsert[] = [
                'content_id' => ImdbContentRatingId::NUDITY->value,
                'level' => $contentInfo['rating']['nudity']
            ];
            if ($contentInfo['rating']['violence'] !== null) $contentRatingInsert[] = [
                'content_id' => ImdbContentRatingId::VIOLENCE->value,
                'level' => $contentInfo['rating']['violence']
            ];
            if ($contentInfo['rating']['profanity'] !== null) $contentRatingInsert[] = [
                'content_id' => ImdbContentRatingId::PROFANITY->value,
                'level' => $contentInfo['rating']['profanity']
            ];
            if ($contentInfo['rating']['alcohol'] !== null) $contentRatingInsert[] = [
                'content_id' => ImdbContentRatingId::ALCOHOL->value,
                'level' => $contentInfo['rating']['alcohol']
            ];
            if ($contentInfo['rating']['frightening'] !== null) $contentRatingInsert[] = [
                'content_id' => ImdbContentRatingId::FRIGHTENING->value,
                'level' => $contentInfo['rating']['frightening']
            ];

            if (!empty($contentRatingInsert)) {
                foreach ($contentRatingInsert as $key => $value) $contentRatingInsert[$key] = array_merge([
                    'movie_id' => $movie->id,
                    'created_at' => $now,
                    'updated_at' => $now
                ], $value);
                ImdbContentRating::insert($contentRatingInsert);
            }
        }

        return [
            'movie' => $movie
        ];
    }
}
