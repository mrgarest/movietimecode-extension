<?php

namespace App\Enums;

enum EventType: string
{
    case CHECK_MOVIE = 'CHECK_MOVIE';
    case TIMECODE_USED = 'TIMECODE_USED';
}
