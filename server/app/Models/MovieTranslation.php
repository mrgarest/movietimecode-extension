<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovieTranslation extends Model
{
    protected $fillable = [
        'movie_id',
        'storage_id',
        'lang_code',
        'title',
        'poster_path',
        'backdrop_path'
    ];
}
