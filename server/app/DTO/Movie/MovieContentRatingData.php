<?php

namespace App\DTO\Movie;

use App\Enums\ImdbContentRatingId;

class MovieContentRatingData
{
    public function __construct(
        public ImdbContentRatingId $content,
        public int $level,
    ) {}

    public static function fromModel($rating): self
    {
        return new self(
            content: ImdbContentRatingId::from($rating->content_id),
            level: $rating->level
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            content: ImdbContentRatingId::from($data['content_id']),
            level: $data['level']
        );
    }

    public function toArray(): array
    {
        return [
            'content_id' => $this->content->value,
            'level' => $this->level,
        ];
    }
}
