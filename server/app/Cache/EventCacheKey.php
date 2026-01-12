<?php

namespace App\Cache;

use App\Enums\EventType;

class EventCacheKey
{
    private const ROT = 'event.';

    public static function store(string $deviceToken, EventType $type, int|string $value): string
    {
        return  self::ROT . 'store.' . md5("{$deviceToken}:{$type->value}:{$value}");
    }
}
