<?php

namespace App\Http\Controllers\Api;

use App\Clients\TmdbClient;
use App\DTO\Timecode\Editor\TimecodeEditData;
use App\Exceptions\ApiException;
use App\Helpers\RequestManager;
use App\Http\Controllers\Controller;
use App\Http\Requests\TimecodeEditRequest;
use App\Http\Resources\SuccessResource;
use App\Http\Resources\Timecode\TimecodeAuthorResource;
use App\Http\Resources\Timecode\TimecodeEditorResource;
use App\Http\Resources\Timecode\TimecodeResource;
use App\Models\Movie;
use App\Models\MovieTimecode;
use App\Models\MovieTimecodeSegment;
use App\Notifications\AddedTimecodeNotifi;
use App\Services\MovieService;
use App\Services\TimecodeService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Validator;
use MrGarest\EchoApi\EchoApi;
use Symfony\Component\HttpFoundation\Response;

class TimecodeController extends Controller
{
    public function __construct(
        protected TimecodeService $timecodeService
    ) {}

    /**
     * Get a collection of timecode authors with timecode information.
     */
    public function authors(int $movieId)
    {
        return new SuccessResource([
            'authors' => TimecodeAuthorResource::collection($this->timecodeService->getAuthors($movieId))
        ]);
    }

    /**
     * Get timecodes for a movie from a specific author.
     */
    public function timecodes(int $timecodeId)
    {
        $data = $this->timecodeService->getTimecodes($timecodeId);
        if (!$data) throw ApiException::notFound();

        return new TimecodeResource($data);
    }

    /**
     * Adds new timecodes to the database.
     *
     * @param TimecodeEditRequest $request
     * @param int $movieId TMDB ID
     * @param MovieService $movieService
     */
    public function new(TimecodeEditRequest $request, int $movieId, MovieService $movieService)
    {
        $this->timecodeService->new(
            data: TimecodeEditData::fromRequest($request->validated()),
            tmdbId: $movieId,
            user: $request->user(),
            movieService: $movieService,
        );

        return new SuccessResource(null);
    }

    /**
     * Editing existing timecodes for a movie.
     *
     * @param TimecodeEditRequest $request
     * @param int $timecodeId
     */
    public function edit(TimecodeEditRequest $request, int $timecodeId)
    {
        $this->timecodeService->edit(
            data: TimecodeEditData::fromRequest($request->validated()),
            timecodeId: $timecodeId,
            user: $request->user()
        );

        return new SuccessResource(null);
    }

    /**
     * Get information for the timecode editor.
     */
    public function editor(Request $request, int $timecodeId)
    {
        $data = $this->timecodeService->editor(
            user: $request->user(),
            timecodeId: $timecodeId
        );
        if (!$data) throw ApiException::notFound();

        return new TimecodeEditorResource($data);
    }

    /**
     * Deleting timecodes.
     */
    public function delete(Request $request, int $timecodeId)
    {
        $validated = $request->validate([
            'force' => 'nullable|boolean'
        ]);

        $this->timecodeService->delete(
            user: $request->user(),
            timecodeId: $timecodeId,
            force: $validated['force'] ?? false
        );

        return new SuccessResource(null);
    }





    /**
     * Generates a cache key for the timecode segments
     *
     * @param int $timecodeId
     * @return string
     */
    public function timecodeSegmentCacheKey(int $timecodeId): string
    {
        return "timecode_segment_" . $timecodeId;
    }

    /**
     * Generates a cache key for the timecode editor
     *
     * @param int $userId
     * @param int $movieId
     * @return string
     */
    public function timecodeEditorCacheKey($userId, $movieId): string
    {
        return "timecode_editor_{$userId}_$movieId";
    }

