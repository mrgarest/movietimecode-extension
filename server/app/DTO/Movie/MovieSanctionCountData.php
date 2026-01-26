<?php

namespace App\DTO\Movie;

class MovieSanctionCountData
{
    public function __construct(
        public int $bans,
        public int $strikes
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            bans: $data['bans'],
            strikes: $data['strikes']
        );
    }

    public function toArray(): array
    {
        return [
            'bans' => $this->bans,
            'strikes' => $this->strikes
        ];
    }
}
