<?php

namespace App\DTO\Timecode;

use Illuminate\Support\Collection;

class TimecodeData
{
    public function __construct(
        public int $id,
        public int $movieId,
        /** @var Collection<int, TimecodeSegmentData> */
        public Collection $segments,
    ) {}
}
