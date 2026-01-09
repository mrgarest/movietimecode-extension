<?php

namespace App\Enums;

enum ImdbContentRatingId: int
{
    case NUDITY = 100;
    case VIOLENCE = 101;
    case PROFANITY = 102;
    case ALCOHOL = 103;
    case FRIGHTENING = 104;

    /**
     * Returns a map of parser keys to Enum objects
     */
    public static function supportedMap(): array
    {
        return [
            'nudity' => self::NUDITY,
            'violence' => self::VIOLENCE,
            'profanity' => self::PROFANITY,
            'alcohol' => self::ALCOHOL,
            'frightening' => self::FRIGHTENING,
        ];
    }
}
