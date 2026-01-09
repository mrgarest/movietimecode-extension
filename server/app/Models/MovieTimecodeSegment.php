<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class MovieTimecodeSegment extends Model
{
    protected $table = 'movie_tc_segments';

    protected $fillable = [
        'user_id',
        'movie_id',
        'timecode_id',
        'tag_id',
        'action_id',
        'start_time',
        'end_time',
        'description',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'user_id' => 'int',
        'movie_id' => 'int',
        'timecode_id' => 'int',
        'tag_id' => 'int',
        'action_id' => 'int',
        'start_time' => 'int',
        'end_time' => 'int',
        'description' => 'string',
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
