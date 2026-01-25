<?php

namespace App\Models;

use App\Enums\SanctionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class MovieSanction extends Model
{
    protected $fillable = [
        'movie_id',
        'device_token',
        'username',
        'type',
        'comment',
        'file_name',
        'occurred_at',
        'approved_at',
        'approved_by',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'movie_id' => 'int',
        'device_token' => 'string',
        'username' => 'string',
        'type' => SanctionType::class,
        'comment' => 'string',
        'file_name' => 'string',
        'occurred_at' => 'datetime',
        'approved_at' => 'datetime',
        'approved_by' => 'int',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];


    protected static function booted()
    {
        static::deleting(function (MovieSanction $report) {
            if ($report->file_name) {
            }
        });
    }

    public function scopeMovieId(Builder $query, int $id): Builder
    {
        return $query->where('movie_id', $id);
    }

    public function scopeUsername(Builder $query, string $username): Builder
    {
        return $query->where('username', $username);
    }
}
