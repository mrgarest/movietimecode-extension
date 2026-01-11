<?php

namespace App\Http\Resources\Movie;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MovieSearchResource extends JsonResource
{
    // Disable the standard ‘data’ wrapper
    public static $wrap = null;

    private static array $withParams = [];

    /**
     * Set the 'with' parameters for the resource.
     *
     * @param array $with
     */
    public static function setWith(array $with): void
    {
        self::$withParams = $with;
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $with = self::$withParams;

        return [
            'id' => $this->when(in_array('movieId', $with), $this->resource->id),
            'tmdb_id' => $this->resource->tmdbId,
            'timecode_id' => $this->when(in_array('timecodeId', $with), $this->resource->timecodeId),
            'release_year' => $this->resource->releaseYear,
            'title' => $this->resource->title,
            'original_title' => $this->resource->originalTitle,
            'poster_url' => $this->resource->posterUrl
        ];
    }
}