    /**
     * Returns information about the movie and timecode for the editor.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     * 
     * @deprecated use editor
     */
    public function editorOld(Request $request, $movieId)
    {
        if (!$movieId) return EchoApi::httpError(Response::HTTP_BAD_REQUEST);

        $user = $request->user();

        $cacheKey = $this->timecodeEditorCacheKey($user->id, $movieId);
        $DATA = Cache::get($cacheKey, null);
        if ($DATA != null) return EchoApi::success($DATA);

        $movieTimecode = MovieTimecode::with('segments')->userId($user->id)->movieId($movieId)->first();

        if (!$movieTimecode) return EchoApi::httpError(Response::HTTP_NOT_FOUND);

        $timecodeSegments = $movieTimecode->segments ?? [];

        $segments = null;
        if (!$timecodeSegments->isEmpty()) {
            $segments = [];
            foreach ($timecodeSegments as $value) $segments[] = [
                'id' => $value->id,
                'tag_id' => $value->tag_id,
                'start_time' => $value->start_time,
                'end_time' => $value->end_time,
                'description' => $value->description
            ];
            usort($segments, function ($a, $b) {
                return $a['start_time'] <=> $b['start_time'];
            });
        }

        $DATA = [
            'movie_id' => $movieTimecode->movie_id,
            'timecode_id' => $movieTimecode->id,
            'duration' => $movieTimecode->duration,
            'segments' => $segments
        ];

        Cache::put($cacheKey, $DATA, Carbon::now()->addMinutes(10));

        return EchoApi::success($DATA);
    }

