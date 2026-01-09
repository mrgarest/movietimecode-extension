<?php

namespace App\Services;

use App\Cache\TimecodeCacheKey;
use App\DTO\Timecode\Editor\TimecodeEditData;
use App\DTO\Timecode\Editor\TimecodeSegmentEditData;
use App\DTO\Timecode\TimecodeAuthorData;
use App\DTO\Timecode\TimecodeData;
use App\DTO\Timecode\TimecodeEditorData;
use App\DTO\Timecode\TimecodeSegmentData;
use App\Exceptions\ApiException;
use App\Models\MovieTimecode;
use App\Models\MovieTimecodeSegment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TimecodeService
{
    /**
     * Get a collection of timecode authors with timecode information.
     *
     * @param int $movieId
     * @return Collection
     */
    public function getAuthors(int $movieId): Collection
    {
        $data = Cache::remember(TimecodeCacheKey::authors($movieId), Carbon::now()->addMinutes(5), function () use ($movieId) {
            return MovieTimecode::movieId($movieId)
                ->whereHas('user', fn($u) => $u->whereNull('deleted_at'))
                ->withCount('segments')
                ->with('user:id,username')
                ->orderByDesc('used_count')
                ->get()
                ->map(fn(MovieTimecode $tc) => TimecodeAuthorData::fromModel($tc)->toArray())
                ->all();
        });

        return collect($data)->map(fn(array $item) => TimecodeAuthorData::fromArray($item));
    }

    /**
     * Get timecodes for a movie from a specific author.
     *
     * @param int $timecodeId
     * @return TimecodeData|null
     */
    public function getTimecodes(int $timecodeId): ?TimecodeData
    {
        $data = Cache::remember(TimecodeCacheKey::timecodes($timecodeId), now()->addMinutes(10), function () use ($timecodeId) {
            $segments = MovieTimecodeSegment::timecodeId($timecodeId)
                ->orderBy('start_time')
                ->get(['id', 'tag_id', 'action_id', 'start_time', 'end_time']);

            if ($segments->isEmpty()) {
                return null;
            }

            $segment = $segments->first();
            return [
                'movie_id' => $segment->movie_id,
                'timecode_id' => $segment->timecode_id,
                'segments' => $segments->map(fn($s) => TimecodeSegmentData::toArrayFromModel($s))
            ];
        });

        if (!isset($data['segments'])) return null;

        return new TimecodeData(
            id: $data['timecode_id'],
            movieId: $data['movie_id'],
            segments: collect($data['segments'])->map(fn($s) => TimecodeSegmentData::fromArray($s))
        );
    }

    /**
     * Adds new timecodes to the database under a specific user if they have not previously added them to a specific movie.
     *
     * @param TimecodeEditData $data
     * @param int $tmdbId
     * @param User $user
     * @param MovieService $movieService
     */
    public function new(TimecodeEditData $data, int $tmdbId, User $user, MovieService $movieService)
    {
        // Get the movie model
        $movie = $movieService->getOrImport($tmdbId);

        if (!$movie) throw ApiException::notFound();

        // If timecodes have already been added earlier by this user, we return an error. 
        $hasTimecode = MovieTimecode::userId($user->id)
            ->movieId($movie->id)
            ->exists();
        if (!$hasTimecode) throw ApiException::timecodesAlreadyExist();

        DB::transaction(function () use ($data, $user, $movie) {
            $timecode = MovieTimecode::create([
                'user_id' => $user->id,
                'movie_id' => $movie->id,
                'duration' => $data->duration
            ]);

            if ($data->segments->isNotEmpty()) {
                $now = Carbon::now();
                $segmentData = $data->segments->map(function (TimecodeSegmentEditData $segment) use ($user, $movie, $timecode, $now) {
                    return [
                        'user_id' => $user->id,
                        'movie_id' => $movie->id,
                        'timecode_id' => $timecode->id,
                        'tag_id' => $segment->tag->value,
                        'start_time' => $segment->startTime,
                        'end_time' => $segment->endTime,
                        'description' => $segment->description ? trim($segment->description) : null,
                        'created_at' => $now,
                        'updated_at' => $now
                    ];
                })->all();
                MovieTimecodeSegment::insert($segmentData);
            }
        });

        // Clearing the timecode cache
        Cache::forget(TimecodeCacheKey::authors($movie->id));

        // Sending a notification about a new timecodes.
        (new TelegramNotificationService())->newTimecodesAdded($user, $movie, $data->segments->count());
    }

    /**
     * Editing existing timecodes for a movie.
     *
     * @param TimecodeEditData $data
     * @param User $user
     * @param int $timecodeId
     * @param MovieService $movieService
     */
    public function edit(TimecodeEditData $data, User $user, int $timecodeId)
    {
        $timecode = MovieTimecode::with('segments')->find($timecodeId)->first();

        if (!$timecode) throw ApiException::notFound();

        if ($user->id !== $timecode->user_id && !$user->isAdmin()) throw ApiException::permissionDenied();

        DB::transaction(function () use ($timecode, $data) {
            // Update the duration if it has changed
            if ($timecode->duration !== $data->duration) {
                $timecode->update(['duration' => $data->duration]);
            }

            $existingSegments = $timecode->segments;

            // Get the IDs of segments that arrived in data (for updating)
            $dtoSegmentIds = $data->segments->map(fn($s) => $s->id)->filter()->toArray();

            // Deletion of segments that are not in the new list
            $idsToDelete = $existingSegments->pluck('id')->diff($dtoSegmentIds);
            if ($idsToDelete->isNotEmpty()) {
                MovieTimecodeSegment::whereIn('id', $idsToDelete)->delete();
            }

            // Updates and creation
            $now = Carbon::now();
            $newSegments = [];

            /** @var TimecodeSegmentEditData $segment */
            foreach ($data->segments as $segment) {

                // Data array for creation and updating
                $item = [
                    'tag_id' => $segment->tag->value,
                    'start_time' => $segment->startTime,
                    'end_time' => $segment->endTime,
                    'description' => $segment->description ? trim($segment->description) : null
                ];

                if ($segment->id) {
                    // Updating existing segments
                    MovieTimecodeSegment::where('id', $segment->id)->update($item);
                } else {
                    // Forming an array for mass creation
                    $newSegments[] = array_merge([
                        'user_id' => $timecode->user_id,
                        'movie_id' => $timecode->movie_id,
                        'timecode_id' => $timecode->id,
                        'action_id' => null,
                        'created_at' => $now,
                        'updated_at' => $now
                    ], $item);
                }
            }

            // Mass creation of new segments
            if (!empty($newSegments)) {
                MovieTimecodeSegment::insert($newSegments);
            }

            // Clearing the timecode cache
            Cache::forget(TimecodeCacheKey::authors($timecode->movie_id));
            Cache::forget(TimecodeCacheKey::timecodes($timecode->id));
        });
    }

    /**
     * Get information for the timecode editor.
     *
     * @param User $user
     * @param int $timecodeId
     * @return TimecodeEditorData|null
     */
    public function editor(User $user, int $timecodeId): ?TimecodeEditorData
    {
        $timecode = MovieTimecode::with(['segments' => fn($q) => $q->orderBy('start_time')])->find($timecodeId);

        if (!$timecode) return null;

        if ($user->id !== $timecode->user_id && !$user->isAdmin()) throw ApiException::permissionDenied();

        return new TimecodeEditorData(
            id: $timecode->id,
            movieId: $timecode->movie_id,
            duration: $timecode->duration,
            segments: $timecode->segments->map(fn($s) => TimecodeSegmentData::fromModel($s)),
        );
    }

    /**
     * Deleting timecodes.
     *
     * @param User $user
     * @param int $timecodeId
     * @return bool
     */
    public function delete(User $user, int $timecodeId): bool
    {
        $timecode = MovieTimecode::find($timecodeId);
        if (!$timecode) return true;

        if ($user->id !== $timecode->user_id && !$user->isAdmin()) throw ApiException::permissionDenied();

        $movieId = $timecode->movie_id;
        $result = $timecode->delete();

        // Clearing the timecode cache
        Cache::forget(TimecodeCacheKey::authors($movieId));
        Cache::forget(TimecodeCacheKey::timecodes($timecode->id));

        return $result;
    }
}
