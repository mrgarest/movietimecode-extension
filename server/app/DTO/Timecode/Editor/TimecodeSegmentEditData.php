<?php

namespace App\DTO\Timecode\Editor;

use App\Enums\TimecodeTag;

readonly class TimecodeSegmentEditData {
    public function __construct(
        public TimecodeTag $tag,
        public int $startTime,
        public int $endTime,
        public ?string $description,
        public ?int $id,
    ) {}
}