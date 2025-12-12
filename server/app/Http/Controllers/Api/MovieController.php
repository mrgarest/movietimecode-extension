<?php

namespace App\Http\Controllers\Api;

use App\Clients\TmdbClient;
use App\Enums\MovieCompanyRole;
use App\Enums\MovieExternalId as EnumsMovieExternalId;
use App\Http\Controllers\Controller;
use App\Models\Movie;
use App\Models\MovieExternalId;
use App\Services\MovieService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use MrGarest\EchoApi\EchoApi;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Str;

class MovieController extends Controller
{
    /**
     * Search for movies by title.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'required|string',
            'page' => 'nullable|integer',
            'year' => 'nullable|integer'
        ]);

        if ($validator->fails()) return EchoApi::httpError(Response::HTTP_BAD_REQUEST);
        $dataValidator = $validator->getData();
        $page = $dataValidator['page'] ?? 1;
        $year = $dataValidator['year'] ?? null;
        $title = trim(urldecode($dataValidator['q']));
        $titles = [$title];
        if (!empty($title) && str_contains($title, ' / ')) {
            $parts = explode(' / ', $title, 2);
            $firstPart = $parts[0] ?? null;
            $secondPart = $parts[1] ?? null;

            if ($firstPart) $titles[] = $firstPart;
            if ($secondPart) $titles[] = $secondPart;
        }

        $cacheKey = 'movie_search_raw_' . md5($title) . '_' . $page . ($year != null ? '_' . $year : '');
        $data = Cache::get($cacheKey, null);

        if ($data == null) {
            $searchMovie = null;
            foreach ($titles as $t) {
                $result = TmdbClient::searchMovie($t, 'uk-UA', $page, $year);
                if ($result != null && !empty($result['results'])) {
                    $searchMovie = $result;
                    break;
                }
            }
            if ($searchMovie == null || empty($searchMovie['results'])) return EchoApi::success(['items' => []]);

            $data['items'] = [];
            $tmdbIds = [];

            foreach ($searchMovie['results'] as $value) {
                if (in_array($value['original_language'], [
                    'ru',
                    'by'
                ]) || !isset($value['release_date'])) continue;
                $data['items'][] = [
                    'id' => null,
                    'release_year' => Carbon::parse($value['release_date'])->year,
                    'tmdb_id' => $value['id'],
                    'title' => $value['title'],
                    'original_title' => $value['original_title'],
                    'poster_url' => TmdbClient::getImageUrl('w200', str_replace('/', '', $value['poster_path']))
                ];
            }
        }

        if (!empty($data['items'])) {
            $tmdbIds = array_column($data['items'], 'tmdb_id');

            if (!empty($tmdbIds)) {
                $movieExternalIds = MovieExternalId::externalId(EnumsMovieExternalId::TMDB)
                    ->whereIn('value', $tmdbIds)
                    ->get()
                    ->keyBy('value');

                foreach ($data['items'] as $key => $item) {
                    $tmdbId = $item['tmdb_id'];

                    if (isset($movieExternalIds[$tmdbId])) {
                        $data['items'][$key]['id'] = $movieExternalIds[$tmdbId]->movie_id;
                    }
                }
            }
        }

        if ($data == null) Cache::put($cacheKey, $data, Carbon::now()->addMinutes(15));

        return EchoApi::success($data);
    }

    public function check(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'nullable|integer',
            'tmdb_id' => 'nullable|integer'
        ]);
        if ($validator->fails()) return EchoApi::httpError(Response::HTTP_BAD_REQUEST);

        $dataValidator = $validator->getData();
        $idValidator = $dataValidator['id'] ?? null;

        $cacheKey = 'movie_check_';
        if ($idValidator) {
            $data = Cache::get($cacheKey . $idValidator, null);
            if ($data) return EchoApi::success($data);
        }

        $withMovie = [
            'companies' => function ($query) {
                $query->with(['company' => function ($query) {
                    $query->select('id', 'name');
                }]);
            },
            'externalIds' => function ($query) {
                $query->where('external_id', EnumsMovieExternalId::IMDB->value);
            },
            'imdbContentRatings'
        ];

        $selectMovie = [
            'id',
            'release_date',
            'rating_imdb'
        ];

        $movie = null;
        $movieId = null;
        if ($idValidator) $movieId = $idValidator;
        elseif (isset($dataValidator['tmdb_id'])) {
            $movieExternalId = MovieExternalId::with(['movie' => function ($query) use ($withMovie, $selectMovie) {
                $query->select($selectMovie)->with($withMovie);
            }])->externalAndValue(EnumsMovieExternalId::TMDB, $dataValidator['tmdb_id'])->first();

            $movie = $movieExternalId->movie ?? null;

            if ($movie) $movieId = $movie->id;
            else {
                $handler = MovieService::handleAddMovie($dataValidator['tmdb_id']);
                $movieId = $handler['movie']->id ?? null;
            }
        } else return EchoApi::httpError(Response::HTTP_BAD_REQUEST);

        if (!$movie || !$movieId) {
            $movie = Movie::with($withMovie)->select($selectMovie)->find($movieId);
        }

        if (!$movie) return EchoApi::httpError(Response::HTTP_NOT_FOUND);

        $productions = $distributors = null;
        if (!$movie->companies->isEmpty()) foreach ($movie->companies as $сompany) {
            $name = $сompany->company->name;
            if (Str::contains(mb_strtolower($name), [
                'warner',
                'disney',
                'netflix',
                'apple',
                'hbo',
                'amazon',
            ])) $hazardLevel = 2;
            elseif (Str::contains(mb_strtolower($name), [
                'marvel'
            ])) $hazardLevel = 3;
            else $hazardLevel = 0;

            $item = [
                'id' => $сompany->company_id,
                'hazard_level' => $hazardLevel,
                'name' => $name,
            ];

            switch ($сompany->role_id) {
                case MovieCompanyRole::PRODUCTION->value:
                    $productions[] = $item;
                    break;
                case MovieCompanyRole::DISTRIBUTOR->value:
                    $distributors[] = $item;
                    break;
                default:
                    continue;
            }
        }

        $imdbId = $movie->externalIds[0]->value ?? null;
        $contentRatings = null;
        if ($imdbId != null && !$movie->imdbContentRatings->isEmpty()) {
            $contentRatings = [];
            foreach ($movie->imdbContentRatings as $rating) $contentRatings[] = [
                'content_id' => $rating->content_id,
                'level' => $rating->level
            ];
        }

        $data = [
            'id' => $movie->id,
            'release' => $movie->release_date != null ? [
                'hazard' => $movie->release_date->greaterThan(Carbon::now()->subYears(4)),
                'release_date' => $movie->release_date->toDateString(),
            ] : null,
            'productions' => $productions,
            'distributors' => $distributors,
            'imdb' => $imdbId ? [
                'id' => $imdbId,
                'content_ratings' => $contentRatings
            ] : null
        ];

        Cache::put($cacheKey . $movie->id, $data, Carbon::now()->addMinutes(10));

        return EchoApi::success($data);
    }
}
