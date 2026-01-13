<?php

namespace App\Http\Resources\Timecode;

use App\Clients\TmdbClient;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserTimecodeResource extends JsonResource
{
    // Disable the standard ‘data’ wrapper
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $translation = $this->movie->translations->first();
        $posterPath = $translation->poster_path ?? $this->movie->poster_path;

        return [
            'id' => $this->id,
            'is_deleted' => $this->when($this->trashed(), true),
            'user' => [
                'id' => $this->user->id,
                'username' => $this->user->username
            ],
            'movie' => [
                'id' => $this->movie->id,
                'release_year' => Carbon::parse($this->movie->release_date)->year,
                'title' => $translation->title ?? $this->movie->title,
                'poster_url' => $posterPath ? TmdbClient::getImageUrl('w200', str_replace('/', '', $posterPath)) : null,
            ],
            'segments_count' => (int) $this->segments_count,
            'used_count' => $this->used_count,
            'created_at' => $this->created_at->timestamp,
            'updated_at' => $this->updated_at->timestamp
        ];
    }
}
