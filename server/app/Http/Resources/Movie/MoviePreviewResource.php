<?php

namespace App\Http\Resources\Movie;

use App\Clients\TmdbClient;
use App\Http\Resources\SuccessResource;
use Illuminate\Http\Request;

class MoviePreviewResource extends SuccessResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'release_year' => $this->resource->releaseYear,
            'title' => $this->resource->title ?? $this->resource->originalTitle,
            'original_title' => $this->resource->originalTitle,
            'poster_url' => TmdbClient::getImageUrl('w200', $this->resource->posterPath)
        ];
    }
}
