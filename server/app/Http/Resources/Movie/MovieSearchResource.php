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
        return [
            'id' => $this->resource->id,
            'tmdb_id' => $this->resource->tmdbId,
            'release_year' => $this->resource->releaseYear,
            'title' => $this->resource->title,
            'original_title' => $this->resource->originalTitle,
            'poster_url' => $this->resource->posterUrl
        ];
    }
}
