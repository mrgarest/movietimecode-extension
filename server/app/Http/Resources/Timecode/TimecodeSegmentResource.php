<?php

namespace App\Http\Resources\Timecode;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TimecodeSegmentResource extends JsonResource
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
            'tag_id' => $this->resource->tag->value,
            'action_id' => $this->resource->actionId,
            'start_time' => $this->resource->startTime,
            'end_time' => $this->resource->endTime,
        ];;
    }
}
