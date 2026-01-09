<?php

namespace App\DTO\Movie;

use App\Clients\TmdbClient;
use Carbon\Carbon;

class MovieSearchData
{
    public function __construct(
        public int $tmdbId,
        public int $releaseYear,
        public string $title,
        public string $originalTitle,
        public ?string $posterUrl = null,
        public ?int $id = null
    ) {}

    public static function fromTmdb(array $data): self
    {
        return new self(
            id: null,
            releaseYear: Carbon::parse($data['release_date'])->year,
            tmdbId: $data['id'],
            title: $data['title'],
            originalTitle: $data['original_title'],
            posterUrl: TmdbClient::getImageUrl('w200', str_replace('/', '', $data['poster_path']))
        );
    }
}
