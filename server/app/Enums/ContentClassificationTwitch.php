<?php

namespace App\Enums;

enum ContentClassificationTwitch: int
{
    case DRUGS_INTOXICATION_TOBACCO = 100;
    case GAMBLING = 101;
    case PROFANITY_VULGARITY = 102;
    case SEXUAL_THEMES = 103;
    case VIOLENT_GRAPHIC = 104;
    case POLITICS_AND_SENSITIVE_SOCIAL_ISSUES = 105;   
}