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
        'description'
    ];

    public function scopeTimecodeId(Builder $query, $id): Builder
    {
        return $query->where('timecode_id', $id);
    }
}
