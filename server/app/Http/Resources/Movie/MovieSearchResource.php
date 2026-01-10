<?php

namespace App\Http\Resources\Movie;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MovieSearchResource extends JsonResource
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
        $with = $this->resource->additional['with'] ?? [];

        return [
            'id' => $this->when(
                in_array('movieId', $with),
                $this->resource->id
            ),
            'tmdb_id' => $this->resource->tmdbId,
            'timecode_id' => $this->when(
                in_array('timecodeId', $with),
                $this->resource->timecodeId
            ),
            'timecode_id' => $this->resource->timecodeId,
            'release_year' => $this->resource->releaseYear,
            'title' => $this->resource->title,
            'original_title' => $this->resource->originalTitle,
            'poster_url' => $this->resource->posterUrl
        ];
    }
}
