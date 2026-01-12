<?php

namespace App\Services;

use App\Cache\EventCacheKey;
use App\Enums\EventType;
use App\Models\Event;
use App\Models\MovieTimecode;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class EventService
{
    /**
     * Store a new event.
     *
     * @param string $deviceToken
     * @param EventType $type
     * @param int|string $value
     */
    public function store(string $deviceToken, EventType $type, int|string $value): void
    {
        // Check cache to prevent duplicate events
        $cacheKey = EventCacheKey::store($deviceToken, $type, $value);
        if (Cache::has($cacheKey)) return;

        $now = Carbon::now();
        // Insert the event into the database
        Event::insert([
            'device_token' => $deviceToken,
            'type' => $type->value,
            'value' => $value,
            'created_at' => $now,
            'updated_at' => $now
        ]);

        // Cache the event to prevent duplicates
        Cache::put($cacheKey, true, Carbon::now()->addMinutes(10));

        // Additional actions based on event type
        match ($type) {
            EventType::TIMECODE_USED => MovieTimecode::find((int)$value)->increment('used_count'),
            default => null,
        };
    }
}
