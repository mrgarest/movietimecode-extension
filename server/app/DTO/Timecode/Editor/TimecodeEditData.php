<?php

namespace App\DTO\Timecode\Editor;

use App\DTO\Timecode\Editor\TimecodeSegmentEditData;
use App\Enums\TimecodeTag;
use Illuminate\Support\Collection;

readonly class TimecodeEditData
{
    public function __construct(
        public int $duration,
        
        /** @var Collection<int, TimecodeSegmentEditData> */
        public Collection $segments,

        /** @var array<int>|null */
        public ?array $contentClassifications = null
    ) {}

    public static function fromRequest(array $validated): self
    {
        return new self(
            duration: (int)$validated['duration'],
            contentClassifications: $validated['content_classifications'] ?? null,
            segments: collect($validated['segments'] ?? [])->map(fn($s) => new TimecodeSegmentEditData(
                id: $s['id'] ?? null,
                tag: TimecodeTag::from($s['tag_id']),
                startTime: (int)$s['start_time'],
                endTime: (int)$s['end_time'],
                description: $s['description'] ?? null
            ))
        );
    }
}
