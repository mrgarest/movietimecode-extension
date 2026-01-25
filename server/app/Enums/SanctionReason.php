<?php

namespace App\Enums;

enum SanctionReason: int
{
    case BANNED = 100;
    case STRIKE = 101;
}
