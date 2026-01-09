<?php

namespace App\Cache;

class CompanyCacheKey
{
    private const ROT = 'company.';

    public static function name(string $name): string
    {
        return  self::ROT . 'name.' . md5($name);
    }
    
    public static function forMovie(int $id): string
    {
        return  self::ROT . 'forMovie.' . $id;
    }
}
