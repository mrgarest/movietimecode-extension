<?php

namespace App\DTO\Timecode;

use Illuminate\Support\Collection;

readonly class TimecodeEditorData
{
    public function __construct(
        public int $id,
        public int $movieId,
        public int $duration,
        public int $releaseYear,
        public string $title,
        public string $originalTitle,
        public ?string $posterUrl = null,
        /** @var Collection<int, TimecodeSegmentData> */
        public Collection $segments,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            movieId: $data['movie_id'],
            duration: $data['duration'],
            releaseYear: $data['release_year'],
            title: $data['title'],
            originalTitle: $data['original_title'],
            segments: collect($data['segments'])->map(fn($s) => TimecodeSegmentData::fromArray($s))
        );
    }
}
