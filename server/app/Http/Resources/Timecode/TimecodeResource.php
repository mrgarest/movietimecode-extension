<?php

namespace App\Http\Resources\Timecode;

use App\Http\Resources\SuccessResource;
use Illuminate\Http\Request;

class TimecodeResource extends SuccessResource
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
            'segments' => TimecodeSegmentResource::collection($this->resource->segments),
        ];
    }
}
