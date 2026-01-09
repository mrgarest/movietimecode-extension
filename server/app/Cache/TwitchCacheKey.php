<?php

namespace App\Cache;

class TwitchCacheKey
{
    private const ROT = 'twitch.';

    public static function stream(string $username): string
    {
        return  self::ROT . 'stream.' . md5($username);
    }
}
