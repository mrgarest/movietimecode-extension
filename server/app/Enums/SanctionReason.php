<?php

namespace App\Enums;

enum SanctionReason: int
{
    case OTHER = 100;
    case COPYRIGHT = 101;
    case SEXUAL_CONTENT = 102;
}