    /**
     * Adds new timecodes for the movie.
     *
     * @param Request $request 
     * @return \Illuminate\Http\JsonResponse
     * 
     * @deprecated use new
     */
    public function newOld(Request $request, MovieService $movieService)
    {
        $validator = Validator::make($request->json()->all(), [
            'movie_id' => 'nullable|integer',
            'tmdb_id' => 'required|integer',
            'duration' => 'required|integer|min:1',
            'segments' => 'nullable|array',
            'segments.*.tag_id' => 'required|integer',
            'segments.*.start_time' => 'required|integer|min:0',
            'segments.*.end_time' => 'required|integer|min:0|gt:segments.*.start_time',
            'segments.*.description' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) return EchoApi::httpError(Response::HTTP_BAD_REQUEST);

        $user = $request->user();
        $data = $validator->getData();

        // Get the movie model
        $movie = isset($data['tmdb_id']) ? $movieService->getOrImport($data['tmdb_id']) : Movie::find($data['movie_id']);

        if (!$movie) return EchoApi::httpError(Response::HTTP_NOT_FOUND);

        // If timecodes have already been added earlier by this user, we return an error. 
        $hasTimecode = MovieTimecode::userId($user->id)
            ->movieId($movie->id)
            ->exists();
        if ($hasTimecode) return EchoApi::httpError(Response::HTTP_CONFLICT);

        $movieTimecode = MovieTimecode::create([
            'user_id' => $user->id,
            'movie_id' => $movie->id,
            'duration' => $data['duration']
        ]);

        if ($data['segments'] != null) {
            $now = Carbon::now();
            $segmentData = [];
            foreach ($data['segments'] as $timecode) $segmentData[] = [
                'user_id' => $user->id,
                'movie_id' => $movie->id,
                'timecode_id' => $movieTimecode->id,
                'tag_id' => $timecode['tag_id'],
                'action_id' => null,
                'start_time' => $timecode['start_time'],
                'end_time' => $timecode['end_time'],
                'description' => $timecode['description'] != null ? trim($timecode['description']) : null,
                'created_at' => $now,
                'updated_at' => $now
            ];
            if (!empty($segmentData)) MovieTimecodeSegment::insert($segmentData);
        }

        $telegramNotifi = config('services.telegram-bot-api');
        if ($telegramNotifi['sendAddedTimecode'] && $telegramNotifi['token'] && $telegramNotifi['chat_id']) {
            Notification::route('telegram', $telegramNotifi['chat_id'])
                ->notify(new AddedTimecodeNotifi(
                    $user->id,
                    $user->username,
                    $movie->id,
                    $movie->title ?? 'N/A',
                    isset($data['segments']) ? count($data['segments']) : 0,
                    $movieTimecode->created_at
                ));
        }

        return EchoApi::success();
    }

    /**
     * Updates existing timecodes to the movie
     *
     * @param Request 
     * @param int $timecodeId
     * @return \Illuminate\Http\JsonResponse
     * 
     * @deprecated use edit
     */
    public function editOld(Request $request, $timecodeId)
    {
        $validator = Validator::make($request->json()->all(), [
            'duration' => 'required|integer|min:1',
            'segments' => 'nullable|array',
            'segments.*.id' => 'nullable|integer',
            'segments.*.tag_id' => 'required|integer',
            'segments.*.start_time' => 'required|integer|min:0',
            'segments.*.end_time' => 'required|integer|min:0|gt:segments.*.start_time',
            'segments.*.description' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) return EchoApi::httpError(Response::HTTP_BAD_REQUEST);

        $user = $request->user();
        if (!$user) return EchoApi::httpError(Response::HTTP_UNAUTHORIZED);

        $data = $validator->getData();

        $movieTimecode = MovieTimecode::userId($user->id)->with('segments')->find($timecodeId);
        if (!$movieTimecode) return EchoApi::httpError(Response::HTTP_NOT_FOUND);

        if ($movieTimecode->duration != $data['duration']) $movieTimecode->update(['duration' => $data['duration']]);

        $movieTimecodeSegments = $movieTimecode->segments;
        if ($data['segments'] != null) {
            $deleteIds = [];
            $updateIds = [];
            foreach ($movieTimecodeSegments as $segment) {
                $deleteIds[] = $segment->id;
                foreach ($data['segments'] as $timecode) {
                    if (($timecode['id'] ?? null) != $segment->id) continue;
                    $updateIds[] = $segment->id;
                    $segment->update([
                        'tag_id' => $timecode['tag_id'],
                        'action_id' => null,
                        'start_time' => $timecode['start_time'],
                        'end_time' => $timecode['end_time'],
                        'description' => $timecode['description'] != null ? trim($timecode['description']) : null
                    ]);
                }
            }

            $deleteIds = array_values(array_diff($deleteIds, $updateIds));

            $now = Carbon::now();
            $segmentData = [];
            foreach ($data['segments'] as $timecode) {
                $id = $timecode['id'] ?? null;
                if ($id !== null) continue;

                $segmentData[] = [
                    'user_id' => $user->id,
                    'movie_id' => $movieTimecode->movie_id,
                    'timecode_id' => $movieTimecode->id,
                    'tag_id' => $timecode['tag_id'],
                    'action_id' => null,
                    'start_time' => $timecode['start_time'],
                    'end_time' => $timecode['end_time'],
                    'description' => $timecode['description'] != null ? trim($timecode['description']) : null,
                    'created_at' => $now,
                    'updated_at' => $now
                ];
            }

            if (!empty($segmentData)) MovieTimecodeSegment::insert($segmentData);

            if (!empty($deleteIds)) MovieTimecodeSegment::whereIn('id', $deleteIds)->delete();
        } elseif (!$movieTimecodeSegments->isEmpty()) $movieTimecodeSegments->delete();

        Cache::forget($this->timecodeSegmentCacheKey($timecodeId));
        Cache::forget($this->timecodeEditorCacheKey($user->id, $movieTimecode->movie_id));

        return EchoApi::success();
    }


    /**
     * Search for a movie and timecodes by title.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     * 
     * @deprecated use movie/preview
     */
    public function searchOld(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'required|string',
            'year' => 'nullable|integer|digits:4'
        ]);

        if ($validator->fails()) return EchoApi::httpError(Response::HTTP_BAD_REQUEST);
        $dataValidator = $validator->getData();

        $title = trim(urldecode($dataValidator['q']));
        $titles = [$title];
        if (!empty($title) && str_contains($title, ' / ')) {
            $parts = explode(' / ', $title, 2);
            $firstPart = $parts[0] ?? null;
            $secondPart = $parts[1] ?? null;

            if ($firstPart) $titles[] = $firstPart;
            if ($secondPart) $titles[] = $secondPart;
        }

        $year = isset($dataValidator['year']) ? (int) $dataValidator['year'] : null;

        $langCode = 'uk';

        $cacheKey = "search_timecode_{$langCode}." . md5($title) . ($year ? "_{$year}" : '');
        $cacheData = Cache::get($cacheKey, null);
        if ($cacheData !== null) return EchoApi::success($cacheData);
        $select = ['id', 'storage_id', 'title', 'poster_path'];
        $movie = Movie::select(array_map(function ($item) {
            return 'movies.' . $item;
        }, array_merge(['release_date'], $select)))
            ->leftJoin('movie_translations', 'movie_translations.movie_id', '=', 'movies.id')
            ->where(function ($q) use ($titles) {
                foreach ($titles as $t) {
                    $t = trim($t);
                    $q->orWhere('movies.title', 'ILIKE', "%{$t}%")
                        ->orWhere('movie_translations.title', 'ILIKE', "%{$t}%");
                }
            })->when($year, function ($query, $year) {
                $start = ($year - 1) . '-01-01';
                $end   = ($year + 1) . '-12-31';
                $query->whereBetween('movies.release_date', [$start, $end]);
            })->with([
                'translations' => function ($query) use ($select, $langCode) {
                    $query->select(array_merge(['movie_id', 'lang_code'], $select))->where('lang_code', $langCode);
                },
                'movieTimecodes' => function ($query) {
                    $query->whereHas('user', function ($q) {
                        $q->whereNull('deleted_at');
                    })->withCount('segments')->with([
                        'user' => function ($query) {
                            $query->select('id', 'username');
                        }
                    ])->orderByDesc('used_count');
                }
            ])
            ->first();

        if (!$movie || ($movie && $movie->movieTimecodes->isEmpty())) return EchoApi::httpError(Response::HTTP_NOT_FOUND);

        $translation = $movie->translations[0] ?? null;

        $timecodes = null;
        if (!$movie->movieTimecodes->isEmpty()) {
            $timecodes = [];
            foreach ($movie->movieTimecodes as $movieTimecode) {
                $user = $movieTimecode->user;
                $timecodes[] = [
                    'id' => $movieTimecode->id,
                    'user' => [
                        'id' => $user->id,
                        'username' => $user->username,
                    ],
                    'duration' => $movieTimecode->duration,
                    'like_count' => $movieTimecode->like_count,
                    'dislike_count' => $movieTimecode->dislike_count,
                    'used_count' => $movieTimecode->used_count,
                    'segment_count' => $movieTimecode->segments_count
                ];
            }
        }

        $data = [
            'id' => $movie->id,
            'release_year' => $movie->release_date->year ?? null,
            'title' => $translation->title ?? null,
            'original_title' => $movie->title,
            'poster_url' => TmdbClient::getImageUrl('w200', $movie->poster_path),
            'timecodes' => $timecodes
        ];

        Cache::put($cacheKey, $data, Carbon::now()->addMinutes(10));

        return EchoApi::success($data);
    }

