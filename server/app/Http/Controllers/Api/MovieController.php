<?php

namespace App\Http\Controllers\Api;

use App\Enums\MovieCompanyRole;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Movie\MovieCardResource;
use App\Http\Resources\Movie\MovieCheckResource;
use App\Http\Resources\Movie\MovieDetailResource;
use App\Http\Resources\Movie\MoviePreviewResource;
use App\Http\Resources\Movie\MovieSearchResource;
use App\Http\Resources\SuccessResource;
use App\Models\Movie;
use App\Services\CompanyService;
use App\Services\IMDB\ImdbService;
use App\Services\MovieService;
use Illuminate\Http\Request;

class MovieController extends Controller
{
    public function __construct(
        protected MovieService $movieService
    ) {}

    /**
     * Search for movies by title.
     */
    public function search(Request $request)
    {
        $validated = $request->validate([
            'q' => 'required|string',
            'page' => 'nullable|integer',
            'year' => 'nullable|integer',
            'with' => 'nullable|string',
        ]);

        $with = $request->filled('with') ? explode(',', $validated['with']) : [];
        MovieSearchResource::setWith($with);

        return new SuccessResource([
            'items' => MovieSearchResource::collection($this->movieService->searchTmdb(
                title: trim(urldecode($validated['q'])),
                page: $validated['page'] ?? 1,
                year: $validated['year'] ?? null,
                with: $with
            ))
        ]);
    }

    /**
     * Gives info about the movie if timecodes exist for the specified movie.
     */
    public function searchTimecodes(Request $request)
    {
        $validated = $request->validate([
            'q' => 'required|string',
            'year' => 'nullable|integer'
        ]);

        $data = $this->movieService->searchTimecodes(
            title: trim(urldecode($validated['q'])),
            year: $validated['year'] ?? null
        );

        if (!$data) throw ApiException::notFound();

        return new MoviePreviewResource($data);
    }

    /**
     * Movie check.
     */
    public function check(
        int $movieId,
        MovieService $movieService,
        CompanyService $companyService,
        ImdbService $imdbService
    ) {
        // Get the movie model
        $movie = $movieService->getOrImport(
            tmdbId: $movieId
        );

        if (!$movie) throw ApiException::notFound();

        // Get companies for the movie
        $companies = $companyService->getForMovie($movie);
        $productions = $companies->where('role', MovieCompanyRole::PRODUCTION)->values();
        $distributors = $companies->where('role', MovieCompanyRole::DISTRIBUTOR)->values();

        // Recommendation for the movie
        $recommendation = $movieService->checkRecommendation(
            movie: $movie,
            productions: $productions,
            distributors: $distributors,
        );

        return new MovieCheckResource([
            'tmdb_id' => (int) $movieId,
            'movie' => $movie,
            'productions' => $productions,
            'distributors' => $distributors,
            'imdb' => [
                'id' => $imdbService->getImdbId($movie),
                'content_ratings' => $imdbService->getContentRatings($movie)
            ],
            'recommendation' => $recommendation
        ]);
    }

    /**
     * Movie Details.
     */
    public function details(
        int $movieId,
        MovieService $movieService,
        CompanyService $companyService,
        ImdbService $imdbService
    ) {
        // Get the movie model
        $movie = $movieService->getOrImport(
            tmdbId: $movieId
        );

        if (!$movie) throw ApiException::notFound();

        $translation = $movieService->getTranslation($movie);

        // Get companies for the movie
        $companies = $companyService->getForMovie($movie);
        $productions = $companies->where('role', MovieCompanyRole::PRODUCTION)->values();
        $distributors = $companies->where('role', MovieCompanyRole::DISTRIBUTOR)->values();

        // Recommendation for the movie
        $recommendation = $movieService->checkRecommendation(
            movie: $movie,
            productions: $productions,
            distributors: $distributors,
        );

        return new MovieDetailResource([
            'tmdb_id' => (int) $movieId,
            'movie' => $movie,
            'translation' => $translation,
            'productions' => $productions,
            'distributors' => $distributors,
            'imdb' => [
                'id' => $imdbService->getImdbId($movie),
                'content_ratings' => $imdbService->getContentRatings($movie)
            ],
            'recommendation' => $recommendation
        ]);
    }

    /**
     * Movie latest.
     */
    public function latest(MovieService $movieService)
    {
        $limit = 15;

        return new SuccessResource([
            'checked' => MovieCardResource::collection($movieService->latestChecked(limit: $limit)),
            'timecodes' => MovieCardResource::collection($movieService->latestWithTimecodes(limit: $limit)['items'])
        ]);
    }

    /**
     * List of movies with timecodes.
     */
    public function withTimecodes(Request $request, MovieService $movieService)
    {
        $validated = $request->validate([
            'page' => 'nullable|integer'
        ]);

        $data = $movieService->latestWithTimecodes(page: $validated['page'] ?? 1);

        return new SuccessResource([
            'current_page' => $data['current_page'],
            'last_page' => $data['last_page'],
            'items' => MovieCardResource::collection($data['items']),
        ]);
    }

    /**
     * Movie check.
     * 
     * @deprecated use check()
     */
    public function checkOld(
        Request $request,
        MovieService $movieService,
        CompanyService $companyService,
        ImdbService $imdbService
    ) {
        $validated = $request->validate([
            'id' => 'nullable|integer',
            'tmdb_id' => 'nullable|integer'
        ]);

        // Get the movie model
        $movie = isset($validated['id']) ? Movie::find($validated['id']) : $movieService->getOrImport(
            tmdbId: $validated['tmdb_id']
        );

        if (!$movie) throw ApiException::notFound();

        // Get companies for the movie
        $companies = $companyService->getForMovie($movie);

        return new MovieCheckResource([
            'tmdb_id' => $validated['tmdb_id'] ?? null,
            'movie' => $movie,
            'productions' => $companies->where('role', MovieCompanyRole::PRODUCTION)->values(),
            'distributors' => $companies->where('role', MovieCompanyRole::DISTRIBUTOR)->values(),
            'imdb' => [
                'id' => $imdbService->getImdbId($movie),
                'content_ratings' => $imdbService->getContentRatings($movie)
            ]
        ]);
    }

    /**
     * Search for movies by title.
     * 
     * @deprecated use search()
     */
    public function searchOld(Request $request)
    {
        $validated = $request->validate([
            'q' => 'required|string',
            'page' => 'nullable|integer',
            'year' => 'nullable|integer',
        ]);

        $with = ['movieId'];
        MovieSearchResource::setWith($with);

        return new SuccessResource([
            'items' => MovieSearchResource::collection($this->movieService->searchTmdb(
                title: trim(urldecode($validated['q'])),
                page: $validated['page'] ?? 1,
                year: $validated['year'] ?? null,
                with: $with
            ))
        ]);
    }
}
