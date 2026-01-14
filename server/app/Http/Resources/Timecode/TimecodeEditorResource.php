<?php

namespace App\Http\Resources\Timecode;

use App\Http\Resources\SuccessResource;
use Illuminate\Http\Request;

class TimecodeEditorResource extends SuccessResource
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
            'movie_id' => $this->resource->movieId,
            'duration' => $this->resource->duration,
            'release_year' => $this->resource->releaseYear,
            'title' => $this->resource->title,
            'original_title' => $this->resource->originalTitle,
            'poster_url' => $this->resource->posterUrl, 
            'content_classifications' => $this->resource->contentClassifications, 
            'segments' => TimecodeSegmentResource::collection($this->resource->segments)
        ];
    }
}
