<?php

namespace App\Services;

use App\Cache\MovieCacheKey;
use App\Clients\TmdbClient;
use App\DTO\Movie\MoviePreviewData;
use App\DTO\Movie\MovieSearchData;
use App\Enums\MovieCompanyRole;
use App\Enums\MovieExternalId as EnumsMovieExternalId;
use App\Enums\StorageId;
use App\Helpers\MovieHelper;
use App\Jobs\AddImagesToMovie;
use App\Models\Movie;
use App\Models\MovieCompany;
use App\Models\MovieExternalId;
use App\Models\MovieTranslation;
use App\Models\User;
use App\Services\IMDB\ImdbService;
use App\Services\IMDB\ImdbParserService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MovieService
{
    /**
     * Checking whether the language of the movie is blacklisted.
     *
     * @param string $language
     * @return bool
     */
    public function isBlacklistLanguage(string $language): bool
    {
        return in_array(strtolower($language), ['ru', 'by']);
    }

    /**
     * Get a list of movies from TMDB based on specified parameters.
     *
     * @param string $title
     * @param int $page
     * @param int|null $year
     * @param User|null $user
     * @param array $with
     * @return array|null
     */
    public function searchTmdb(string $title, int $page = 1, ?int $year = null, $with = []): Collection
    {
        $client = app(TmdbClient::class);

        $titles = MovieHelper::getTitles($title);

        // Get info about the movie from the client.
        $searchMovies = Cache::remember(MovieCacheKey::searchTmdb($title, $page, $year), Carbon::now()->addMinutes(10), function () use ($client, $titles, $page, $year) {
            foreach ($titles as $t) {
                $result = $client->searchMovie($t, 'uk-UA', $page, $year);

                if (!empty($result['results'])) {
                    return $result['results'];
                }
            }
            return [];
        });

        // If no movies are found, return an empty array
        if (empty($searchMovies)) return collect();

        // Creating a collection with movies
        $movies = collect($searchMovies)
            // Filter movies by language
            ->filter(fn($value) => isset($value['release_date']) && !$this->isBlacklistLanguage($value['original_language']))
            ->map(fn($value) => MovieSearchData::fromTmdb($value))
            ->values();

        if (!$movies->isNotEmpty()) return $movies;

        $needsMovieId = in_array('movieId', $with);
        $needsTimecodeId = in_array('timecodeId', $with);

        if (($needsMovieId || $needsTimecodeId)) {
            $user = $needsTimecodeId ? auth('api')->user() : null;
            $tmdbIds = $movies->pluck('tmdbId')->toArray();

            // Searching for movies via externalIds
            $dbMovies = Movie::query()
                ->select(['id'])
                ->whereHas('externalIds', function ($query) use ($tmdbIds) {
                    $query->externalId(EnumsMovieExternalId::TMDB)->whereIn('value', $tmdbIds);
                })
                ->with(['externalIds' => fn($q) => $q->externalId(EnumsMovieExternalId::TMDB)])
                ->when($needsTimecodeId && $user, function ($q) use ($user) {
                    $q->with(['movieTimecodes' => fn($q) => $q->select(['id', 'movie_id', 'user_id'])->userId($user->id)]);
                })
                ->get()
                ->keyBy(fn($m) => $m->externalIds->first()?->value);

            $movies->each(function (MovieSearchData $item) use ($user, $dbMovies, $needsMovieId, $needsTimecodeId) {
                if ($movie = $dbMovies->get($item->tmdbId)) {

                    if ($needsMovieId) {
                        $item->id = $movie->id;
                    }

                    if ($needsTimecodeId && $user && $movie->relationLoaded('movieTimecodes')) {
                        $item->timecodeId = $movie->movieTimecodes->first()?->id;
                    }
                }
            });
        }

        return $movies;
    }

    /**
     * Get information about the movie from the database. If the movie is not in the database, import it.
     *
     * @param int $tmdbId
     * 
     * @return Movie|null
     */
    public function getOrImport(int $tmdbId): ?Movie
    {
        $cacheKey = MovieCacheKey::externalTmdbId($tmdbId);

        // Convert the array back to a model object without querying the database
        if ($movieData = Cache::get($cacheKey)) return Movie::fromCache($movieData);

        $movie = Movie::whereRelation('externalIds', function ($query) use ($tmdbId) {
            $query->where('external_id', EnumsMovieExternalId::TMDB->value)->where('value', $tmdbId);
        })->first();

        if ($movie) {
            Cache::put($cacheKey, $movie->toCache(), Carbon::now()->addMinutes(5));
            return $movie;
        }

        return app()->call([$this, 'importFromTmdb'], ['tmdbId' => $tmdbId]);
    }

    /**
     * Get information about the movie from sources and add the movie to the database.
     *
     * @param TmdbClient $tmdbClient
     * @param ImdbService $imdbService
     * @param ImdbParserService $imdbParserService
     * @param CompanyService $companyService
     * @param int $tmdbId
     * 
     * @return Movie|null
     */
    public function importFromTmdb(
        TmdbClient $tmdbClient,
        ImdbService $imdbService,
        ImdbParserService $imdbParserService,
        CompanyService $companyService,
        int $tmdbId
    ): ?Movie {
        $movieDetails = $tmdbClient->movieDetails($tmdbId);
        $movieTranslations = $tmdbClient->movieTranslations($tmdbId);
        if (!$movieDetails || !$movieTranslations) return null;
        $infoImdb = $imdbParserService->info($movieDetails['imdb_id']);

        $movie = DB::transaction(function () use ($movieDetails, $movieTranslations, $companyService, $infoImdb) {
            // Saving the movie to the database
            $movie = Movie::create([
                'storage_id' => StorageId::TMDB->value,
                'lang_code' => strtolower($movieDetails['original_language']),
                'title' => $movieDetails['original_title'],
                'duration' => $movieDetails['runtime'] * 60,
                'poster_path' => !empty($movieDetails['poster_path']) ? str_replace('/', '', $movieDetails['poster_path']) : null,
                'backdrop_path' => !empty($movieDetails['backdrop_path']) ? str_replace('/', '', $movieDetails['backdrop_path']) : null,
                'rating_imdb' => $infoImdb->rating ?? null,
                'release_date' => $movieDetails['release_date'] ?? null
            ]);

            $now = Carbon::now();

            // Saving external IDs
            $externalIdsInsert = [[
                'movie_id' => $movie->id,
                'external_id' => EnumsMovieExternalId::TMDB,
                'value' => $movieDetails['id'],
                'created_at' => $now,
                'updated_at' => $now
            ]];
            if (isset($movieDetails['imdb_id'])) $externalIdsInsert[] = [
                'movie_id' => $movie->id,
                'external_id' => EnumsMovieExternalId::IMDB,
                'value' => $movieDetails['imdb_id'],
                'created_at' => $now,
                'updated_at' => $now
            ];
            MovieExternalId::insert($externalIdsInsert);

            // Translation processing
            $insertData = collect($movieTranslations['translations'])
                ->map(fn($t) => [
                    'lang_code' => strtolower($t['iso_639_1']),
                    'title' => $t['data']['title'] ?? null,
                    'poster_path' => !empty($t['poster_path']) ? str_replace('/', '', $t['poster_path']) : null,
                ])
                ->filter(fn($t) => !$this->isBlacklistLanguage($t['lang_code']) && !empty($t['title']))
                ->unique('lang_code')
                ->map(fn($t) => array_merge($t, [
                    'movie_id'   => $movie->id,
                    'created_at' => $now,
                    'updated_at' => $now
                ]))->toArray();

            if ($insertData) MovieTranslation::insert($insertData);
            $insertData = [];

            // Production processing with TMDB
            foreach ($movieDetails['production_companies'] ?? [] as $comp) {
                $insertData[] = $companyService->movieCompanyInsert(
                    movie: $movie,
                    company: $companyService->getOrCreateCompany($comp['name'], $comp['origin_country'] ?? null),
                    role: MovieCompanyRole::PRODUCTION
                );
            }

            // Processing distributors from IMDB
            foreach ($infoImdb->distributors ?? [] as $distributor) {
                $insertData[] = $companyService->movieCompanyInsert(
                    movie: $movie,
                    company: $companyService->getOrCreateCompany($distributor),
                    role: MovieCompanyRole::DISTRIBUTOR
                );
            }
            if (!empty($insertData)) MovieCompany::insert($insertData);
            $insertData = [];

            return $movie;
        });

        // Get the content rating from IMDB and add it to the movie
        if (isset($movieDetails['imdb_id'])) $imdbService->updateContentRatings(
            parserService: $imdbParserService,
            movie: $movie,
            imdbId: $movieDetails['imdb_id']
        );

        // Asynchronous addition of localized images to a movie
        AddImagesToMovie::dispatch($movie->id, $movieDetails['imdb_id'])->delay(Carbon::now()->addSeconds(mt_rand(2, 120)));

        return $movie;
    }

    /**
     * Get a translation for a movie.
     * 
     * @param Movie $movie
     * @param string $langCode
     * 
     * @return MovieTranslation|null
     */
    public function getTranslation(Movie $movie, string $langCode = 'uk'): ?MovieTranslation
    {
        $data = Cache::remember(MovieCacheKey::translation($movie->id, $langCode), Carbon::now()->addMinutes(5), function () use ($movie, $langCode) {
            $movie->loadMissing(['translations' => function ($q) use ($langCode) {
                $q->whereIn('lang_code', [$langCode, 'en']);
            }]);

            return $movie->translations->map(fn($t) => $t->getRawOriginal())->toArray();
        });

        $translations = MovieTranslation::hydrate($data);

        // First, select your preferred language. if it is not available, select English.
        return $translations->firstWhere('lang_code', $langCode)
            ?? $translations->firstWhere('lang_code', 'en');
    }

    /**
     * Gives info about the movie if timecodes exist for the specified movie.
     * 
     * @param string $title
     * @param int|null $year
     * @param string $langCode
     * @return MoviePreviewData|null
     */
    public function searchTimecodes(string $title, ?int $year = null, string $langCode = 'uk'): ?MoviePreviewData
    {
        $movie = Cache::remember(MovieCacheKey::preview($title, $year), Carbon::now()->addMinutes(5), function () use ($title, $year) {
            $movie = Movie::findByTitlesYear(MovieHelper::getTitles($title)->all(), $year)
                ->whereHas('movieTimecodes', function ($q) {
                    $q->whereHas('user', fn($u) => $u->whereNull('deleted_at'));
                })
                ->first();
            return $movie ? $movie->toCache() : null;
        });

        if (!$movie) return null;

        $movie = Movie::fromCache($movie);

        $translation = $this->getTranslation($movie, $langCode);

        if (!$translation) return null;

        return new MoviePreviewData(
            id: $movie->id,
            releaseYear: $movie->release_date?->year,
            title: $translation->title,
            originalTitle: $movie->title,
            posterPath: $translation->poster_path ?? $movie->poster_path,
        );
    }
}
