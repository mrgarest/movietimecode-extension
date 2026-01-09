<?php

namespace App\DTO\Movie;

class MoviePreviewData
{
    public function __construct(
        public int $id,
        public int $releaseYear,
        public string $originalTitle,
        public ?string $title = null,
        public ?string $posterPath = null
    ) {}
}
