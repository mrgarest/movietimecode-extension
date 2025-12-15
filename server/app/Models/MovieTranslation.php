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
        'backdrop_path',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'movie_id' => 'int',
        'storage_id' => 'int',
        'lang_code' => 'string',
        'title' => 'string',
        'poster_path' => 'string',
        'backdrop_path' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
