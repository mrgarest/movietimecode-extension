<?php

namespace App\Services;

use App\Enums\SanctionReason;
use App\Enums\SanctionType;
use App\Exceptions\ApiException;
use App\Models\Movie;
use App\Models\MovieSanction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class MovieSanctionService
{
    /**
     * Creates a movie sanction report for the specified user.
     *
     * @param string $deviceToken
     * @param string $username
     * @param SanctionType $type
     * @param SanctionReason|null $reason
     * @param int|null $movieId
     * @param int|null $tmdbId
     * @param string|null $comment
     * @param Carbon|null $occurredAt
     * @param UploadedFile|null $file
     *
     * @return MovieSanction
     */
    public function report(
        string $deviceToken,
        string $username,
        SanctionType $type,
        ?SanctionReason $reason,
        ?int $movieId = null,
        ?int $tmdbId = null,
        ?string $comment = null,
        ?Carbon $occurredAt = null,
        ?UploadedFile $file = null,
    ): MovieSanction {
        if (!$movieId && !$tmdbId) throw ApiException::badRequest();

        // Checking whether a movie exists by a given ID
        $movieExists = $movieId && Movie::find($movieId)->exists();

        // If the movie is not found, then search by TMDB ID
        if (!$movieExists && $tmdbId) $movieId = app(MovieService::class)->getOrImport($tmdbId)?->id;

        // If the movie ID cannot be found, return an error
        if (!$movieExists && !$movieId) throw ApiException::notFound();

        $username = Str::lower(trim($username));

        // Duplicate check
        $exists = MovieSanction::movieId($movieId)
            ->username($username)
            ->exists();
        if ($exists) throw ApiException::duplicate();

        // Data storage
        return MovieSanction::create([
            'movie_id' => $movieId,
            'device_token' => $deviceToken,
            'username' => $username,
            'type' => $type,
            'reason' => $reason,
            'comment' => $comment ? trim($comment) : null,
            'file_name' => null,
            'occurred_at' => $occurredAt,
        ]);
    }

    /**
     * Approves a movie sanction report.
     *
     * @param User $user
     * @param MovieSanction $sanction
     */
    public function approve(User $user, MovieSanction $sanction): void
    {
        // Permission check
        if (!$user->isAdmin()) throw ApiException::permissionDenied();

        // If the sanction has already been approved
        if ($sanction->approved_at !== null) throw ApiException::duplicate();

        $sanction->update([
            'approved_at' => Carbon::now(),
            'approved_by' => $user->id
        ]);

        // Remove all other pending reports for the same user and movie
        MovieSanction::movieId($sanction->movie_id)
            ->username($sanction->username)
            ->where('id', '!=', $sanction->id)
            ->delete();
    }
}
