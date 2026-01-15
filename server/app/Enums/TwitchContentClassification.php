<?php

namespace App\Enums;

enum TwitchContentClassification: int
{
    case DRUGS_INTOXICATION_TOBACCO = 100;
    case GAMBLING = 101;
    case PROFANITY_VULGARITY = 102;
    case SEXUAL_THEMES = 103;
    case VIOLENT_GRAPHIC = 104;
    case POLITICS_AND_SENSITIVE_SOCIAL_ISSUES = 105;

    /**
     * Get a text ID for the Twitch API.
     */
    public function toTwitchLabel(): string
    {
        return match ($this) {
            self::DRUGS_INTOXICATION_TOBACCO => 'DrugsIntoxication',
            self::GAMBLING => 'Gambling',
            self::PROFANITY_VULGARITY => 'ProfanityVulgarity',
            self::SEXUAL_THEMES => 'SexualThemes',
            self::VIOLENT_GRAPHIC => 'ViolentGraphic',
            self::POLITICS_AND_SENSITIVE_SOCIAL_ISSUES => 'DebatedSocialIssuesAndPolitics',
        };
    }
}
