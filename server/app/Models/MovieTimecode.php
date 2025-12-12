<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class MovieTimecode extends Model
{
    use HasFactory;
    protected $table = 'movie_tсs';

    protected $fillable = [
        'user_id',
        'movie_id',
        'duration',
        'like_count',
        'dislike_count',
        'used_count',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function segments()
    {
        return $this->hasMany(MovieTimecodeSegment::class, 'timecode_id');
    }

    public function scopeUserId(Builder $query, $id): Builder
    {
        return $query->where('user_id', $id);
    }

    public function scopeMovieId(Builder $query, $id): Builder
    {
        return $query->where('movie_id', $id);
    }
}
