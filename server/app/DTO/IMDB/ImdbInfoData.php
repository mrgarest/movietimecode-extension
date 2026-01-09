<?php

namespace App\DTO\IMDB;

class ImdbInfoData
{
    public function __construct(
        public ?float $rating = null,
        public ?array $distributors = null
    ) {}
}
