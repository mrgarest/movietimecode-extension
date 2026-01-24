<?php

namespace App\Cache;

class ImdbCacheKey
{
    private const ROT = 'imdb.';

    public static function id(int $id): string
    {
        return  self::ROT . 'id.' . $id;
    }

    public static function contentRatings(int $id): string
    {
        return  self::ROT . 'contentratings.' . $id;
    }

    public static function cookies(): string
    {
        return  self::ROT . 'cookies';
    }
}
