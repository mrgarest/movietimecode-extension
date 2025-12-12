<?php

namespace App\Models;

use App\Enums\MovieExternalId as EnumsMovieExternalId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class MovieExternalId extends Model
{
    use HasFactory;
    protected $fillable = [
        'movie_id',
        'external_id',
        'value'
    ];
    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }

    public function scopeExternalId(Builder $query, EnumsMovieExternalId $externalId): Builder
    {
        return $query->where('external_id', $externalId->value);
    }

    public function scopeExternalAndValue(Builder $query, EnumsMovieExternalId $externalId, $value): Builder
    {
        return $this->scopeExternalId($query, $externalId)->where('value', $value);
    }
}
