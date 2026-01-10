<?php

namespace App\DTO\Timecode;

use App\Enums\TimecodeTag;
use App\Models\MovieTimecodeSegment;

class TimecodeSegmentData
{
    public function __construct(
        public int $id,
        public TimecodeTag $tag,
        public int $startTime,
        public int $endTime,
        public ?int $actionId = null,
        public ?string $description = null
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            tag: TimecodeTag::from($data['tag_id']),
            actionId: $data['action_id'],
            startTime: $data['start_time'],
            endTime: $data['end_time'],
            description: $data['description'] ?? null,
        );
    }

    public static function fromModel(MovieTimecodeSegment $model): self
    {
        return new self(
            id: $model->id,
            tag: TimecodeTag::from($model->tag_id),
            actionId: $model->action_id,
            startTime: $model->start_time,
            endTime: $model->end_time,
            description: $model->description,
        );
    }

    public static function toArrayFromModel(MovieTimecodeSegment $model): array
    {
        return [
            'id' => $model->id,
            'tag_id' => $model->tag_id,
            'action_id' => $model->action_id,
            'start_time' => $model->start_time,
            'end_time' => $model->end_time,
            'description' => $model->description,
        ];
    }
}
