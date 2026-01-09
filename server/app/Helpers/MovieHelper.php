<?php

namespace App\Helpers;

use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class MovieHelper
{
    /**
     * Splitting a title into several titles, if there are several.
     *
     * @param string $title
     * @return Collection
     */
    public static function getTitles(string $title): Collection
    {
        return collect(explode(' / ', $title))
            ->map(fn($t) => trim($t))
            ->filter()
            ->prepend($title)
            ->unique()
            ->values();
    }
}
