<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImdbContentRating extends Model
{
    protected $table = 'imdb_cr';
    protected $fillable = [
        'movie_id',
        'content_id',
        'level',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'movie_id' => 'int',
        'content_id' => 'int',
        'level' => 'int',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
