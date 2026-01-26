<?php

namespace App\Cache;

class MovieSanctionCacheKey
{
    private const ROT = 'movie.sanction.';

    public static function counts(int $id): string
    {
        return  self::ROT . 'counts.' . $id;
    }
}
