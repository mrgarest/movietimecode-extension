<?php

namespace App\Cache;

class MovieCacheKey
{
    private const ROT = 'movie.';

    public static function searchTmdb(string $title, int $page = 1, ?int $year = null): string
    {
        return  self::ROT . 'search.tmdb.' . md5($title) . '.' . $page . ($year != null ? '.' . $year : '');
    }

    public static function preview(string $title, ?int $year = null): string
    {
        return  self::ROT . 'search.' . md5($title) . ($year != null ? '.' . $year : '');
    }

    public static function externalTmdbId(int $id): string
    {
        return  self::ROT . 'external.tmdb.' . $id;
    }

    public static function id(int $id): string
    {
        return  self::ROT . 'id.' . $id;
    }

    public static function translation(int $id, string $langCode): string
    {
        return  self::ROT . 'translation.' . $id . '.' . $langCode;
    }
}
