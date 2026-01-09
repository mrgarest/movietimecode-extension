<?php

namespace App\Http\Resources\Timecode;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TimecodeAuthorResource extends JsonResource
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
            'user' => [
                'id' => $this->resource->userId,
                'username' => $this->resource->username,
            ],
            'timecode' => [
                'id' => $this->resource->timecodeId,
                'duration' => $this->resource->duration,
                'like_count' => $this->resource->like_count,
                'dislike_count' => $this->resource->dislike_count,
                'used_count' => $this->resource->used_count,
                'segment_count' => $this->resource->segment_count,
            ],
        ];
    }
}
