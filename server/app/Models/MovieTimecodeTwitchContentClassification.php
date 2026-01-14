<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class MovieTimecodeTwitchContentClassification extends Model
{
    protected $table = 'movie_tc_tccs';

    protected $fillable = [
        'user_id',
        'movie_id',
        'timecode_id',
        'value',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'user_id' => 'int',
        'movie_id' => 'int',
        'timecode_id' => 'int',
        'value' => 'int',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function scopeMovieId(Builder $query, $id): Builder
    {
        return $query->where('movie_id', $id);
    }

    public function scopeTimecodeId(Builder $query, $id): Builder
    {
        return $query->where('timecode_id', $id);
    }
}
