<?php

namespace App\Cache;

class TwitchCacheKey
{
    private const ROT = 'twitch.';

    public static function stream(int $id): string
    {
        return  self::ROT . 'stream.' . $id;
    }

    public static function accountId(int $id): string
    {
        return  self::ROT . 'ccountId.' . $id;
    }
}
