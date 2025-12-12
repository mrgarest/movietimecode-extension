<?php

namespace App\Enums;

enum ImdbContentRatingId: int
{
    case NUDITY = 100;
    case VIOLENCE = 101;
    case PROFANITY = 102;
    case ALCOHOL = 103;
    case FRIGHTENING = 104;
}