    /**
     * Returns timecode segments
     *
     * @param Request $request
     * @param int $timecodeId
     * @return \Illuminate\Http\JsonResponse
     * 
     * @deprecated use movie/preview
     */
    public function segment(Request $request, $timecodeId)
    {
        $cacheKey = $this->timecodeSegmentCacheKey($timecodeId);
        $data = Cache::get($cacheKey, null);

        if ($data == null) {
            $movieTimecodeSegments = MovieTimecodeSegment::select('id', 'timecode_id', 'tag_id', 'action_id', 'start_time', 'end_time')
                ->timecodeId($timecodeId)
                ->orderBy('start_time')
                ->get();

            if ($movieTimecodeSegments->isEmpty()) return EchoApi::httpError(Response::HTTP_NOT_FOUND);

            $segments = [];
            foreach ($movieTimecodeSegments as $value) $segments[] = [
                'id' => $value->id,
                'tag_id' => $value->tag_id,
                'action_id' => $value->action_id,
                'start_time' => $value->start_time,
                'end_time' => $value->end_time
            ];

            $data = [
                'timecode_id' => (int)$timecodeId,
                'segments' => $segments
            ];

            Cache::put($cacheKey, $data, Carbon::now()->addMinutes(5));
        }

        return EchoApi::success($data);
    }

    /**
     * Increases the timecode usage counter.
     *
     * @param Request $request
     * @param int $timecodeId
     * @return void
     */
    public function usedAnalytics(Request $request, $timecodeId)
    {
        $ipAddress = RequestManager::getIp($request);
        $usedCacheKey = "MovieTimecodeUsed_{$timecodeId}_" . md5($ipAddress);
        if (Cache::get($usedCacheKey, null) == null) {
            MovieTimecode::find($timecodeId)->increment('used_count');
            Cache::put($usedCacheKey, true, Carbon::now()->addMinutes(30));
        }

        return EchoApi::success();
    }
}
