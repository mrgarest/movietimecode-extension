<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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

    public static function findByTimecodeId($timecodeId)
    {
        return self::where('timecode_id', $timecodeId)->orderBy('start_time');
    }
}
