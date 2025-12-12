<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Movie extends Model
{
    use HasFactory;
    protected $fillable = [
        'storage_id',
        'lang_code',
        'title',
        'duration',
        'poster_path',
        'backdrop_path',
        'rating_imdb',
        'release_date',
    ];

    protected $casts = [
        'release_date' => 'datetime',
    ];

    public function imdbContentRatings()
    {
        return $this->hasMany(ImdbContentRating::class, 'movie_id', 'id');
    }

    public function externalIds()
    {
        return $this->hasMany(MovieExternalId::class);
    }
    
    public function companies()
    {
        return $this->hasMany(MovieCompany::class);
    }
    public function movieTimecodes()
    {
        return $this->hasMany(MovieTimecode::class);
    }

    public function movieTimecodeSegments()
    {
        return $this->hasMany(MovieTimecodeSegment::class);
    }

    public function translations()
    {
        return $this->hasMany(MovieTranslation::class);
    }

    public static function findByTitle($title)
    {
        return self::where('title', 'like', "%$title%");
    }

    public static function findWithTranslation($id, $langCode, array $select = [['*'], ['*']])
    {
        return self::with([
            'translation' => function ($query) use ($select, $langCode) {
                $query->select(array_merge(['id', 'movie_id', 'lang_code'], $select[1]))->where('lang_code', $langCode);
            }
        ])->select(array_merge(['id'], $select[0]))->where('id', $id);
    }
}
